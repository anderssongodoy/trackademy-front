"use client";

import TimeSelect from "@/components/inputs/TimeSelect";
import meService, { type HorarioBloque } from "@/services/meService";
import { DOW_OPTIONS } from "@/components/hitos/dateUtils";

type CursoMeta = { usuarioCursoId: number; nombre: string };

export default function EditScheduleModal({
  open,
  token,
  curso,
  value,
  onChange,
  onClose,
  onSaved,
}: {
  open: boolean;
  token: string;
  curso: CursoMeta;
  value: HorarioBloque[];
  onChange: (next: HorarioBloque[]) => void;
  onClose: () => void;
  onSaved: (ucid: number, blocks: HorarioBloque[]) => void;
}) {
  const upsert = (index: number, patch: Partial<HorarioBloque>) => {
    const list = [...value];
    const base = list[index] ?? { usuarioCursoId: curso.usuarioCursoId, diaSemana: 1, horaInicio: "08:00", duracionMin: 45 };
    list[index] = { ...base, ...patch, usuarioCursoId: curso.usuarioCursoId } as HorarioBloque;
    onChange(list);
  };
  const add = () => onChange([...value, { usuarioCursoId: curso.usuarioCursoId, diaSemana: 1, horaInicio: "08:00", duracionMin: 45 }]);
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-[#23203b] border border-[#7c3aed] rounded-2xl w-full max-w-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white text-lg font-bold">Configurar horario · {curso.nombre}</h3>
          <button onClick={onClose} className="text-white/70 hover:text-white">Cerrar</button>
        </div>
        <div className="space-y-2 max-h-[60vh] overflow-auto pr-1">
          {value.map((b, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center">
              <select value={b.diaSemana} onChange={(e) => upsert(i, { diaSemana: Number(e.target.value) })} className="col-span-4 rounded-xl bg-[#18132a] border border-[#7c3aed] p-2 text-white">
                {DOW_OPTIONS.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
              </select>
              <TimeSelect value={b.horaInicio} onChange={(v) => upsert(i, { horaInicio: v })} className="col-span-4" />
              <select value={b.duracionMin} onChange={(e) => upsert(i, { duracionMin: Number(e.target.value) })} className="col-span-3 rounded-xl bg-[#18132a] border border-[#7c3aed] p-2 text-white">
                <option value={45}>45 min</option>
                <option value={90}>90 min</option>
                <option value={135}>135 min</option>
                <option value={180}>180 min</option>
              </select>
              <button onClick={() => remove(i)} className="col-span-1 text-white/70 hover:text-white">x</button>
            </div>
          ))}
          <div>
            <button onClick={add} className="text-white/90 border border-[#7c3aed] px-3 py-1 rounded-lg">Añadir bloque</button>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="text-white/70 border border-white/20 px-3 py-1.5 rounded-xl">Cancelar</button>
          <button
            onClick={async () => {
              const ucid = curso.usuarioCursoId;
              const blocks = value.map((b) => ({
                usuarioCursoId: ucid,
                diaSemana: Math.max(1, Math.min(7, Number(b.diaSemana || 1))),
                horaInicio: b.horaInicio || "08:00",
                duracionMin: [45, 90, 135, 180].includes(Number(b.duracionMin)) ? Number(b.duracionMin) : 45,
              }));
              const ok = await meService.postHorario(blocks, token);
              if (ok) {
                const fresh = await meService.getHorario(token, ucid);
                const onlyThis = (fresh || []).filter((x) => Number(x.usuarioCursoId) === Number(ucid)) as HorarioBloque[];
                onSaved(ucid, onlyThis);
                onClose();
              }
            }}
            className="text-white/90 border border-[#7c3aed] px-3 py-1.5 rounded-xl"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

