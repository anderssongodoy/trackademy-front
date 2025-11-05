"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { subscribe } from "@/lib/loadingBus";

type Ctx = { begin: (text?: string) => void; end: () => void; active: boolean; text?: string };
const LoadingCtx = createContext<Ctx | null>(null);

export function useLoading() {
  const ctx = useContext(LoadingCtx);
  if (!ctx) throw new Error("useLoading must be used within LoadingProvider");
  return ctx;
}

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [count, setCount] = useState(0);
  const [text, setText] = useState<string | undefined>(undefined);

  useEffect(() => subscribe((t) => { setText(t); setCount((c) => c + 1); }, () => setCount((c) => Math.max(0, c - 1))), []);

  const value = useMemo<Ctx>(() => ({
    begin: (t?: string) => { setText(t); setCount((c) => c + 1); },
    end: () => setCount((c) => Math.max(0, c - 1)),
    active: count > 0,
    text,
  }), [count, text]);

  return (
    <LoadingCtx.Provider value={value}>
      {children}
      {count > 0 ? (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50">
          <div className="flex flex-col items-center gap-3 px-5 py-4 rounded-2xl border border-[#7c3aed] bg-[#23203b]/95">
            <div className="w-8 h-8 border-2 border-white/30 border-t-[#7c3aed] rounded-full animate-spin" />
            <div className="text-white/80 text-sm">{text || "Cargando..."}</div>
          </div>
        </div>
      ) : null}
    </LoadingCtx.Provider>
  );
};

