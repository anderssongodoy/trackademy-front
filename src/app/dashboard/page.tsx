"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Container, Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from "@/components/ui";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <Container maxWidth="2xl">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center text-white font-bold">
                T
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Trackademy</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-900">
                  {session?.user?.name || "Usuario"}
                </p>
                <p className="text-xs text-slate-500">
                  {session?.user?.email}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </Container>
      </nav>

      <main className="py-8 px-4">
        <Container maxWidth="2xl">
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="text-center py-8">
                <div className="text-4xl mb-2">🎓</div>
                <p className="text-slate-500 text-sm mb-1">Cursos Activos</p>
                <p className="text-3xl font-bold text-primary-600">0</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="text-center py-8">
                <div className="text-4xl mb-2">📊</div>
                <p className="text-slate-500 text-sm mb-1">Promedio General</p>
                <p className="text-3xl font-bold text-accent-600">-</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="text-center py-8">
                <div className="text-4xl mb-2">⏰</div>
                <p className="text-slate-500 text-sm mb-1">Tareas Pendientes</p>
                <p className="text-3xl font-bold text-warning-600">0</p>
              </CardContent>
            </Card>
          </div>

          <Card elevated className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Bienvenido</CardTitle>
                  <CardDescription>
                    Tu sesión se inició exitosamente
                  </CardDescription>
                </div>
                <Badge variant="success">✓ Conectado</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-700">
                <span className="font-semibold">Email:</span> {session?.user?.email}
              </p>
              <p className="text-slate-600">
                Completa tu onboarding para comenzar a gestionar tus cursos y mejorar tu desempeño académico.
              </p>
              <div className="bg-primary-50 rounded-lg p-4 border border-primary-200 mt-4">
                <p className="text-sm text-primary-900 font-semibold mb-3">
                  Próximos pasos:
                </p>
                <ul className="space-y-2 text-sm text-primary-800">
                  <li className="flex items-start gap-2">
                    <span className="text-primary-600 mt-0.5">→</span>
                    <span>Selecciona tu campus y ciclo académico</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-600 mt-0.5">→</span>
                    <span>Agrega tus cursos actuales</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-600 mt-0.5">→</span>
                    <span>Configura tus alertas y preferencias</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Mis Cursos</CardTitle>
                <CardDescription>
                  Cursos que estás cursando actualmente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-slate-500">
                  <p className="text-6xl mb-2">📚</p>
                  <p>No hay cursos añadidos aún</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actividad Reciente</CardTitle>
                <CardDescription>
                  Tus últimas acciones en la plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-slate-500">
                  <p className="text-6xl mb-2">🔔</p>
                  <p>Sin actividad reciente</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </Container>
      </main>
    </div>
  );
}
