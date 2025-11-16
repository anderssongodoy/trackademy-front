"use client";

import { type ScheduleEvent } from "@/components/hitos/types";
import { type UsuarioEvaluacionDto } from "@/services/meService";

export default function DayDetails({
  selected,
  selectedClases,
  selectedHitos,
}: {
  selected: Date;
  selectedClases: ScheduleEvent[];
  selectedHitos: Array<{ ev: UsuarioEvaluacionDto; info?: { curso?: string; cursoId?: number } | undefined }>;
}) {
  return (
    <div className="bg-[#23203b] border border-[#7c3aed] rounded-2xl p-4">
      <div className="font-semibold text-white mb-2">
        {selected.toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" })}
      </div>
      <div className="space-y-4">
        <div>
          <div className="text-white/80 font-medium mb-2">Clases</div>
          {selectedClases.length === 0 ? (
            <div className="text-white/60">No hay clases este día.</div>
          ) : (
            <ul className="space-y-2">
              {selectedClases.map((s, idx) => (
                <li key={idx} className="bg-white/5 border border-white/10 rounded-xl p-3 text-white/90">
                  <div className="flex items-center justify-between">
                    <a href={`/home/cursos/${s.cursoId}`} className="font-medium hover:underline">{s.curso}</a>
                    <span className="text-white/70 text-sm">{s.horaInicio}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <div className="text-white/80 font-medium mb-2">Hitos</div>
          {selectedHitos.length === 0 ? (
            <div className="text-white/60">No hay hitos este día.</div>
          ) : (
            <ul className="space-y-2">
              {selectedHitos.map(({ ev, info }) => (
                <li key={ev.id} className="bg-white/5 border border-white/10 rounded-xl p-3 text-white/90">
                  <div className="flex items-center justify-between">
                    <a href={`/home/cursos/${info?.cursoId ?? ""}`} className="font-medium hover:underline">
                      {info?.curso ?? "Curso"}
                    </a>
                    <span className="text-white/70 text-sm">{ev.codigo ?? "Hito"}</span>
                  </div>
                  {ev.descripcion && (
                    <div className="text-white/70 text-sm mt-1">{ev.descripcion}</div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

