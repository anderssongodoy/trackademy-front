"use client";

import React from "react";

type Props = {
  items: string[];
  loading?: boolean;
  updatedAt?: Date | null;
  onRefresh?: () => void;
};

export default function RecommendationsPanel({ items, loading, updatedAt, onRefresh }: Props) {
  return (
    <section className="bg-[#23203b] border border-[#7c3aed] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold text-white">Recomendaciones</h2>
        {onRefresh ? (
          <button
            onClick={onRefresh}
            disabled={!!loading}
            className="text-white/80 border border-white/20 px-3 py-1.5 rounded-xl hover:text-white disabled:opacity-60"
          >
            {loading ? "Actualizando..." : "Actualizar"}
          </button>
        ) : null}
      </div>
      {items && items.length > 0 ? (
        <ul className="list-disc pl-6 text-white/80 space-y-1">
          {items.slice(0, 8).map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      ) : (
        <div className="text-white/60">Por ahora no hay recomendaciones.</div>
      )}
      {updatedAt ? (
        <div className="text-white/40 text-xs mt-2">
          {`Actualizado: ${updatedAt.toLocaleDateString('es-PE')} ${updatedAt.toLocaleTimeString('es-PE')}`}
        </div>
      ) : null}
    </section>
  );
}

