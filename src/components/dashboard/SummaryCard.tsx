"use client";
import React from "react";
import { StudentMe } from "@/types/student";

export default function SummaryCard({ me }: { me: StudentMe | null }) {
  return (
    <div className="bg-white/5 p-4 rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-white font-semibold">{me?.name ?? "Estudiante"}</div>
          <div className="text-white/70 text-sm">{me?.programId ? `Programa: ${me.programId}` : "Programa no definido"}</div>
        </div>
        <div className="text-right">
          <div className="text-white/90">{me?.currentTerm?.code ?? "-"}</div>
          <div className="text-xs text-white/60">Término</div>
        </div>
      </div>
    </div>
  );
}
