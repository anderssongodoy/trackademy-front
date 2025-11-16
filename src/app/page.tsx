"use client";

import { useSession, signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { getLoginStatus, type LoginStatus } from "@/services/accountService";

export default function Landing() {
  const { data: session } = useSession();
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "checking" | "needs" | "ok">("idle");
  const token = (session as { idToken?: string; user?: { image?: string } } | null)?.idToken;
  const userImage = (session as { idToken?: string; user?: { image?: string } } | null)?.user?.image;

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!token) { setStatus("idle"); return; }
      setStatus("checking");
      const s: LoginStatus | null = await getLoginStatus(token, userImage);
      if (!mounted) return;
      if (s && s.needsOnboarding) setStatus("needs");
      else if (s && !s.needsOnboarding) setStatus("ok");
      else setStatus("ok");
    })();
    return () => { mounted = false; };
  }, [token, userImage]);

  const onPrimary = () => {
    if (!session) { void signIn("microsoft-entra-id"); return; }
    if (status === "needs") { router.push("/onboarding"); return; }
    router.push("/home");
  };

  const buttonText = !session
    ? "Iniciar sesión"
    : status === "checking"
      ? "Entrando..."
      : status === "needs"
        ? "Completa tu onboarding"
        : "Ir a mi espacio";

  return (
    <div className="min-h-screen bg-[#18132a] flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-3xl mx-auto text-center animate-fade-in">
        <div className="mb-10">
          <h1 className="text-5xl sm:text-7xl font-black text-white mb-4 leading-tight">
            <span className="block text-[#7c3aed]">TrackAdemy</span>
            <span className="block">Tu espacio académico</span>
          </h1>
          <p className="text-lg sm:text-xl text-[#c7d2fe] mb-8 max-w-xl mx-auto">
            Organiza tus cursos, registra notas y prepárate para tus próximos hitos.
          </p>
          <Button
            size="lg"
            className="bg-[#7c3aed] hover:bg-[#a21caf] text-white font-bold px-8 py-4 text-lg shadow-lg"
            onClick={onPrimary}
            disabled={status === "checking"}
            fullWidth
          >
            {buttonText}
          </Button>
        </div>
      </div>
    </div>
  );
}
















