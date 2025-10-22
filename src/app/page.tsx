"use client";

import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui";
import { useEffect, useState } from "react";
import { onboardingService } from "@/services/onboardingService";


interface CustomSession {
  user?: {
    email?: string;
    name?: string;
    // add other user properties as needed
  };
  idToken?: string;
  // add other session properties as needed
}

export default function Home() {
  const { data: session } = useSession() as { data: CustomSession | null };
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      if (!session) return;
      try {
        const token = session?.idToken;
        if (!token) return;
        const done = await onboardingService.getOnboardingStatus(token);
        if (mounted) setOnboardingDone(done === true);
      } catch {
        if (mounted) setOnboardingDone(false);
      }
    };
    check();
    return () => { mounted = false; };
  }, [session]);

  // Lógica para el botón principal
  let mainButtonAction = null;
  let mainButtonText = "¡Sube de nivel! 🚀";
  if (!session) {
    mainButtonAction = () => signIn("microsoft-entra-id");
  } else if (onboardingDone === false) {
    mainButtonAction = () => window.location.href = "/onboarding";
    mainButtonText = "Completa tu onboarding";
  } else if (onboardingDone === true) {
    mainButtonAction = () => window.location.href = "/dashboard";
    mainButtonText = "Ir al Panel";
  }

  return (
    <div className="min-h-screen bg-[#18132a] flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-3xl mx-auto text-center animate-fade-in">
        <div className="mb-10">
          <h1 className="text-5xl sm:text-7xl font-black text-white mb-4 leading-tight">
            <span className="block text-[#7c3aed]">Desbloquea</span>
            <span className="block">Tu Potencial,</span>
            <span className="block text-[#a21caf]">Un Pixel</span>
            <span className="block">a la vez</span>
          </h1>
          <p className="text-lg sm:text-xl text-[#c7d2fe] mb-8 max-w-xl mx-auto">
            Tu camino hacia la excelencia académica comienza aquí. Explora cursos, conecta con compañeros y conquista tus metas en un entorno divertido y retro-futurista.
          </p>
          <Button
            size="lg"
            className="bg-[#7c3aed] hover:bg-[#a21caf] text-white font-bold px-8 py-4 text-lg shadow-lg"
            fullWidth
            onClick={mainButtonAction}
          >
            {mainButtonText}
          </Button>
          {session && (
            <Button
              size="lg"
              fullWidth
              className="bg-[#18132a] hover:bg-[#312e81] text-white font-bold mt-4"
              onClick={() => {
                // Cierra sesión y redirige a la landing
                import('next-auth/react').then(({ signOut }) => signOut({ callbackUrl: '/' }));
              }}
            >
              Cerrar sesión
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          <div className="bg-[#23203b] border border-[#7c3aed] rounded-2xl p-6 flex flex-col items-center shadow-lg">
            <div className="text-4xl mb-2 text-yellow-300">📅</div>
            <p className="text-white font-bold text-lg mb-1">Mi Horario</p>
            <p className="text-[#c7d2fe] text-sm">Consulta tus clases y fechas importantes.</p>
          </div>
          <div className="bg-[#23203b] border border-[#a21caf] rounded-2xl p-6 flex flex-col items-center shadow-lg">
            <div className="text-4xl mb-2 text-green-300">📚</div>
            <p className="text-white font-bold text-lg mb-1">Materiales</p>
            <p className="text-[#c7d2fe] text-sm">Accede a tus apuntes y recursos.</p>
          </div>
          <div className="bg-[#23203b] border border-pink-700 rounded-2xl p-6 flex flex-col items-center shadow-lg">
            <div className="text-4xl mb-2 text-pink-300">💬</div>
            <p className="text-white font-bold text-lg mb-1">Vida Campus</p>
            <p className="text-[#c7d2fe] text-sm">Conecta con clubes y eventos.</p>
          </div>
        </div>
      </div>
      <footer className="w-full max-w-3xl mx-auto text-center text-xs sm:text-sm text-[#c7d2fe] mt-12 border-t border-[#312e81] pt-6">
        <p>© 2025 Trackademy. Plataforma académica retro-futurista para la UTP.</p>
      </footer>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#18132a] flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-3xl mx-auto text-center animate-fade-in">
        <div className="mb-10">
          <h1 className="text-5xl sm:text-7xl font-black text-white mb-4 leading-tight">
            <span className="block text-[#7c3aed]">Desbloquea</span>
            <span className="block">Tu Potencial,</span>
            <span className="block text-[#a21caf]">Un Pixel</span>
            <span className="block">a la vez</span>
          </h1>
          <p className="text-lg sm:text-xl text-[#c7d2fe] mb-8 max-w-xl mx-auto">
            Tu camino hacia la excelencia académica comienza aquí. Explora cursos, conecta con compañeros y conquista tus metas en un entorno divertido y retro-futurista.
          </p>
          <Button
            size="lg"
            className="bg-[#7c3aed] hover:bg-[#a21caf] text-white font-bold px-8 py-4 text-lg shadow-lg"
            onClick={() => signIn("microsoft-entra-id", { callbackUrl: "/onboarding" })}
            fullWidth
          >
            ¡Sube de nivel! 🚀
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          <div className="bg-[#23203b] border border-[#7c3aed] rounded-2xl p-6 flex flex-col items-center shadow-lg">
            <div className="text-4xl mb-2 text-yellow-300">📅</div>
            <p className="text-white font-bold text-lg mb-1">Mi Horario</p>
            <p className="text-[#c7d2fe] text-sm">Consulta tus clases y fechas importantes.</p>
          </div>
          <div className="bg-[#23203b] border border-[#a21caf] rounded-2xl p-6 flex flex-col items-center shadow-lg">
            <div className="text-4xl mb-2 text-green-300">📚</div>
            <p className="text-white font-bold text-lg mb-1">Materiales</p>
            <p className="text-[#c7d2fe] text-sm">Accede a tus apuntes y recursos.</p>
          </div>
          <div className="bg-[#23203b] border border-pink-700 rounded-2xl p-6 flex flex-col items-center shadow-lg">
            <div className="text-4xl mb-2 text-pink-300">💬</div>
            <p className="text-white font-bold text-lg mb-1">Vida Campus</p>
            <p className="text-[#c7d2fe] text-sm">Conecta con clubes y eventos.</p>
          </div>
        </div>
      </div>
      <footer className="w-full max-w-3xl mx-auto text-center text-xs sm:text-sm text-[#c7d2fe] mt-12 border-t border-[#312e81] pt-6">
        <p>© 2025 Trackademy. Plataforma académica retro-futurista para la UTP.</p>
      </footer>
    </div>
  );
}
