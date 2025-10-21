import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SessionProvider } from "next-auth/react";

export const metadata: Metadata = {
  title: "Trackademy - Gestión Académica Inteligente",
  description: "Plataforma de gestión de vida académica diseñada para estudiantes de la UTP",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased bg-linear-to-br from-slate-50 to-slate-100">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}

