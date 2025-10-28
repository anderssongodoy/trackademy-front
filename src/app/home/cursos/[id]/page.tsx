"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { onboardingService } from "@/services/onboardingService";

export default function CursoDetallePage() {
  const params = useParams();
  const id = Number(params?.id);
  const { data: session } = useSession();
  const token = (session as unknown as { idToken?: string } | null)?.idToken ?? "";
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="min-h-screen bg-[#18132a] px-4 py-10">
      <div className="max-w-5xl mx-auto">
        <a href="/home" className="text-white/70 hover:text-white underline">← Volver</a>
        {loading ? (
          <div className="text-white/60 mt-6">Cargando…</div>
        ) : !data ? (
          <div className="text-white/60 mt-6">No se encontró el curso.</div>
        ) : (
          <>
            <h1 className="text-3xl sm:text-4xl font-black text-white mt-4 mb-4">{data.nombre} ({data.codigo})</h1>
            <section className="bg-[#23203b] border border-[#7c3aed] rounded-2xl p-6 mb-6">
              <h2 className="text-xl font-bold text-white mb-2">Descripción</h2>
              <p className="text-white/80">{data.silaboDescripcion || "Sin descripción"}</p>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <section className="bg-[#23203b] border border-[#7c3aed] rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-2">Unidades</h2>
                <div className="space-y-3">
                  {data.unidades?.map((u: any) => (
                    <div key={`${u.numero}-${u.titulo}`} className="bg-white/10 border border-white/20 rounded-xl p-4">
                      <div className="text-white font-semibold">Unidad {u.numero}: {u.titulo || ""}</div>
                      {u.temas?.length ? (
                        <ul className="list-disc pl-6 text-white/70 text-sm mt-1">
                          {u.temas.map((t: any) => (<li key={t.id}>{t.titulo}</li>))}
                        </ul>
                      ) : null}
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-[#23203b] border border-[#7c3aed] rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-2">Evaluaciones</h2>
                <div className="space-y-3">
                  {data.evaluaciones?.map((e: any) => (
                    <div key={e.id} className="bg-white/10 border border-white/20 rounded-xl p-3">
                      <div className="text-white font-medium">{e.codigo || e.descripcion || "Evaluación"}</div>
                      <div className="text-white/60 text-sm">{e.porcentaje}% {e.semana ? `• Semana ${e.semana}` : ""}</div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <section className="bg-[#23203b] border border-[#7c3aed] rounded-2xl p-6 mt-6">
              <h2 className="text-xl font-bold text-white mb-2">Bibliografía</h2>
              {data.bibliografia?.length ? (
                <ul className="list-disc pl-6 text-white/80">
                  {data.bibliografia.map((b: string, i: number) => (<li key={i}>{b}</li>))}
                </ul>
              ) : (
                <div className="text-white/60">Sin bibliografía.</div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

