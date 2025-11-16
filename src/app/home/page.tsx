"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { beginLoading } from "@/lib/loadingBus";
import { ensurePAForCurrentWeek, ensurePAForWeek, ensureEvaluationEvent } from "@/lib/graphCalendar";
import { setMsalAuthority, promptGraphConsent } from "@/lib/msalClient";
import { downloadICS, generateICSForEvaluations } from "@/lib/ics";
import meService, { type UsuarioCursoResumenDto, type UsuarioEvaluacionDto, type HorarioBloque } from "@/services/meService";
import ConfirmDialog from "@/components/ConfirmDialog";
import { getLoginStatus } from "@/services/accountService";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
const UNI_ID = Number(process.env.NEXT_PUBLIC_UNIVERSIDAD_ID || "1");

function formatDate(dateStr?: string | null) {
  if (!dateStr) return null;
  try {
    const d = parseLocalDate(dateStr);
    if (!d || Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString("es-PE", { year: "numeric", month: "short", day: "2-digit" });
  } catch {
    return null;
  }
}

function formatShort(d: Date) {
  return d.toLocaleDateString("es-PE", { month: "short", day: "2-digit" });
}
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
function sameDate(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function daysUntil(dateStr?: string | null) {
  const d = parseLocalDate(dateStr);
  if (!d) return null;
  const today = new Date();
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const t1 = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return Math.ceil((t1 - t0) / (24 * 60 * 60 * 1000));
}

export default function HomePage() {
  const { data: session } = useSession();
  const token = (session as unknown as { idToken?: string } | null)?.idToken ?? "";
  const user = (session as unknown as { user?: { image?: string | null; name?: string | null } } | null)?.user;

  const [cursos, setCursos] = useState<UsuarioCursoResumenDto[]>([]);
  const [evaluaciones, setEvaluaciones] = useState<UsuarioEvaluacionDto[]>([]);
  const [recs, setRecs] = useState<string[]>([]);
  const [recsLoading, setRecsLoading] = useState(false);
  const [recsUpdatedAt, setRecsUpdatedAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [notaEdit, setNotaEdit] = useState<Record<number, string>>({});
  const [savingNota, setSavingNota] = useState<Record<number, boolean>>({});
  const [userMenu, setUserMenu] = useState(false);
  const [confirmNota, setConfirmNota] = useState<{ open: boolean; evId?: number; value?: number }>(() => ({ open: false }));
  const [horario, setHorario] = useState<Record<number, HorarioBloque[]>>({});
  const [periodStart, setPeriodStart] = useState<Date | null>(null);
  const [periodEnd, setPeriodEnd] = useState<Date | null>(null);
  const [syncingPA, setSyncingPA] = useState(false);
  const [downloadingICS, setDownloadingICS] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      const [c, e, r, h] = await Promise.all([
        meService.getCursos(token),
        meService.getEvaluaciones(token),
        meService.getRecomendaciones(token),
        meService.getHorario(token),
      ]);
      if (!mounted) return;
      setCursos(c ?? []);
      setEvaluaciones(e ?? []);
      setRecs((r ?? []).slice(0, 8));
      setRecsUpdatedAt(new Date());
      const by: Record<number, HorarioBloque[]> = {};
      (h ?? []).forEach((b) => { (by[b.usuarioCursoId] ||= []).push(b as HorarioBloque); });
      setHorario(by);
      setLoading(false);
    }
    if (token) load();
    return () => { mounted = false; };
  }, [token]);

  async function refreshRecs() {
    if (!token) return;
    setRecsLoading(true);
    const r = await meService.getRecomendaciones(token);
    setRecs((r ?? []).slice(0, 8));
    setRecsUpdatedAt(new Date());
    setRecsLoading(false);
  }

  // Se eliminÃ³ la sincronizaciÃ³n automÃ¡tica; ahora solo se hace por botÃ³n y semanas reales de PA

  // Utilidades PA: calcular lunes por semanas de evaluaciones tipo PA
  function getMonday(d: Date) { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); const day = x.getDay(); const diff = (day === 0 ? -6 : 1 - day); x.setDate(x.getDate() + diff); x.setHours(0,0,0,0); return x; }
  function computeAllEvaluations(): Array<{ id: number; date: Date; title: string }> {
    const list: Array<{ id: number; date: Date; title: string }> = [];
    (evaluaciones || []).forEach((ev) => {
      const d = parseLocalDate(ev.fechaEstimada);
      if (!d) return;
      const info = byEvalId.get(ev.id);
      const name = ev.codigo || ev.descripcion || "EvaluaciÃ³n";
      const title = `[Trackademy] ${name}${info ? ` â€” ${info.curso}` : ''}`;
      list.push({ id: ev.id, date: d, title });
    });
    return list.sort((a,b)=>a.date.getTime()-b.date.getTime());
  }

  // BotÃ³n para sincronizar sÃ³lo las semanas reales de PA
  async function handleSyncAllPA() {
    if (syncingPA) return;
    setSyncingPA(true);
    try {
      const evals = computeAllEvaluations();
      if (evals.length === 0) { alert('No se encontraron evaluaciones con fecha.'); setSyncingPA(false); return; }
      // VerificaciÃ³n inicial para obtener permisos/token con la primera evaluaciÃ³n
      const testOk = await ensureEvaluationEvent({ id: evals[0].id, date: evals[0].date, title: evals[0].title });
      if (!testOk) {
        // eslint-disable-next-line no-alert
        alert("No se pudo obtener permiso para escribir en tu calendario. Acepta el popup y reintenta.");
        setSyncingPA(false);
        return;
      }
      let created = 0, attempted = 0;
      for (const it of evals) { attempted++; const ok = await ensureEvaluationEvent({ id: it.id, date: it.date, title: it.title }); if (ok) created++; }
      try { localStorage.setItem("trackademy_calendar_sync", "1"); } catch {}
      // eslint-disable-next-line no-alert
      alert(created > 0 ? `Evaluaciones sincronizadas (${created}/${attempted}).` : "No se pudo crear ningÃºn evento.");
    } catch {
      // eslint-disable-next-line no-alert
      alert("No se pudo sincronizar el calendario. Reintenta.");
    } finally {
      setSyncingPA(false);
    }
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!token) return;
      const status = await getLoginStatus(token, user?.image || undefined);
      if (status?.periodoId) {
        try {
          const headers: Record<string, string> = { "Content-Type": "application/json" };
          if (token) headers.Authorization = `Bearer ${token}`;
          const res = await fetch(`${API_BASE}/catalog/periodos?universidadId=${encodeURIComponent(String(UNI_ID))}`, {
            headers,
            cache: "no-store",
          });
          if (!mounted) return;
          if (res.ok) {
            const data = (await res.json()) as Array<{ id: number; etiqueta?: string | null; fechaInicio?: string | null; fechaFin?: string | null }>;
            const found = data.find((p) => Number(p.id) === Number(status.periodoId));
            if (found?.fechaInicio) setPeriodStart(new Date(found.fechaInicio));
            if (found?.fechaFin) setPeriodEnd(new Date(found.fechaFin));
          }
        } catch {
          // ignore
        }
      }
    })();
    return () => { mounted = false; };
  }, [token, user?.image]);

  const semanaActual = useMemo(() => {
    if (!periodStart) return null;
    const today = new Date();
    const diff = today.getTime() - new Date(periodStart.getFullYear(), periodStart.getMonth(), periodStart.getDate()).getTime();
    const w = Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1;
    return w > 0 ? w : 1;
  }, [periodStart]);

  const kpis = useMemo(() => {
    const totalCursos = cursos?.length ?? 0;
    const proximas = evaluaciones?.length ?? 0;
    return { totalCursos, proximas, semanaActual };
  }, [cursos, evaluaciones, semanaActual]);

  const byEvalId = useMemo(() => {
    const map = new Map<number, { curso: string; usuarioCursoId: number; cursoId: number }>();
    cursos.forEach((c) => (c.evaluaciones || []).forEach((ev) => map.set(ev.id, { curso: c.cursoNombre, usuarioCursoId: c.usuarioCursoId, cursoId: c.cursoId })));
    return map;
  }, [cursos]);

  const nextSinNota = useMemo(() => {
    if (!cursos) return [] as { curso: string; ev: UsuarioEvaluacionDto }[];
    const list: { curso: string; ev: UsuarioEvaluacionDto }[] = [];
    cursos.forEach((c) => {
      const ev = (c.evaluaciones || []).find((e) => !e.nota);
      if (ev) list.push({ curso: c.cursoNombre, ev });
    });
    return list;
  }, [cursos]);

  const hoy = new Date();
  const agendaHoy = useMemo(() => {
    const items: Array<{ kind: "clase" | "evaluacion"; title: string; subtitle?: string; time?: string }> = [];
    const dow = ((hoy.getDay() + 6) % 7) + 1; // 1..7 (lunes=1)
    cursos.forEach((c) => {
      const blocks = horario[c.usuarioCursoId] ?? [];
      blocks.filter((b) => Number(b.diaSemana) === dow).forEach((b) => {
        items.push({ kind: "clase", title: c.cursoNombre, subtitle: `${b.duracionMin} min`, time: b.horaInicio });
      });
    });
    (evaluaciones ?? []).forEach((ev) => {
      const d = parseLocalDate(ev.fechaEstimada);
      if (!d) return;
      if (sameDate(d, hoy)) {
        const info = byEvalId.get(ev.id);
        const name = ev.codigo || ev.descripcion || "EvaluaciÃ³n";
        items.push({ kind: "evaluacion", title: name, subtitle: info ? info.curso : undefined });
      }
    });
    // Orden: por hora si es clase; evaluaciones sin hora al final
    return items.sort((a, b) => {
      if (a.kind === "clase" && b.kind === "clase") return (a.time || "").localeCompare(b.time || "");
      if (a.kind === "clase") return -1;
      if (b.kind === "clase") return 1;
      return (a.title || "").localeCompare(b.title || "");
    }).slice(0, 6);
  }, [cursos, horario, evaluaciones, byEvalId]);

  const proximasOrdenadas = useMemo(() => {
    const copy = [...(evaluaciones ?? [])];
    copy.sort((a, b) => {
      const da = parseLocalDate(a.fechaEstimada)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const db = parseLocalDate(b.fechaEstimada)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return da - db;
    });
    return copy;
  }, [evaluaciones]);

  const cursosOrdenados = useMemo(() => {
    const pairs = cursos.map((c) => {
      const next = [...(c.evaluaciones || [])].sort((a, b) => (parseLocalDate(a.fechaEstimada)?.getTime() ?? Number.MAX_SAFE_INTEGER) - (parseLocalDate(b.fechaEstimada)?.getTime() ?? Number.MAX_SAFE_INTEGER))[0];
      const key = parseLocalDate(next?.fechaEstimada)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return { c, key };
    });
    pairs.sort((a, b) => a.key - b.key);
    return pairs.map((p) => p.c);
  }, [cursos]);

  return (
    <div className="min-h-screen bg-[#18132a] px-4 py-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white">Tu espacio</h1>
            <div className="text-white/60 mt-1 text-sm">
              {semanaActual ? `Semana ${semanaActual}` : ""}{semanaActual ? " â€¢ " : ""}Hoy {formatShort(hoy)}
            </div>
          </div>
          <div className="relative">
            <button onClick={() => setUserMenu((s) => !s)} className="w-9 h-9 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center overflow-hidden hover:bg-white/15">
              {user?.image ? (
                // Next/Image no es necesario para data URI; usar <img>
                <img src={user.image} alt={user?.name || "Usuario"} className="w-full h-full object-cover" />
              ) : (
                <span className="font-semibold">{(user?.name || "U").trim().charAt(0).toUpperCase()}</span>
              )}
            </button>
            {userMenu ? (
              <div className="absolute right-0 mt-2 w-40 bg-[#23203b] border border-[#7c3aed] rounded-xl shadow-xl p-1 z-10">
                <a href="/perfil" className="block px-3 py-2 text-white/90 hover:text-white hover:bg-white/10 rounded-lg">Perfil</a>
                <button onClick={() => { beginLoading("Cerrando sesiÃ³n..."); signOut({ callbackUrl: "/" }); }} className="w-full text-left px-3 py-2 text-white/90 hover:text-white hover:bg-white/10 rounded-lg">Cerrar sesiÃ³n</button>
              </div>
            ) : null}
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#23203b] border border-[#7c3aed] rounded-2xl p-5">
            <div className="text-white/70 text-sm">Cursos activos</div>
            <div className="text-3xl font-extrabold text-white">{loading ? "--" : kpis.totalCursos}</div>
          </div>
          <div className="bg-[#23203b] border border-[#7c3aed] rounded-2xl p-5">
            <div className="text-white/70 text-sm">Semana actual</div>
            <div className="text-3xl font-extrabold text-white">{kpis.semanaActual ?? "--"}</div>
          </div>
          <div className="bg-[#23203b] border border-[#7c3aed] rounded-2xl p-5">
            <div className="text-white/70 text-sm">PrÃ³ximas evaluaciones</div>
            <div className="text-3xl font-extrabold text-white">{loading ? "--" : kpis.proximas}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna izquierda */}
          <div className="lg:col-span-2 space-y-6">
            {/* Agenda de hoy */}
            <section className="bg-[#23203b] border border-[#7c3aed] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4 gap-2">
                <h2 className="text-xl font-bold text-white">Agenda de hoy</h2>
                <div className="flex items-center gap-2">
                  <button onClick={async () => { setMsalAuthority("consumers"); await promptGraphConsent(["Calendars.ReadWrite"]); await handleSyncAllPA(); }} disabled={syncingPA} className={`px-3 py-1.5 rounded-xl border ${syncingPA ? "opacity-60 cursor-not-allowed" : "hover:text-white"} text-white/90 border-[#7c3aed]`}>
                    {syncingPA ? "Sincronizandoâ€¦" : "Sincronizar con Microsoft"}
                  </button>
                  <button onClick={async () => {
                    if (downloadingICS) return; setDownloadingICS(true);
                    try {
                      const evals = computeAllEvaluations();
                      if (evals.length === 0) { alert('No se encontraron evaluaciones con fecha.'); return; }
                      const ics = generateICSForEvaluations(evals);
                      downloadICS(ics);
                    } finally { setDownloadingICS(false); }
                  }} disabled={downloadingICS} className={`px-3 py-1.5 rounded-xl border ${downloadingICS ? "opacity-60 cursor-not-allowed" : "hover:text-white"} text-white/90 border-white/30`}>
                    {downloadingICS ? "Generandoâ€¦" : "Descargar .ics"}
                  </button>
                  <a href="/home/hitos" className="text-white/90 border border-[#7c3aed] px-3 py-1.5 rounded-xl hover:text-white">Ver calendario</a>
                </div>
              </div>
              {agendaHoy.length === 0 ? (
                <div className="text-white/60">No tienes clases ni evaluaciones hoy.</div>
              ) : (
                <ul className="space-y-3">
                  {agendaHoy.map((it, i) => (
                    <li key={i} className="bg-white/10 border border-white/20 rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <div className="text-white font-medium">{it.title}</div>
                        {it.subtitle ? (<div className="text-white/60 text-sm">{it.subtitle}</div>) : null}
                      </div>
                      <div className={`text-xs px-2 py-1 rounded-lg border ${it.kind === "clase" ? "border-white/20 text-white/80" : "border-[#7c3aed] text-white"}`}>
                        {it.kind === "clase" ? (it.time || "") : "EvaluaciÃ³n"}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Tus cursos */}
            <section className="bg-[#23203b] border border-[#7c3aed] rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Tus cursos</h2>
              {loading ? (
                <div className="text-white/60">Cargando...</div>
              ) : (cursosOrdenados && cursosOrdenados.length > 0 ? (
                <div className="space-y-3">
                  {cursosOrdenados.map((c) => {
                    const next = [...(c.evaluaciones || [])].sort((a, b) => (parseLocalDate(a.fechaEstimada)?.getTime() ?? Number.MAX_SAFE_INTEGER) - (parseLocalDate(b.fechaEstimada)?.getTime() ?? Number.MAX_SAFE_INTEGER))[0];
                    return (
                      <div key={c.cursoId} className="bg-white/10 border border-white/20 rounded-xl p-4">
                        <Link href={`/home/cursos/${c.cursoId}`} className="text-white font-semibold hover:underline">
                          {c.cursoNombre}
                        </Link>
                        <div className="text-white/70 text-sm mt-1">
                          {next ? (
                            <>
                              PrÃ³xima: {next.codigo || next.descripcion || "EvaluaciÃ³n"}
                              {" â€¢ "}
                              {next.semana ? `Semana ${next.semana}` : (formatDate(next.fechaEstimada) || "Fecha por definir")}
                            </>
                          ) : (
                            "Sin evaluaciones registradas"
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-white/60">No hay cursos activos.</div>
              ))}
            </section>

            {/* Acciones rÃ¡pidas */}
            <section className="bg-[#23203b] border border-[#7c3aed] rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Acciones rÃ¡pidas</h2>
              {nextSinNota.length === 0 ? (
                <div className="text-white/60">No hay evaluaciones pendientes de nota.</div>
              ) : (
                <>
                  <div className="mb-3 text-white/80 text-xs bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                    Tip: para ver las siguientes evaluaciones y el estado actual, registra las notas de evaluaciones ya rendidas. Esto actualiza tu resumen y recomendaciones.
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {nextSinNota.map(({ curso, ev }) => (
                      <div key={ev.id} className="bg-white/10 border border-white/20 rounded-xl p-4">
                        <div className="text-white font-semibold mb-1">{curso}</div>
                        <div className="text-white/70 text-sm mb-2">{ev.codigo || ev.descripcion || "EvaluaciÃ³n"}</div>
                        <div className="flex items-center gap-2">
                          <input
                            value={notaEdit[ev.id] ?? ""}
                            onChange={(e) => setNotaEdit((s) => ({ ...s, [ev.id]: e.target.value }))}
                            placeholder="Nota (0-20)"
                            className="flex-1 rounded-xl bg-white/10 border border-white/20 p-2 text-white"
                          />
                          <button
                            disabled={savingNota[ev.id]}
                            onClick={() => {
                              const val = (notaEdit[ev.id] ?? "").trim();
                              const num = Number(val);
                              if (!val || !Number.isFinite(num)) return;
                              if (num < 0 || num > 20) {
                                alert("La nota debe estar entre 0 y 20.");
                                return;
                              }
                              setConfirmNota({ open: true, evId: ev.id, value: num });
                            }}
                            className="border border-[#7c3aed] text-white/90 px-3 py-1.5 rounded-xl hover:text-white"
                          >
                            Guardar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>
          </div>

          {/* Columna derecha */}
          <div className="space-y-6">
            <section className="bg-[#23203b] border border-[#7c3aed] rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-2">PrÃ³ximas evaluaciones</h2>
              
              {loading ? (
                <div className="text-white/60">Cargando...</div>
              ) : (proximasOrdenadas.length > 0 ? (
                <ul className="space-y-3">
                  {proximasOrdenadas.slice(0, 8).map((e) => {
                    const dLeft = daysUntil(e.fechaEstimada);
                    const urgency = dLeft == null ? "" : dLeft <= 3 ? "border-red-500/60 text-red-300" : dLeft <= 7 ? "border-yellow-500/60 text-yellow-300" : "border-white/20 text-white/80";
                    const info = byEvalId.get(e.id);
                    const meta = e.semana ? `Semana ${e.semana}` : (formatDate(e.fechaEstimada) || "Fecha por definir");
                    return (
                      <li key={e.id} className="bg-white/10 border border-white/20 rounded-xl p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-white font-medium leading-snug whitespace-normal break-words">{e.codigo || e.descripcion || "EvaluaciÃ³n"}</div>
                            <div
                              className="text-white/60 text-sm"
                              title={info?.curso ? `${info.curso} â€¢ ${meta}` : meta}
                              style={{ display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2, overflow: "hidden" }}
                            >
                              {info?.curso ? (<><span>{info.curso}</span> <span className="text-white/40">â€¢</span> {meta}</>) : meta}
                            </div>
                          </div>
                          {dLeft != null ? (
                            <div className={`text-xs px-2 py-1 rounded-lg border shrink-0 ${urgency}`}>{dLeft === 0 ? "hoy" : dLeft === 1 ? "maÃ±ana" : `en ${dLeft} dÃ­as`}</div>
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="text-white/60">No hay hitos en las prÃ³ximas semanas.</div>
              ))}
            </section>

            {/* Se removiÃ³ la secciÃ³n de Recordatorios (preferencias) al no ser necesaria */}

            <section className="bg-[#23203b] border border-[#7c3aed] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-white">Recomendaciones</h2>
                <button
                  onClick={refreshRecs}
                  disabled={recsLoading}
                  className="text-white/80 border border-white/20 px-3 py-1.5 rounded-xl hover:text-white disabled:opacity-60"
                >
                  {recsLoading ? "Actualizando..." : "Actualizar"}
                </button>
              </div>
              {recs?.length ? (
                <ul className="list-disc pl-6 text-white/80 space-y-1">
                  {recs.slice(0, 8).map((r, i) => (<li key={i}>{r}</li>))}
                </ul>
              ) : (
                <div className="text-white/60">Por ahora no hay recomendaciones.</div>
              )}
              <div className="text-white/40 text-xs mt-2">
                {recsUpdatedAt ? `Actualizado: ${recsUpdatedAt.toLocaleDateString('es-PE')} ${recsUpdatedAt.toLocaleTimeString('es-PE')}` : ''}
              </div>
            </section>
          </div>
        </div>
        <ConfirmDialog
          open={confirmNota.open}
          title="Confirmar guardado de nota"
          message={<>
            <div>¿Guardar la nota <span className="font-semibold">{confirmNota.value?.toFixed(1)}</span>?</div>
            <div className="text-white/70 text-sm mt-1">No podrás modificarla luego.</div>
          </>}
          confirmText="Guardar"
          cancelText="Cancelar"
          loading={confirmNota.evId ? !!savingNota[confirmNota.evId] : false}
          onCancel={() => setConfirmNota({ open: false })}
          onConfirm={async () => {
            if (!confirmNota.evId || confirmNota.value == null) return;
            const id = confirmNota.evId; const num = confirmNota.value;
            setSavingNota((s) => ({ ...s, [id]: true }));
            const ok = await meService.postNota(id, String(num), token);
            setSavingNota((s) => ({ ...s, [id]: false }));
            setConfirmNota({ open: false });
            if (ok) {
              setEvaluaciones((prev) => prev?.map((x) => (x.id === id ? { ...x, nota: String(num) } : x)) ?? []);
              setCursos((prev) => prev?.map((c) => ({
                ...c,
                evaluaciones: c.evaluaciones.map((x) => (x.id === id ? { ...x, nota: String(num) } : x)),
              })) ?? []);
              setNotaEdit((s) => ({ ...s, [id]: "" }));
            }
          }}
        />
      </div>
    </div>
  );
}

// Confirm dialog mounted at end to avoid layout shifts
export function HomePageConfirmHost() {
  return null;
}
