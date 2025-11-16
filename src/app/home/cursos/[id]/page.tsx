"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { onboardingService } from "@/services/onboardingService";
import meService from "@/services/meService";
import CourseProjection from "@/components/CourseProjection";

type TemaDto = { id: number; titulo: string };
type UnidadDto = { numero: number; titulo?: string | null; temas: TemaDto[] };
type EvaluacionDto = { id: number; codigo?: string | null; descripcion?: string | null; semana: number | null; porcentaje: number };
type CursoDetalleDto = {
  id: number;
  codigo: string;
  nombre: string;
  silaboDescripcion?: string | null;
  unidades: UnidadDto[];
  evaluaciones: EvaluacionDto[];
  bibliografia: string[];
};

export default function CursoDetallePage() {
  const params = useParams();
  const id = Number(params?.id);
  const { data: session } = useSession();
  const token = (session as unknown as { idToken?: string } | null)?.idToken ?? "";
  const [data, setData] = useState<CursoDetalleDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [evalNotasId, setEvalNotasId] = useState<Record<number, string | null>>({});
  const [evalNotasCode, setEvalNotasCode] = useState<Record<string, string | null>>({});
  const [evalLabelId, setEvalLabelId] = useState<Record<number, string>>({});
  const [evalLabelCode, setEvalLabelCode] = useState<Record<string, string>>({});

  const codeKey = (s?: string | null) =>
    (s || "").toString().trim().toLowerCase().replace(/\s+/g, " ");

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      const d = await onboardingService.fetchCursoDetalle(id, token);
      if (!mounted) return;
      setData(d);
      setLoading(false);
    }
    if (id && token) load();
    return () => { mounted = false; };
  }, [id, token]);

  // Fetch notas y labels para mostrar en tarjetas (desde me/cursos), por id y por código
  useEffect(() => {
    let mounted = true;
    async function loadNotas() {
      const cursos = await meService.getCursos(token);
      if (!mounted || !cursos) return;
      const match = cursos.find((c) => Number(c.cursoId) === Number(id));
      const byId: Record<number, string | null> = {};
      const byCode: Record<string, string | null> = {};
      const labelById: Record<number, string> = {};
      const labelByCode: Record<string, string> = {};
      (match?.evaluaciones || []).forEach((e) => {
        const nota = e.nota ?? null;
        byId[e.id] = nota;
        const key = codeKey(e.codigo || e.descripcion);
        const label = (e.descripcion || e.codigo || "").toString();
        if (key) {
          byCode[key] = nota;
          labelByCode[key] = label;
        }
        labelById[e.id] = label;
      });
      setEvalNotasId(byId);
      setEvalNotasCode(byCode);
      setEvalLabelId(labelById);
      setEvalLabelCode(labelByCode);
    }
    if (id && token) loadNotas();
    return () => { mounted = false; };
  }, [id, token]);

  return (
    <div className="min-h-screen bg-[#18132a] px-4 py-10">
      <div className="max-w-5xl mx-auto">
        <a href="/home" className="text-white/70 hover:text-white underline">Volver</a>
        {loading ? (
          <div className="text-white/60 mt-6">Cargando...</div>
        ) : !data ? (
          <div className="text-white/60 mt-6">No se encontro el curso.</div>
        ) : (
          <>
            <h1 className="text-3xl sm:text-4xl font-black text-white mt-4 mb-4">{data.nombre} ({data.codigo})</h1>
            <section className="bg-[#23203b] border border-[#7c3aed] rounded-2xl p-6 mb-6">
              <h2 className="text-xl font-bold text-white mb-2">Descripcion</h2>
              <p className="text-white/80">{data.silaboDescripcion || "Sin descripcion"}</p>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <section className="bg-[#23203b] border border-[#7c3aed] rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-2">Unidades</h2>
                <div className="space-y-3">
                  {data.unidades?.map((u: UnidadDto) => (
                    <div key={`${u.numero}-${u.titulo}`} className="bg-white/10 border border-white/20 rounded-xl p-4">
                      <div className="text-white font-semibold">Unidad {u.numero}: {u.titulo || ""}</div>
                      {u.temas?.length ? (
                        <ul className="list-disc pl-6 text-white/70 text-sm mt-1">
                          {u.temas.map((t: TemaDto) => (<li key={t.id}>{t.titulo}</li>))}
                        </ul>
                      ) : null}
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-[#23203b] border border-[#7c3aed] rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-2">Evaluaciones</h2>
                <div className="space-y-3">
                  {data.evaluaciones?.map((e: EvaluacionDto) => {
                    const k = codeKey(e.codigo || e.descripcion);
                    const notaStr = (evalNotasId[e.id] ?? (k ? evalNotasCode[k] : null));
                    const label = (evalLabelId[e.id] ?? (k ? evalLabelCode[k] : undefined) ?? e.descripcion ?? e.codigo ?? "Evaluación");
                    return (
                      <div key={e.id} className="bg-white/10 border border-white/20 rounded-xl p-3">
                        <div className="text-white font-medium">{label}</div>
                        <div className="text-white/60 text-sm">{e.porcentaje}% {e.semana ? `Semana ${e.semana}` : ""}</div>
                        {notaStr ? (<div className="text-white/70 text-xs mt-0.5">Nota: {Number(notaStr).toFixed(1)}</div>) : null}
                      </div>
                    );
                  })}
                </div>
                <CourseProjection cursoId={id} evaluacionesMeta={data.evaluaciones} />
              </section>
            </div>

            <section className="bg-[#23203b] border border-[#7c3aed] rounded-2xl p-6 mt-6">
              <h2 className="text-xl font-bold text-white mb-2">Bibliografia</h2>
              {data.bibliografia?.length ? (
                <ul className="list-disc pl-6 text-white/80">
                  {data.bibliografia.map((b: string, i: number) => (<li key={i}>{b}</li>))}
                </ul>
              ) : (
                <div className="text-white/60">Sin bibliografia.</div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
