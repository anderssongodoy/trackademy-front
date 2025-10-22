"use client";
import React from "react";
import { AlertItem } from "@/types/student";

export default function AlertsList({ alerts, onMark }: { alerts: AlertItem[] | null; onMark?: (id: string) => void }) {
  if (!alerts || alerts.length === 0) return (
    <div className="bg-white/3 p-4 rounded-lg text-center text-white/70">No hay alertas. Puedes conectar más datos para recibir notificaciones.</div>
  );
  return (
    <div className="space-y-2">
      {alerts.map((a) => (
        <div key={a.id} className={`p-3 rounded-lg border ${a.level === 'critical' ? 'border-red-500' : 'border-white/10'} bg-white/3`}> 
          <div className="flex justify-between items-start">
            <div>
              <div className="font-semibold text-white">{a.title}</div>
              <div className="text-xs text-white/70">{a.message}</div>
            </div>
            <div className="ml-2">
              <button onClick={() => onMark?.(a.id)} className="text-sm px-2 py-1 bg-white/10 rounded">Marcar</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
