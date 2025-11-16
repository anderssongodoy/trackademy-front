"use client";

import { useEffect, useState } from "react";
import TimeSelect from "@/components/inputs/TimeSelect";
import { onboardingService } from "@/services/onboardingService";
import meService, { type HorarioBloque, type UsuarioCursoResumenDto } from "@/services/meService";
import { DOW_OPTIONS } from "@/components/hitos/dateUtils";

type CursoMeta = { usuarioCursoId: number; cursoId: number; nombre: string };

export default function PlannerDialog({
  open,
  token,
  cursos,
  horario,
  onClose,
  onHorarioSaved,
}: {
  open: boolean;
  token: string;
  cursos: UsuarioCursoResumenDto[];
  horario: Record<number, HorarioBloque[]>;
  onClose: () => void;
  onHorarioSaved: (ucid: number, blocks: HorarioBloque[]) => void;
}) {
  const [plannerCurso, setPlannerCurso] = useState<CursoMeta | null>(null);
  const [plannerBlocks, setPlannerBlocks] = useState<HorarioBloque[]>([]);
  const [plannerTargetMin, setPlannerTargetMin] = useState<number>(0);
  const [plannerLoading, setPlannerLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!open) return;
    setPlannerCurso(null);
    setPlannerBlocks([]);
    setPlannerTargetMin(0);
  }, [open]);

  const fmt2 = (n: number) => (n < 10 ? `0${n}` : String(n));
  function addMinutes(hhmm: string, delta: number): { time: string; overflow: boolean } {
    const [h, m] = (hhmm || "08:00").split(":").map((x) => Number(x) || 0);
    const total = h * 60 + m + delta;
    const endHour = 22;
    const endTotal = endHour * 60 + 59;
    if (total > endTotal) return { time: "08:00", overflow: true };
    const nh = Math.floor(total / 60);
    const nm = total % 60;
    return { time: `${fmt2(nh)}:${fmt2(nm)}`, overflow: false };
  }
  function nextDay(d: number): number { return d >= 7 ? 1 : d + 1; }
  function recalcFrom(list: HorarioBloque[], startIndex: number): HorarioBloque[] {
    const res = [...list];
    for (let j = startIndex + 1; j < res.length; j++) {
      const prevB = res[j - 1];
      const { time, overflow } = addMinutes(prevB.horaInicio, 45);
      res[j] = { ...res[j], diaSemana: overflow ? nextDay(prevB.diaSemana) : prevB.diaSemana, horaInicio: overflow ? "08:00" : time };
    }
    return res;
  }
  const ensurePlannerLength = (ucid: number, targetMin: number, seed: HorarioBloque[]) => {
    const per45 = Math.max(0, Math.floor(targetMin / 45));
    if (!seed || seed.length === 0) {
      const out: HorarioBloque[] = [];
      let hh = 8, mm = 0;
      for (let i = 0; i < per45; i++) {
        out.push({ usuarioCursoId: ucid, diaSemana: 1, horaInicio: `${hh < 10 ? `0${hh}` : hh}:${mm < 10 ? `0${mm}` : mm}`, duracionMin: 45 });
        const total = hh * 60 + mm + 45; hh = Math.floor(total / 60); mm = total % 60;
      }
      return out;
    }
    const list = [...seed];
    while (list.length < per45) list.push({ usuarioCursoId: ucid, diaSemana: 1, horaInicio: "08:00", duracionMin: 45 });
    if (list.length > per45) list.length = per45;
    for (let i = 1; i < list.length; i++) {
      const prev = list[i - 1];
      const cur = list[i];
      if (prev.diaSemana === cur.diaSemana) {
        const [h,m] = prev.horaInicio.split(":").map(n => Number(n));
        const mins = h*60+m + 45;
        const nh = Math.floor(mins/60); const nm = mins%60;
        list[i] = { ...cur, horaInicio: `${nh<10?`0${nh}`:nh}:${nm<10?`0${nm}`:nm}` } as HorarioBloque;
      }
    }
    return list;
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative bg-[#23203b] border border-[#7c3aed] rounded-2xl w-full max-w-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white text-lg font-bold">Configurar horario</h3>
          <button onClick={onClose} className="text-white/70 hover:text-white">Cerrar</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end mb-3">
          <div>
            <label className="block text-white/80 mb-1">Curso</label>
            <select
              value={plannerCurso?.usuarioCursoId ?? ""}
              onChange={async (e) => {
                const raw = e.target.value;
                if (!raw) { setPlannerCurso(null); setPlannerBlocks([]); setPlannerTargetMin(0); return; }
                const ucid = Number(raw);
                const c = cursos.find((x) => x.usuarioCursoId === ucid) || null;
                if (!c) return;
                setPlannerCurso({ usuarioCursoId: c.usuarioCursoId, cursoId: c.cursoId, nombre: c.cursoNombre });
                setPlannerLoading(true);
                const detail = await onboardingService.fetchCursoDetalle(c.cursoId, token);
                const horas = Number(detail?.horasSemanales ?? 0);
                const target = (Number.isFinite(horas) ? horas : 0) * 45;
                setPlannerTargetMin(target);
                const expanded: HorarioBloque[] = [];
                (horario[c.usuarioCursoId] ?? []).forEach((b) => { const n = Math.max(1, Math.floor(Number(b.duracionMin || 45) / 45)); for (let i=0;i<n;i++){ expanded.push({ usuarioCursoId: c.usuarioCursoId, diaSemana: b.diaSemana, horaInicio: b.horaInicio, duracionMin: 45 }); } });
                const base = ensurePlannerLength(c.usuarioCursoId, target, expanded);
                setPlannerBlocks(recalcFrom(base, 0));
                setPlannerLoading(false);
              }}
              className="w-full rounded-xl bg-[#18132a] border border-[#7c3aed] p-2 text-white"
            >
              <option value="">Selecciona un curso</option>
              {cursos.map((c) => (
                <option key={c.usuarioCursoId} value={c.usuarioCursoId}>{c.cursoNombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-white/80 mb-1">Plan semanal</label>
            <div className="text-white/70 text-sm">{plannerLoading ? "Calculando..." : `${plannerBlocks.length * 45} / ${plannerTargetMin} min`}</div>
          </div>
          <div className="text-white/60 text-xs md:text-right">Cada bloque es de 45 min.</div>
        </div>
        {!plannerCurso ? (
          <div className="text-white/60">Selecciona un curso.</div>
        ) : (
          <div className="space-y-2 max-h-[50vh] overflow-auto pr-1">
            {plannerBlocks.map((b, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <select value={b.diaSemana} onChange={(e) => setPlannerBlocks((prev) => {
                  const list=[...prev];
                  list[i] = { ...list[i], diaSemana: Number(e.target.value), horaInicio: "08:00" };
                  return recalcFrom(list, i);
                })} className="col-span-5 rounded-xl bg-[#18132a] border border-[#7c3aed] p-2 text-white">
                  {DOW_OPTIONS.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
                </select>
                <TimeSelect
                  value={b.horaInicio}
                  onChange={(v) => setPlannerBlocks((prev) => {
                    const list=[...prev];
                    list[i] = { ...list[i], horaInicio: v };
                    return recalcFrom(list, i);
                  })}
                  startHour={6}
                  endHour={23}
                  minuteStep={5}
                  className="col-span-5"
                />
                <div className="col-span-2 text-white/60 text-xs text-center">
                  45m {(() => { const r = addMinutes(b.horaInicio,45); return `· fin ${r.time}`; })()}
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-end mt-4">
          <button
            className="text-white/90 border border-[#7c3aed] px-3 py-1.5 rounded-xl"
            onClick={async () => {
              if (!plannerCurso) return;
              const ucid = plannerCurso.usuarioCursoId;
              const blocks = plannerBlocks.map((b) => ({
                usuarioCursoId: ucid,
                diaSemana: Math.max(1, Math.min(7, Number(b.diaSemana || 1))),
                horaInicio: b.horaInicio || "08:00",
                duracionMin: 45,
              }));
              const ok = await meService.postHorario(blocks, token);
              if (ok) {
                const fresh = await meService.getHorario(token, ucid);
                const onlyThis = (fresh || []).filter((b) => Number(b.usuarioCursoId) === Number(ucid)) as HorarioBloque[];
                onHorarioSaved(ucid, onlyThis);
                onClose();
              }
            }}
          >
            Guardar horario
          </button>
        </div>
      </div>
    </div>
  );
}
