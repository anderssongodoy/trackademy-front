"use client";

import { useEffect, useMemo, useState } from "react";
import meService from "@/services/meService";
import { useSession } from "next-auth/react";

type EvaluacionMeta = { id: number; codigo?: string | null; descripcion?: string | null; porcentaje: number };

type UserEval = { id: number; porcentaje: number; nota: number | null; label?: string };

export default function CourseProjection({ cursoId, evaluacionesMeta }: { cursoId: number; evaluacionesMeta: EvaluacionMeta[] }) {
  const { data: session } = useSession();
  const token = (session as unknown as { idToken?: string } | null)?.idToken ?? "";

  const [userEvals, setUserEvals] = useState<UserEval[]>([]);
  const [simInputs, setSimInputs] = useState<Record<number, number>>({});
  const MIN_APRUEBA = 11.5;

  useEffect(() => {
    let mounted = true;
    async function load() {
      const cursos = await meService.getCursos(token);
      if (!mounted || !cursos) return;
      const match = cursos.find((c) => Number(c.cursoId) === Number(cursoId));
      const evs: UserEval[] = (match?.evaluaciones || []).map((e) => ({
        id: e.id,
        porcentaje: Number(e.porcentaje) || 0,
        nota: (() => {
          const n = typeof e.nota === "string" ? parseFloat(e.nota) : NaN;
          return Number.isFinite(n) ? n : null;
        })(),
        label: (e.codigo) || undefined,
      }));
      setUserEvals(evs);
    }
    if (cursoId && token) load();
    return () => { mounted = false; };
  }, [cursoId, token]);

  const proj = useMemo(() => {
    const done = userEvals.filter((e) => e.nota != null);
    const pesoDone = done.reduce((s, e) => s + (e.porcentaje || 0), 0);
    const ponderadoActual = done.reduce((s, e) => s + (Number(e.nota) * (Number(e.porcentaje) / 100)), 0);
    const pesoPending = Math.max(0, 100 - pesoDone);
    const req = pesoPending > 0 ? (MIN_APRUEBA - ponderadoActual) / (pesoPending / 100) : null;
    const reqClamped = req == null ? null : Math.max(0, req);
    const alcanzable = reqClamped == null ? true : reqClamped <= 20;
    return { pesoDone, pesoPending, ponderadoActual, reqPromPendiente: reqClamped, alcanzable, hasData: userEvals.length > 0 };
  }, [userEvals]);

  const fixed = useMemo(() => userEvals.filter((e) => e.nota != null), [userEvals]);
  const pending = useMemo(() => userEvals.filter((e) => e.nota == null), [userEvals]);
  const labels = useMemo(() => {
    const map = new Map<number, string>();
    (evaluacionesMeta || []).forEach((m) => map.set(m.id, m.codigo || m.descripcion || "Evaluación"));
    return map;
  }, [evaluacionesMeta]);

  const projectionFinal = useMemo(() => {
    const done = userEvals.filter((x) => x.nota != null).reduce((s, x) => s + Number(x.nota) * (x.porcentaje / 100), 0);
    const pend = pending.reduce((s, p) => s + ((simInputs[p.id] ?? (proj.reqPromPendiente ?? 0)) * (p.porcentaje / 100)), 0);
    return done + pend;
  }, [userEvals, pending, simInputs, proj.reqPromPendiente]);

  return (
    <div className="mt-4">
      {proj.hasData ? (
        <>
          <div className="text-white/80 mb-2">
            Promedio actual: <span className={(proj.ponderadoActual >= MIN_APRUEBA ? "text-green-300" : "text-red-300") + " font-semibold"}>{proj.ponderadoActual.toFixed(1)} / 20</span>
            {" "}- Evaluado {Math.round(proj.pesoDone)}% - Pendiente {Math.round(proj.pesoPending)}%
          </div>
          {proj.pesoPending > 0 && (
            <div className="text-white/80 mb-3">
              {proj.reqPromPendiente && proj.reqPromPendiente > 20 ? (
                <span className="text-red-300">Aun con 20 en las pendientes no se alcanza 11.5.</span>
              ) : (
                <>Para aprobar con 11.5 necesitas promediar <span className="font-semibold">{Math.max(0, Math.min(20, proj.reqPromPendiente ?? 0)).toFixed(1)}</span> en las próximas evaluaciones.</>
              )}
            </div>
          )}
          <div className="border-t border-white/10 pt-3">
            <div className="text-white/80 mb-2">Simulador de notas</div>
            {fixed.length > 0 && (
              <div className="text-white/70 text-xs bg-white/5 border border-white/10 rounded-lg px-3 py-2 mb-2">
                Notas ya registradas aparecen fijas y no son modificables desde aquí.
              </div>
            )}
            {pending.length === 0 ? (
              <div className="text-white/60">No hay evaluaciones pendientes.</div>
            ) : (
              <div className="space-y-2">
                {fixed.map((e) => {
                  const label = e.label || labels.get(e.id) || "Evaluación";
                  return (
                    <div key={`fixed-${e.id}`} className="flex items-center gap-3">
                      <div className="text-white/80">{label} ({e.porcentaje}%)</div>
                      <div className="text-green-300 font-semibold">{Number(e.nota).toFixed(1)}</div>
                    </div>
                  );
                })}
                {pending.map((e) => {
                  const label = e.label || labels.get(e.id) || "Evaluación";
                  return (
                    <div key={e.id} className="flex items-center gap-3">
                      <div className="text-white/80">{label} ({e.porcentaje}%)</div>
                      <input
                        type="number"
                        min={0}
                        max={20}
                        step={1}
                        value={(() => {
                          const v = Number.isFinite(simInputs[e.id]) ? Number(simInputs[e.id]) : (proj.reqPromPendiente ?? 0);
                          const iv = Math.max(0, Math.min(20, Math.round(Number(v) || 0)));
                          return iv.toFixed(1);
                        })()}
                        onChange={(ev) => {
                          const raw = Number(ev.target.value);
                          const iv = Math.max(0, Math.min(20, Math.round(Number.isFinite(raw) ? raw : 0)));
                          setSimInputs((prev) => ({ ...prev, [e.id]: iv }));
                        }}
                        className="w-24 rounded-md bg-[#18132a] border border-[#7c3aed] text-white px-2 py-1"
                      />
                    </div>
                  );
                })}
                <div className={(projectionFinal >= MIN_APRUEBA ? "text-green-300" : "text-red-300") + " mt-1"}>
                  Proyección final: {projectionFinal.toFixed(1)} / 20
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="text-white/60">Sin datos de notas registradas.</div>
      )}
    </div>
  );
}
