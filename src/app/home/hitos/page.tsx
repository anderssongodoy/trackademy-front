"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import meService, {
  type UsuarioEvaluacionDto,
  type UsuarioCursoResumenDto,
  type HorarioBloque,
} from "@/services/meService";
import { getLoginStatus } from "@/services/accountService";
import CalendarGrid from "@/components/hitos/CalendarGrid";
import DayDetails from "@/components/hitos/DayDetails";
import PlannerDialog from "@/components/hitos/PlannerDialog";
import { toKey } from "@/components/hitos/dateUtils";
import { type DayCell, type ScheduleEvent } from "@/components/hitos/types";

function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }
function parseLocalDate(s?: string | null): Date | null {
  if (!s) return null;
  const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(s);
  if (!m) { const d = new Date(s); return Number.isNaN(d.getTime()) ? null : d; }
  const y = Number(m[1]); const mm = Number(m[2]); const dd = Number(m[3]);
  return new Date(y, (mm || 1) - 1, dd || 1);
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL;
const UNI_ID = Number(process.env.NEXT_PUBLIC_UNIVERSIDAD_ID || "1");

export default function HitosCalendarPage() {
  const { data: session } = useSession();
  const token = (session as { idToken?: string } | null)?.idToken ?? "";

  const [cursos, setCursos] = useState<UsuarioCursoResumenDto[]>([]);
  const [evaluaciones, setEvaluaciones] = useState<UsuarioEvaluacionDto[]>([]);
  const [horario, setHorario] = useState<Record<number, HorarioBloque[]>>({});
  const [month, setMonth] = useState<Date>(() => new Date());
  const [selected, setSelected] = useState<Date>(() => new Date());
  const [periodStart, setPeriodStart] = useState<Date | null>(null);
  const [periodEnd, setPeriodEnd] = useState<Date | null>(null);
  const [plannerDialogOpen, setPlannerDialogOpen] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!token) return;
      const [c, e, h] = await Promise.all([
        meService.getCursos(token),
        meService.getEvaluaciones(token),
        meService.getHorario(token),
      ]);
      if (!mounted) return;
      setCursos(c ?? []);
      setEvaluaciones(e ?? []);
      const by: Record<number, HorarioBloque[]> = {};
      (h ?? []).forEach((b) => { (by[b.usuarioCursoId] ||= []).push(b as HorarioBloque); });
      setHorario(by);
    })();
    return () => { mounted = false; };
  }, [token]);

  const semanaActual = useMemo(() => {
    if (!periodStart) return null;
    const today = new Date();
    const start = new Date(periodStart.getFullYear(), periodStart.getMonth(), periodStart.getDate());
    const diff = today.getTime() - start.getTime();
    const w = Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1;
    return w > 0 ? w : 1;
  }, [periodStart]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!token) return;
      const status = await getLoginStatus(token);
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
        } catch {}
      }
    })();
    return () => { mounted = false; };
  }, [token]);

  const byEvalId = useMemo(() => {
    const map = new Map<number, { curso: string; usuarioCursoId: number; cursoId: number }>();
    cursos.forEach((c) => (c.evaluaciones || []).forEach((ev) => map.set(ev.id, { curso: c.cursoNombre, usuarioCursoId: c.usuarioCursoId, cursoId: c.cursoId })));
    return map;
  }, [cursos]);

  const days: DayCell[] = useMemo(() => {
    const first = startOfMonth(month);
    const last = endOfMonth(month);
    const firstWeekDay = (first.getDay() + 6) % 7;
    const grid: DayCell[] = [];
    for (let i = 0; i < firstWeekDay; i++) {
      const d = new Date(first); d.setDate(first.getDate() - (firstWeekDay - i));
      grid.push({ date: d, inMonth: false });
    }
    for (let d = 1; d <= last.getDate(); d++) grid.push({ date: new Date(month.getFullYear(), month.getMonth(), d), inMonth: true });
    while (grid.length % 7 !== 0 || grid.length < 42) {
      const prev = grid[grid.length - 1].date; const d = new Date(prev); d.setDate(prev.getDate() + 1); grid.push({ date: d, inMonth: false });
    }
    return grid;
  }, [month]);

  const scheduleByDay = useMemo(() => {
    const map = new Map<string, ScheduleEvent[]>();
    const visibleDates = days.map((c) => c.date);
    const monthDatesByDow = new Map<number, Date[]>();
    for (let dow = 1; dow <= 7; dow++) {
      monthDatesByDow.set(
        dow,
        visibleDates.filter((d) => ((d.getDay() + 6) % 7) + 1 === dow && (!periodStart || d >= periodStart) && (!periodEnd || d <= periodEnd))
      );
    }
    cursos.forEach((c) => {
      const blocks = horario[c.usuarioCursoId] ?? [];
      blocks.forEach((b) => {
        const dia = Math.max(1, Math.min(7, Number(b.diaSemana || 1)));
        const fechas = monthDatesByDow.get(dia) ?? [];
        fechas.forEach((fd) => {
          const key = toKey(fd);
          const entry: ScheduleEvent = { curso: c.cursoNombre, cursoId: c.cursoId, usuarioCursoId: c.usuarioCursoId, horaInicio: b.horaInicio, duracionMin: Number(b.duracionMin || 45) };
          if (!map.has(key)) map.set(key, []);
          map.get(key)!.push(entry);
        });
      });
    });
    return map;
  }, [cursos, horario, days, periodStart, periodEnd]);

  const hitosByDay = useMemo(() => {
    const map = new Map<string, UsuarioEvaluacionDto[]>();
    (evaluaciones ?? []).forEach((ev) => {
      if (!ev.fechaEstimada) return;
      const info = byEvalId.get(ev.id);
      const d = parseLocalDate(ev.fechaEstimada);
      if (!d || Number.isNaN(d.getTime())) return;
      const dow = (d.getDay() + 6) % 7;
      const monday = new Date(d); monday.setDate(d.getDate() - dow);
      let target = new Date(d);
      const blocks = info ? (horario[info.usuarioCursoId] ?? []) : [];
      if (blocks.length) {
        const pref = Math.min(...blocks.map((b) => Math.max(1, Math.min(7, Number(b.diaSemana || 1)))));
        const offset = pref - 1; target = new Date(monday); target.setDate(monday.getDate() + offset);
      }
      if ((periodStart && target < periodStart) || (periodEnd && target > periodEnd)) return;
      const key = toKey(target);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(ev);
    });
    return map;
  }, [evaluaciones, horario, byEvalId, periodStart, periodEnd]);

  const selectedKey = useMemo(() => toKey(selected), [selected]);
  const selectedHitos = (hitosByDay.get(selectedKey) ?? []).map((ev) => ({ ev, info: byEvalId.get(ev.id) }));
  const selectedClases = scheduleByDay.get(selectedKey) ?? [];

  return (
    <div className="min-h-screen bg-[#18132a] px-4 py-10">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <a href="/home" className="text-white/70 hover:text-white underline text-sm">Inicio</a>
            <h1 className="text-3xl sm:text-4xl font-black text-white mt-1">Agenda</h1>
            <div className="text-white/60 mt-1 text-sm">{semanaActual ? `Semana ${semanaActual}` : ""}</div>
          </div>
          <div className="flex w-full sm:w-auto flex-wrap items-center gap-2">
            <button onClick={() => { const t = new Date(); setMonth(new Date(t.getFullYear(), t.getMonth(), 1)); setSelected(new Date()); }} className="text-white/80 border border-white/20 px-3 py-1.5 rounded-xl">Hoy</button>
            <button onClick={() => setPlannerDialogOpen(true)} className="text-white/90 border border-[#7c3aed] px-3 py-1.5 rounded-xl">Configurar horario</button>
          </div>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <CalendarGrid
            month={month}
            days={days}
            selected={selected}
            onSelect={setSelected}
            onPrevMonth={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
            onNextMonth={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
            scheduleByDay={scheduleByDay}
            hitosByDay={hitosByDay}
            toKey={toKey}
          />

          <DayDetails selected={selected} selectedClases={selectedClases} selectedHitos={selectedHitos} />
        </section>
      </div>

      {plannerDialogOpen && (
        <PlannerDialog
          open={plannerDialogOpen}
          token={token}
          cursos={cursos}
          horario={horario}
          onClose={() => setPlannerDialogOpen(false)}
          onHorarioSaved={(ucid, onlyThis) => setHorario((prev) => ({ ...prev, [ucid]: onlyThis }))}
        />
      )}
    </div>
  );
}

