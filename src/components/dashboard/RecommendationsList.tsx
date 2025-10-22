"use client";
import React from "react";
import { Recommendation } from "@/types/student";

export default function RecommendationsList({ items }: { items: Recommendation[] | null }) {
  if (!items || items.length === 0) return <div className="bg-white/3 p-4 rounded-lg text-white/70">No hay recomendaciones por el momento.</div>;
  return (
    <div className="space-y-2">
      {items.map((r, i) => (
        <div key={i} className="p-3 rounded-lg bg-white/3 border border-white/10 flex justify-between items-center">
          <div>
            <div className="font-semibold text-white">{r.title ?? r.code ?? 'Recomendación'}</div>
            <div className="text-xs text-white/70">{r.reason ?? ''}</div>
          </div>
          <button className="px-3 py-1 bg-white/10 rounded">Ver</button>
        </div>
      ))}
    </div>
  );
}
