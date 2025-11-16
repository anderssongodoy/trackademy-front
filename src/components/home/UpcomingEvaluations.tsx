"use client";

import { type UsuarioEvaluacionDto } from "@/services/meService";

function parseLocalDate(s?: string | null) {
  if (!s) return null;
  const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(s);
  if (!m) {
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const y = Number(m[1]);
  const mm = Number(m[2]);
  const dd = Number(m[3]);
  return new Date(y, (mm || 1) - 1, dd || 1);
}

function daysUntil(dateStr?: string | null) {
  const d = parseLocalDate(dateStr);
  if (!d) return null;
  const today = new Date();
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const t1 = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return Math.ceil((t1 - t0) / (24 * 60 * 60 * 1000));
}

function formatDate(dateStr?: string | null) {
  const d = parseLocalDate(dateStr);
  return d ? d.toLocaleDateString("es-PE", { year: "numeric", month: "short", day: "2-digit" }) : null;
}

export default function UpcomingEvaluations({
  items,
  byEvalId,
  loading,
}: {
  items: UsuarioEvaluacionDto[];
  byEvalId: Map<number, { curso: string }>;
  loading?: boolean;
}) {
  return (
    <section className="bg-[#23203b] border border-[#7c3aed] rounded-2xl p-6">
      <h2 className="text-xl font-bold text-white mb-2">Próximas evaluaciones</h2>
      {loading ? (
        <div className="text-white/60"><ul className="space-y-3">{Array.from({ length: 4 }).map((_, i) => (<li key={i} className="bg-white/10 border border-white/20 rounded-xl p-3 animate-pulse h-16" />))}</ul></div>
      ) : items.length > 0 ? (
        <ul className="space-y-3">
          {items.slice(0, 8).map((e) => {
            const dLeft = daysUntil(e.fechaEstimada);
            const urgency = dLeft == null ? "" : dLeft <= 3 ? "border-red-500/60 text-red-300" : dLeft <= 7 ? "border-yellow-500/60 text-yellow-300" : "border-white/20 text-white/80";
            const info = byEvalId.get(e.id);
            const meta = e.semana ? `Semana ${e.semana}` : (formatDate(e.fechaEstimada) || "Fecha por definir");
            return (
              <li key={e.id} className="bg-white/10 border border-white/20 rounded-xl p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-white font-medium leading-snug whitespace-normal wrap-break-word">{e.codigo || e.descripcion || "Evaluación"}</div>
                    <div className="text-white/60 text-sm" title={info?.curso ? `${info.curso} • ${meta}` : meta}>
                      {info?.curso ? (<><span>{info.curso}</span> <span className="text-white/40">•</span> {meta}</>) : meta}
                    </div>
                  </div>
                  {dLeft != null ? (
                    <div className={`text-xs px-2 py-1 rounded-lg border shrink-0 ${urgency}`}>{dLeft === 0 ? "hoy" : dLeft === 1 ? "mañana" : `en ${dLeft} días`}</div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="text-white/60">No hay hitos en las próximas semanas.</div>
      )}
    </section>
  );
}




