"use client";

import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && session) {
      router.push("/onboarding");
    }
  }, [status, session, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center p-4">
        <div className="animate-pulse">
          <div className="w-12 h-12 bg-primary-500 rounded-full mx-auto"></div>
        </div>
      </div>
    );
  }

  if (status === "authenticated") {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950 bg-linear-to-b from-slate-950 via-primary-950 to-slate-950 overflow-hidden flex items-center justify-center p-4 sm:p-6">
      <div className="fixed inset-0 opacity-20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-secondary-500 rounded-full mix-blend-multiply filter blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary-500 rounded-full mix-blend-multiply filter blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 hover:opacity-80 transition mb-6">
            <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center text-white font-black">
              T
            </div>
            <span className="text-white font-black text-xl">Trackademy</span>
          </Link>
        </div>

        <div className="bg-white/10 backdrop-blur border border-white/20 rounded-3xl p-6 sm:p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center text-white text-3xl mx-auto mb-4">
              🎓
            </div>
            <h1 className="text-3xl font-black text-white mb-2">Inicia Sesión</h1>
            <p className="text-primary-200 text-sm">
              Accede a tu cuenta Trackademy con Microsoft
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <Button
              size="xl"
              fullWidth
              onClick={() => signIn("azure-ad", { callbackUrl: "/onboarding" })}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6v-11.4H24V24zM11.4 12.6H0V1.2h11.4v11.4zm12.6 0H12.6V1.2H24v11.4z" />
              </svg>
              Inicia Sesión con Microsoft
            </Button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-white/10 text-white/60 text-sm font-semibold">O</span>
            </div>
          </div>

          <div className="bg-linear-to-r from-primary-600/20 to-secondary-600/20 backdrop-blur border border-primary-400/30 rounded-2xl p-4 mb-6">
            <p className="text-sm font-bold text-white mb-2">📝 Consejos:</p>
            <ul className="text-xs text-primary-100 space-y-1">
              <li>• Usa tu correo institucional de la UTP</li>
              <li>• Si tienes problemas, contacta a soporte</li>
            </ul>
          </div>

          <Link href="/">
            <Button variant="outline" size="lg" fullWidth>
              Volver a Inicio
            </Button>
          </Link>
        </div>

        <p className="text-center text-xs text-primary-300 mt-6">
          Al iniciar sesión, aceptas nuestros términos y política de privacidad
        </p>
      </div>
    </div>
  );
}
