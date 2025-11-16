"use client";

import { useEffect, useMemo, useState } from "react";
import { subscribeToast, type ToastEvent } from "@/lib/toastBus";

type Item = ToastEvent & { id: string };

function uid() { return Math.random().toString(36).slice(2, 9); }

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => subscribeToast((t) => {
    const item: Item = { id: t.id || uid(), kind: t.kind || "info", message: t.message, timeoutMs: t.timeoutMs ?? 3500 };
    setItems((prev) => [...prev, item]);
    const ms = item.timeoutMs || 3500;
    const timer = setTimeout(() => setItems((prev) => prev.filter((x) => x.id !== item.id)), ms);
    return () => clearTimeout(timer);
  }), []);

  const styleByKind: Record<string, string> = useMemo(() => ({
    info: "bg-[#23203b] border-white/20 text-white/90",
    success: "bg-emerald-900/70 border-emerald-500/50 text-emerald-100",
    warning: "bg-amber-900/60 border-amber-500/50 text-amber-100",
    error: "bg-red-900/60 border-red-500/50 text-red-100",
  }), []);

  return (
    <>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[1100] flex flex-col gap-2">
        {items.map((t) => (
          <div key={t.id} className={`pointer-events-auto rounded-xl border px-3 py-2 shadow-lg text-sm ${styleByKind[t.kind || "info"]}`}>
            {t.message}
          </div>
        ))}
      </div>
    </>
  );
}

