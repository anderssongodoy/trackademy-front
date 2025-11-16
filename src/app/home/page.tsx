"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import meService, { type UsuarioCursoResumenDto, type UsuarioEvaluacionDto } from "@/services/meService";
import RecommendationsPanel from "@/components/home/RecommendationsPanel";
import CoursesGrid from "@/components/home/cursos/CoursesGrid";
import QuickNotes from "@/components/home/QuickNotes";
import UpcomingEvaluations from "@/components/home/UpcomingEvaluations";
import KpisRow from "@/components/home/KpisRow";
import AgendaToday from "@/components/home/AgendaToday";
import { generateICSForEvaluations, downloadICS } from "@/lib/ics";
import { ensureEvaluationEvent } from "@/lib/graphCalendar";
import { promptGraphConsent, setMsalAuthority } from "@/lib/msalClient";
import { showToast } from "@/lib/toastBus";
import { getLoginStatus } from "@/services/accountService";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;
const UNI_ID = Number(process.env.NEXT_PUBLIC_UNIVERSIDAD_ID || "1");

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

// function daysUntil(dateStr?: string | null) {
//   const d = parseLocalDate(dateStr);
//   if (!d) return null;
//   const today = new Date();
//   const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
//   const t1 = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
//   return Math.ceil((t1 - t0) / (24 * 60 * 60 * 1000));
// }

// function formatDate(dateStr?: string | null) {
//   const d = parseLocalDate(dateStr);
//   return d ? d.toLocaleDateString("es-PE", { year: "numeric", month: "short", day: "2-digit" }) : null;
// }

export default function HomePage() {
  const { data: session } = useSession();
  const token = (session as { idToken?: string } | null)?.idToken ?? "";

  const [cursos, setCursos] = useState<UsuarioCursoResumenDto[]>([]);
  const [evaluaciones, setEvaluaciones] = useState<UsuarioEvaluacionDto[]>([]);
  const [recs, setRecs] = useState<string[]>([]);
  const [recsLoading, setRecsLoading] = useState(false);
  const [recsUpdatedAt, setRecsUpdatedAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncingPA, setSyncingPA] = useState(false);
  const [downloadingICS, setDownloadingICS] = useState(false);
  const [periodStart, setPeriodStart] = useState<Date | null>(null);
  const [periodEnd, setPeriodEnd] = useState<Date | null>(null);

  useEffect(() => {
    if (!token) { return; }
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
      setRecs((r ?? []).slice(0, 8));
      setRecsUpdatedAt(new Date());
      setLoading(false);
      
    }
    load();
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

  const byEvalId = useMemo(() => {
    const map = new Map<number, { curso: string }>();
    cursos.forEach((c) => (c.evaluaciones || []).forEach((ev) => map.set(ev.id, { curso: c.cursoNombre })));
    return map;
  }, [cursos]);

  const proximasOrdenadas = useMemo(() => {
    const list = (evaluaciones || []).filter((e) => parseLocalDate(e.fechaEstimada));
    list.sort((a, b) => (parseLocalDate(a.fechaEstimada)!.getTime() - parseLocalDate(b.fechaEstimada)!.getTime()));
    return list;
  }, [evaluaciones]);

  const semanaActual = useMemo(() => {
    if (!periodStart) return null;
    const today = new Date();
    const start = new Date(periodStart.getFullYear(), periodStart.getMonth(), periodStart.getDate());
    const diff = today.getTime() - start.getTime();
    const w = Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1;
    return w > 0 ? w : 1;
  }, [periodStart]);

  function computeAllEvaluations(): Array<{ id: number; date: Date; title: string }> {
    const items: Array<{ id: number; date: Date; title: string }> = [];
    (evaluaciones || []).forEach((ev) => {
      const d = parseLocalDate(ev.fechaEstimada || undefined);
      if (!d) return;
      const info = byEvalId.get(ev.id);
      const name = ev.codigo || ev.descripcion || "Evaluación";
      const title = `[Trackademy] ${name}${info ? ` – ${info.curso}` : ""}`;
      items.push({ id: ev.id, date: d, title });
    });
    items.sort((a, b) => a.date.getTime() - b.date.getTime());
    return items;
  }

  async function handleSyncEvaluations() {
    if (syncingPA) return;
    setSyncingPA(true);
    try {
      setMsalAuthority("consumers");
      await promptGraphConsent(["Calendars.ReadWrite"]);
      const evals = computeAllEvaluations();
      if (evals.length === 0) { showToast({ kind: "warning", message: "No se encontraron evaluaciones con fecha." }); return; }
      const ok0 = await ensureEvaluationEvent(evals[0]);
      if (!ok0) { showToast({ kind: "warning", message: "No se otorgó permiso para escribir en el calendario. Acepta el popup y reintenta." }); return; }
      let created = 0;
      for (const it of evals) {
        const ok = await ensureEvaluationEvent(it);
        if (ok) created++;
      }
      try { localStorage.setItem("trackademy_calendar_sync", "1"); } catch {}
      if (created > 0) {
        showToast({ kind: "success", message: `Evaluaciones sincronizadas (${created}/${evals.length}).` });
      } else {
        showToast({ kind: "warning", message: "No se pudo crear ningún evento." });
      }
    } catch {
      showToast({ kind: "error", message: "No se pudo sincronizar el calendario. Reintenta." });
    } finally {
      setSyncingPA(false);
    }
  }

  async function handleDownloadEvaluationsIcs() {
    if (downloadingICS) return;
    setDownloadingICS(true);
    try {
      const evals = computeAllEvaluations();
      if (evals.length === 0) { showToast({ kind: "warning", message: "No se encontraron evaluaciones con fecha." }); return; }
      const ics = generateICSForEvaluations(evals);
      downloadICS(ics);
      showToast({ kind: "success", message: ".ics generado para tus evaluaciones" });
    } finally {
      setDownloadingICS(false);
    }
  }

  const agendaHoy = useMemo(() => {
    const out: { title: string; subtitle?: string; right?: string; kind?: "clase" | "evaluacion" }[] = [];
    const today = new Date();
    const tY = today.getFullYear();
    const tM = today.getMonth();
    const tD = today.getDate();
    (evaluaciones || []).forEach((e) => {
      const d = parseLocalDate(e.fechaEstimada || undefined);
      if (!d) return;
      if (d.getFullYear() === tY && d.getMonth() === tM && d.getDate() === tD) {
        const info = byEvalId.get(e.id);
        out.push({
          title: e.descripcion || e.codigo || "Evaluación",
          subtitle: info?.curso,
          right: "Evaluación",
          kind: "evaluacion",
        });
      }
    });
    return out;
  }, [evaluaciones, byEvalId]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!token) return;
      const status = await getLoginStatus(token);
      if (status?.periodoId) {
        try {
          const headers: Record<string, string> = { "Content-Type": "application/json" };
          if (token) headers.Authorization = `Bearer ${token}`;
          const res = await fetch(`${API_BASE}/catalog/periodos?universidadId=${encodeURIComponent(String(UNI_ID))}`, { headers, cache: "no-store" });
          if (!mounted) return;
          if (res.ok) {
            const data = (await res.json()) as Array<{ id: number; etiqueta?: string | null; fechaInicio?: string | null; fechaFin?: string | null }>;
            const found = data.find((p) => Number(p.id) === Number(status.periodoId));
            if (found?.fechaInicio) setPeriodStart(new Date(found.fechaInicio));
            if (found?.fechaFin) setPeriodEnd(new Date(found.fechaFin));
          }
        } catch {
        }
      }
    })();
    return () => { mounted = false; };
  }, [token]);

  return (
    <>
      <KpisRow totalCursos={cursos?.length || 0} semanaActual={semanaActual} proximas={proximasOrdenadas?.length || 0} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <AgendaToday items={agendaHoy} onSyncMicrosoft={handleSyncEvaluations} onDownloadICS={handleDownloadEvaluationsIcs} syncing={syncingPA} downloading={downloadingICS} calendarHref="/home/hitos" />
          <section className="bg-[#23203b] border border-[#7c3aed] rounded-2xl p-6">
            <div className="text-xl font-bold text-white mb-2">Mis cursos</div>
            <div className="mt-2">
              <CoursesGrid cursos={cursos} loading={loading} />
            </div>
          </section>

          <QuickNotes
            token={token}
            cursos={cursos}
            loading={loading}
            onSaved={(id, nota) => {
              setEvaluaciones((prev) => prev?.map((x) => (x.id === id ? { ...x, nota: String(nota) } : x)) ?? []);
              setCursos((prev) => prev?.map((c) => ({
                ...c,
                evaluaciones: c.evaluaciones.map((x) => (x.id === id ? { ...x, nota: String(nota) } : x)),
              })) ?? []);
            }}
          />
        </div>

        <div className="space-y-6">
          <UpcomingEvaluations items={proximasOrdenadas} byEvalId={byEvalId} loading={loading} />

          <RecommendationsPanel items={recs} loading={recsLoading} updatedAt={recsUpdatedAt} onRefresh={refreshRecs} />
        </div>
      </div>
    </>
  );
}











