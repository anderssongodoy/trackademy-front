import React from "react";
import Link from "next/link";

interface NavbarProps {
  showUserMenu?: boolean;
  userEmail?: string;
  userName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  showUserMenu = false,
  userEmail,
  userName,
}) => {
  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition">
            <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center text-white font-bold">
              T
            </div>
            <h1 className="text-xl font-bold text-slate-900">Trackademy</h1>
          </Link>

          {showUserMenu && (
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-900">
                  {userName || "Usuario"}
                </p>
                <p className="text-xs text-slate-500">
                  {userEmail}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
