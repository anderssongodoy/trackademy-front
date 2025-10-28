"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import meService, { type UsuarioCursoResumenDto, type UsuarioEvaluacionDto } from "@/services/meService";

function formatDate(dateStr?: string | null) {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString("es-PE", { year: "numeric", month: "short", day: "2-digit" });
  } catch {
    return null;
  }
}

export default function HomePage() {
  const { data: session } = useSession();
  const token = (session as unknown as { idToken?: string } | null)?.idToken ?? "";

  const [cursos, setCursos] = useState<UsuarioCursoResumenDto[] | null>(null);
  const [evaluaciones, setEvaluaciones] = useState<UsuarioEvaluacionDto[] | null>(null);
  const [recs, setRecs] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [notaEdit, setNotaEdit] = useState<Record<number, string>>({});
  const [savingNota, setSavingNota] = useState<Record<number, boolean>>({});
  const [anticipacion, setAnticipacion] = useState<number>(3);
  const [savingPref, setSavingPref] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      const [c, e, r] = await Promise.all([
        meService.getCursos(token),
        meService.getEvaluaciones(token),
        meService.getRecomendaciones(token),
      ]);
      if (!mounted) return;
      setCursos(c ?? []);
      setEvaluaciones(e ?? []);
      setRecs(r ?? []);
      setLoading(false);
    }
    if (token) load();
    return () => { mounted = false; };
  }, [token]);

  const kpis = useMemo(() => {
    const totalCursos = cursos?.length ?? 0;
    const proximas = evaluaciones?.length ?? 0;
    return { totalCursos, proximas };
  }, [cursos, evaluaciones]);

  const nextSinNota = useMemo(() => {
    if (!cursos) return [] as { curso: string; ev: UsuarioEvaluacionDto }[];
    const list: { curso: string; ev: UsuarioEvaluacionDto }[] = [];
    cursos.forEach((c) => {
      const ev = (c.evaluaciones || []).find((e) => !e.nota);
      if (ev) list.push({ curso: c.cursoNombre, ev });
    });
    return list.slice(0, 3);
  }, [cursos]);

  return (
    <div className="min-h-screen bg-[#18132a] px-4 py-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl sm:text-4xl font-black text-white">Tu espacio</h1>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-white/80 hover:text-white border border-[#7c3aed] px-3 py-2 rounded-xl"
          >
            Cerrar sesión
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-[#23203b] border border-[#7c3aed] rounded-2xl p-5">
            <div className="text-white/70 text-sm">Cursos activos</div>
            <div className="text-3xl font-extrabold text-white">{loading ? "—" : kpis.totalCursos}</div>
          </div>
          <div className="bg-[#23203b] border border-[#7c3aed] rounded-2xl p-5">
            <div className="text-white/70 text-sm">Próximas evaluaciones</div>
            <div className="text-3xl font-extrabold text-white">{loading ? "—" : kpis.proximas}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cursos */}
          <section className="lg:col-span-2 bg-[#23203b] border border-[#7c3aed] rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Tus cursos</h2>
            {loading ? (
              <div className="text-white/60">Cargando…</div>
            ) : (cursos && cursos.length > 0 ? (
              <div className="space-y-3">
                {cursos.map((c) => (
                  <div key={c.cursoId} className="bg-white/10 border border-white/20 rounded-xl p-4">
                    <Link href={`/home/cursos/${c.cursoId}`} className="text-white font-semibold hover:underline">
                      {c.cursoNombre}
                    </Link>
                    {c.evaluaciones?.length ? (
                      <div className="text-white/70 text-sm mt-1">
                        Próxima: {c.evaluaciones[0].codigo || c.evaluaciones[0].descripcion || "Evaluación"}
                      </div>
                    ) : (
                      <div className="text-white/50 text-sm mt-1">Sin evaluaciones registradas</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-white/60">Aún no tienes cursos asociados.</div>
            ))}
            <div className="mt-4">
              <Link href="/perfil" className="text-white/80 hover:text-white underline">Editar mis cursos y perfil</Link>
            </div>
          </section>

          {/* Próximos hitos */}
          <section className="bg-[#23203b] border border-[#7c3aed] rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Próximos hitos</h2>
            {loading ? (
              <div className="text-white/60">Cargando…</div>
            ) : (evaluaciones && evaluaciones.length > 0 ? (
              <ul className="space-y-3">
                {evaluaciones.slice(0, 6).map((e) => (
                  <li key={e.id} className="bg-white/10 border border-white/20 rounded-xl p-3">
                    <div className="text-white font-medium">{e.codigo || e.descripcion || "Evaluación"}</div>
                    <div className="text-white/60 text-sm">{formatDate(e.fechaEstimada) || (e.semana ? `Semana ${e.semana}` : "Fecha por definir")}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-white/60">No hay hitos en las próximas semanas.</div>
            ))}
          </section>
        </div>

        {/* Acciones rápidas */}
        <section className="bg-[#23203b] border border-[#7c3aed] rounded-2xl p-6 mt-6">
          <h2 className="text-xl font-bold text-white mb-4">Acciones rápidas</h2>
          {nextSinNota.length === 0 ? (
            <div className="text-white/60">No hay evaluaciones pendientes de nota.</div>
          ) : (
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
                          setEvaluaciones((prev) => prev?.map((x) => (x.id === ev.id ? { ...x, nota: String(val) } : x)) ?? null);
                          setCursos((prev) =>
                            prev?.map((c) => ({
                              ...c,
                              evaluaciones: c.evaluaciones.map((x) => (x.id === ev.id ? { ...x, nota: String(val) } : x)),
                            })) ?? null
                          );
                          setNotaEdit((s) => ({ ...s, [ev.id]: "" }));
                        }
                      }}
                      className="border border-[#7c3aed] text-white/90 px-3 py-2 rounded-xl hover:text-white"
                    >
                      Guardar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Preferencias de recordatorios */}
        <section className="bg-[#23203b] border border-[#7c3aed] rounded-2xl p-6 mt-6">
          <h2 className="text-xl font-bold text-white mb-4">Recordatorios</h2>
          <div className="flex items-center gap-3">
            <select
              value={anticipacion}
              onChange={(e) => setAnticipacion(Number(e.target.value))}
              className="rounded-xl bg-white/10 border border-white/20 p-2 text-white"
            >
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
              className="border border-[#7c3aed] text-white/90 px-3 py-2 rounded-xl hover:text-white"
            >
              Guardar preferencia
            </button>
          </div>
        </section>

        {/* Recomendaciones */}
        <section className="bg-[#23203b] border border-[#7c3aed] rounded-2xl p-6 mt-6">
          <h2 className="text-xl font-bold text-white mb-4">Recomendaciones</h2>
          {loading ? (
            <div className="text-white/60">Cargando…</div>
          ) : (recs && recs.length > 0 ? (
            <ul className="list-disc pl-6 text-white/80">
              {recs.map((r, i) => (
                <li key={i} className="mb-1">{r}</li>
              ))}
            </ul>
          ) : (
            <div className="text-white/60">Por ahora no hay recomendaciones.</div>
          ))}
        </section>
      </div>
    </div>
  );
}
