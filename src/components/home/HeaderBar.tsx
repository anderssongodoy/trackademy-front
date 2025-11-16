"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

function formatShort(d: Date) {
  return d.toLocaleDateString("es-PE", { weekday: "short", day: "2-digit", month: "short" });
}

export default function HeaderBar() {
  const { data: session } = useSession();
  const user = (session as { user?: { image?: string | null; name?: string | null } } | null)?.user;
  const [userMenu, setUserMenu] = useState(false);
  const hoy = new Date();

  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-3xl sm:text-4xl font-black text-white">Tu espacio</h1>
        <div className="text-white/60 mt-1 text-sm">Hoy {formatShort(hoy)}</div>
      </div>
      <div className="relative">
        <button
          onClick={() => setUserMenu((s) => !s)}
          className="w-9 h-9 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center overflow-hidden hover:bg-white/15"
          aria-label="Menú de usuario"
        >
          {user?.image ? (
            <img src={user.image} alt={user?.name || "Usuario"} className="w-full h-full object-cover" />
          ) : (
            <span className="font-semibold">{(user?.name || "U").trim().charAt(0).toUpperCase()}</span>
          )}
        </button>
        {userMenu ? (
          <div className="absolute right-0 mt-2 w-40 bg-[#23203b] border border-[#7c3aed] rounded-xl shadow-xl p-1 z-10">
            <Link href="/perfil" className="block px-3 py-2 text-white/90 hover:text-white hover:bg-white/10 rounded-lg">Perfil</Link>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full text-left px-3 py-2 text-white/90 hover:text-white hover:bg-white/10 rounded-lg"
            >
              Cerrar sesión
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

