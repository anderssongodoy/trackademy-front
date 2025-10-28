import React from "react";
import Link from "next/link";

interface NavbarProps {
  showUserMenu?: boolean;
  userName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  showUserMenu = false,
  userName,
}) => {
  return (
    <nav className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur border-b border-white/10">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition">
            <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center text-white font-bold">
              T
            </div>
            <h1 className="text-xl font-bold text-white">Trackademy</h1>
          </Link>

          <div className="flex items-center gap-4">
            {!showUserMenu ? (
              <Link href="/login">
                <button className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded transition">
                  Iniciar sesión
                </button>
              </Link>
            ) : (
              <>
                <span className="text-white text-sm font-medium hidden sm:block">{userName || "Estudiante"}</span>
                <Link href="/dashboard">
                  <button className="bg-secondary-600 hover:bg-secondary-700 text-white font-bold py-2 px-4 rounded transition">
                    Panel
                  </button>
                </Link>
                <Link href="/logout">
                  <button className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded transition">
                    Salir
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
