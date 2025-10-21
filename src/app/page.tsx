"use client";

import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import { Button, Badge } from "@/components/ui";

export default function Home() {
  const { data: session } = useSession();

  if (session) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md text-center">
          <div className="mb-8">
            <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center text-white text-3xl mx-auto mb-6">
              ✓
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">
              ¡Bienvenido de vuelta!
            </h1>
            <p className="text-primary-200 text-sm sm:text-base mb-1">
              {session.user?.email}
            </p>
          </div>

          <div className="space-y-3">
            <Link href="/onboarding">
              <Button size="lg" fullWidth>
                Continuar al Onboarding
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="secondary" size="lg" fullWidth>
                Ir al Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 bg-linear-to-b from-slate-950 via-primary-950 to-slate-950 overflow-hidden">
      <div className="fixed inset-0 opacity-20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-secondary-500 rounded-full mix-blend-multiply filter blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary-500 rounded-full mix-blend-multiply filter blur-3xl"></div>
      </div>

      <div className="relative z-10">
        <nav className="sticky top-0 bg-white/10 backdrop-blur-xl border-b border-white/10">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center text-white font-black">
                T
              </div>
              <span className="text-white font-black text-lg sm:text-xl hidden sm:block">Trackademy</span>
            </div>
          </div>
        </nav>

        <div className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 pt-16 sm:pt-20">
          <div className="w-full max-w-2xl text-center mb-12 sm:mb-16 animate-fade-in">
            <Badge variant="secondary" className="mb-4 sm:mb-6 inline-flex">
              🚀 Próxima generación de gestión académica
            </Badge>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white mb-4 sm:mb-6 leading-tight">
              Tu Éxito
              <span className="block bg-gradient-hero bg-clip-text text-transparent">
                Académico Empieza Aquí
              </span>
            </h1>

            <p className="text-base sm:text-lg text-primary-100 mb-8 sm:mb-10 leading-relaxed max-w-xl mx-auto">
              Gestiona cursos, horarios y calificaciones. Recibe alertas inteligentes, mejora tu desempeño y sé más competitivo que nunca.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-16 sm:mb-20">
              <Button
                size="lg"
                onClick={() =>
                  signIn("azure-ad", { callbackUrl: "/onboarding" })
                }
                fullWidth
                className="sm:w-auto"
              >
                🔐 Inicia Sesión con Microsoft
              </Button>
              <Link href="/login" className="block sm:inline-block">
                <Button
                  variant="outline"
                  size="lg"
                  fullWidth
                  className="sm:w-auto"
                >
                  Saber más
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:gap-6 mb-16 sm:mb-20">
              <div className="bg-white/10 backdrop-blur rounded-2xl p-4 sm:p-6 border border-white/20 hover:border-primary-400/50 transition">
                <div className="text-3xl sm:text-4xl mb-2">📚</div>
                <p className="text-white font-bold text-sm sm:text-base">Cursos</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-2xl p-4 sm:p-6 border border-white/20 hover:border-primary-400/50 transition">
                <div className="text-3xl sm:text-4xl mb-2">⏰</div>
                <p className="text-white font-bold text-sm sm:text-base">Horarios</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-2xl p-4 sm:p-6 border border-white/20 hover:border-primary-400/50 transition">
                <div className="text-3xl sm:text-4xl mb-2">📊</div>
                <p className="text-white font-bold text-sm sm:text-base">Notas</p>
              </div>
            </div>
          </div>

          <div className="w-full max-w-2xl grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-16">
            <FeatureCard
              icon="🎯"
              title="Metas"
              description="Establece objetivos"
            />
            <FeatureCard
              icon="🔔"
              title="Alertas"
              description="Notificaciones inteligentes"
            />
            <FeatureCard
              icon="⚡"
              title="Rendimiento"
              description="Mejora tu desempeño"
            />
            <FeatureCard
              icon="🏆"
              title="Incentivos"
              description="Recompensas por logros"
            />
            <FeatureCard
              icon="📈"
              title="Análisis"
              description="Datos en tiempo real"
            />
            <FeatureCard
              icon="🤝"
              title="Comunidad"
              description="Conecta con otros"
            />
          </div>

          <div className="w-full max-w-2xl bg-gradient-to-r from-primary-600/20 to-secondary-600/20 backdrop-blur border border-primary-400/30 rounded-3xl p-6 sm:p-8 text-center">
            <h3 className="text-xl sm:text-2xl font-black text-white mb-3">
              Diseñado para UTepinos
            </h3>
            <p className="text-sm sm:text-base text-primary-100 mb-6">
              Trackademy es una plataforma creada específicamente para estudiantes de la UTP, entendiendo tus necesidades académicas.
            </p>
            <Button
              size="lg"
              fullWidth
              onClick={() =>
                signIn("azure-ad", { callbackUrl: "/onboarding" })
              }
            >
              Empieza Ahora
            </Button>
          </div>
        </div>

        <footer className="border-t border-white/10 bg-white/5 backdrop-blur py-8 px-4 sm:px-6 mt-16 sm:mt-20">
          <div className="max-w-2xl mx-auto text-center text-xs sm:text-sm text-primary-200">
            <p>© 2025 Trackademy. Gestión académica inteligente para la UTP.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-4 hover:border-primary-400/50 transition hover:bg-white/15">
      <div className="text-2xl sm:text-3xl mb-2">{icon}</div>
      <p className="font-bold text-white text-xs sm:text-sm mb-1">{title}</p>
      <p className="text-white/70 text-xs hidden sm:block">{description}</p>
    </div>
  );
}