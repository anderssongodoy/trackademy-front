"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { beginLoading } from "@/lib/loadingBus";
import meService, { type UsuarioCursoResumenDto, type UsuarioEvaluacionDto, type HorarioBloque } from "@/services/meService";
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
  const [loading, setLoading] = useState(true);
  const [notaEdit, setNotaEdit] = useState<Record<number, string>>({});
  const [savingNota, setSavingNota] = useState<Record<number, boolean>>({});
  const [anticipacion, setAnticipacion] = useState<number>(3);
  const [savingPref, setSavingPref] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [horario, setHorario] = useState<Record<number, HorarioBloque[]>>({});
  const [periodStart, setPeriodStart] = useState<Date | null>(null);
  const [periodEnd, setPeriodEnd] = useState<Date | null>(null);

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
      setRecs(r ?? []);
      const by: Record<number, HorarioBloque[]> = {};
      (h ?? []).forEach((b) => { (by[b.usuarioCursoId] ||= []).push(b as HorarioBloque); });
      setHorario(by);
      setLoading(false);
    }
    if (token) load();
    return () => { mounted = false; };
  }, [token]);

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
    return list.slice(0, 3);
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
        const name = ev.codigo || ev.descripcion || "Evaluación";
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
              {semanaActual ? `Semana ${semanaActual}` : ""}{semanaActual ? " • " : ""}Hoy {formatShort(hoy)}
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
                <button onClick={() => { beginLoading("Cerrando sesión..."); signOut({ callbackUrl: "/" }); }} className="w-full text-left px-3 py-2 text-white/90 hover:text-white hover:bg-white/10 rounded-lg">Cerrar sesión</button>
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
            <div className="text-white/70 text-sm">Próximas evaluaciones</div>
            <div className="text-3xl font-extrabold text-white">{loading ? "--" : kpis.proximas}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna izquierda */}
          <div className="lg:col-span-2 space-y-6">
            {/* Agenda de hoy */}
            <section className="bg-[#23203b] border border-[#7c3aed] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Agenda de hoy</h2>
                <a href="/home/hitos" className="text-white/90 border border-[#7c3aed] px-3 py-1.5 rounded-xl hover:text-white">Ver calendario</a>
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
                        {it.kind === "clase" ? (it.time || "") : "Evaluación"}
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
                              Próxima: {next.codigo || next.descripcion || "Evaluación"}
                              {" • "}
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

            {/* Acciones rápidas */}
            <section className="bg-[#23203b] border border-[#7c3aed] rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Acciones rápidas</h2>
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
                        <div className="text-white/70 text-sm mb-2">{ev.codigo || ev.descripcion || "Evaluación"}</div>
                        <div className="flex items-center gap-2">
                          <input
                            value={notaEdit[ev.id] ?? ""}
                            onChange={(e) => setNotaEdit((s) => ({ ...s, [ev.id]: e.target.value }))}
                            placeholder="Nota (0-20)"
                            className="flex-1 rounded-xl bg-white/10 border border-white/20 p-2 text-white"
                          />
                          <button
                            disabled={savingNota[ev.id]}
                            onClick={async () => {
                              const val = (notaEdit[ev.id] ?? "").trim();
                              if (!val || isNaN(Number(val))) return;
                              setSavingNota((s) => ({ ...s, [ev.id]: true }));
                              const ok = await meService.postNota(ev.id, String(val), token);
                              setSavingNota((s) => ({ ...s, [ev.id]: false }));
                              if (ok) {
                                setEvaluaciones((prev) => prev?.map((x) => (x.id === ev.id ? { ...x, nota: String(val) } : x)) ?? []);
                                setCursos((prev) =>
                                  prev?.map((c) => ({
                                    ...c,
                                    evaluaciones: c.evaluaciones.map((x) => (x.id === ev.id ? { ...x, nota: String(val) } : x)),
                                  })) ?? []
                                );
                                setNotaEdit((s) => ({ ...s, [ev.id]: "" }));
                              }
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
              <h2 className="text-xl font-bold text-white mb-2">Próximas evaluaciones</h2>
              
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
                            <div className="text-white font-medium leading-snug whitespace-normal break-words">{e.codigo || e.descripcion || "Evaluación"}</div>
                            <div
                              className="text-white/60 text-sm"
                              title={info?.curso ? `${info.curso} • ${meta}` : meta}
                              style={{ display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2, overflow: "hidden" }}
                            >
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
              ))}
            </section>

            <section className="bg-[#23203b] border border-[#7c3aed] rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Recordatorios</h2>
              <div className="flex items-center gap-3">
                <select value={anticipacion} onChange={(e) => setAnticipacion(Number(e.target.value))} className="rounded-xl bg-white/10 border border-white/20 p-2 text-white">
                  <option value={1}>1 día</option>
                  <option value={3}>3 días</option>
                  <option value={5}>5 días</option>
                  <option value={7}>7 días</option>
                </select>
                <button
                  disabled={savingPref}
                  onClick={async () => {
                    setSavingPref(true);
                    await meService.setRecordatorios(anticipacion, token);
                    setSavingPref(false);
                  }}
                  className="border border-[#7c3aed] text-white/90 px-3 py-1.5 rounded-xl hover:text-white"
                >
                  Guardar preferencia
                </button>
              </div>
            </section>

            <section className="bg-[#23203b] border border-[#7c3aed] rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-2">Recomendaciones</h2>
              {recs?.length ? (
                <ul className="list-disc pl-6 text-white/80">
                  {recs.map((r, i) => (<li key={i}>{r}</li>))}
                </ul>
              ) : (
                <div className="text-white/60">Por ahora no hay recomendaciones.</div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
