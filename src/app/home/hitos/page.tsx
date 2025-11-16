"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import meService, {
  type UsuarioEvaluacionDto,
  type UsuarioCursoResumenDto,
  type HorarioBloque,
} from "@/services/meService";
import { getLoginStatus } from "@/services/accountService";
import { onboardingService } from "@/services/onboardingService";
import TimeSelect from "@/components/inputs/TimeSelect";

function toTitleCase(input?: string | null): string {
  if (!input) return "";
  const lower = input.toLowerCase();
  const small = new Set(["de","del","la","las","los","y","e","en","el","para","por","a"]);
  return lower
    .split(/\s+/)
    .map((w, i) => {
      if (/^(ii|iii|iv|vi|vii|viii|ix|x)$/i.test(w)) return w.toUpperCase();
      if (i > 0 && small.has(w)) return w;
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(" ");
}

type DayCell = { date: Date; inMonth: boolean };

type ScheduleEvent = {
  curso: string;
  cursoId: number;
  usuarioCursoId: number;
  horaInicio: string; // HH:mm
  duracionMin: number; // 45, 90, 135, 180
};

function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }
function sameDate(a: Date, b: Date) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
function pad2(n: number) { return n < 10 ? `0${n}` : String(n); }
function parseLocalDate(s?: string | null): Date | null {
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

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
const UNI_ID = Number(process.env.NEXT_PUBLIC_UNIVERSIDAD_ID || "1");

export default function HitosCalendarPage() {
  const { data: session } = useSession();
  const token = (session as { idToken?: string } | null)?.idToken ?? "";
  const user = (session as { user?: { image?: string | null; name?: string | null } } | null)?.user;

  const [cursos, setCursos] = useState<UsuarioCursoResumenDto[]>([]);
  const [evaluaciones, setEvaluaciones] = useState<UsuarioEvaluacionDto[]>([]);
  const [horario, setHorario] = useState<Record<number, HorarioBloque[]>>({}); // usuarioCursoId -> bloques
  const [month, setMonth] = useState<Date>(() => new Date());
  const [selected, setSelected] = useState<Date>(() => new Date());
  const [showConfig, setShowConfig] = useState(false);
  const [expandedCurso, setExpandedCurso] = useState<number | null>(null);
  const [periodStart, setPeriodStart] = useState<Date | null>(null);
  const [periodEnd, setPeriodEnd] = useState<Date | null>(null);
  const [userMenu, setUserMenu] = useState(false);
  // Modal editor state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalCurso, setModalCurso] = useState<{ usuarioCursoId: number; cursoId: number; nombre: string } | null>(null);
  const [modalBlocks, setModalBlocks] = useState<HorarioBloque[]>([]);
  const [plannerCurso, setPlannerCurso] = useState<{ usuarioCursoId: number; cursoId: number; nombre: string } | null>(null);
  const [plannerBlocks, setPlannerBlocks] = useState<HorarioBloque[]>([]);
  const [plannerTargetMin, setPlannerTargetMin] = useState<number>(0);
  const [plannerLoading, setPlannerLoading] = useState<boolean>(false);
  const [plannerDialogOpen, setPlannerDialogOpen] = useState<boolean>(false);

  // Planner helpers
  const ensurePlannerLength = (ucid: number, targetMin: number, seed: HorarioBloque[]) => {
    const per45 = Math.max(0, Math.floor(targetMin / 45));
    // Si no hay bloques previos, generar secuencia por defecto encadenada en el mismo día
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
    // Asegura encadenado por defecto dentro del mismo día
    for (let i = 1; i < list.length; i++) {
      const prev = list[i - 1];
      const cur = list[i];
      if (prev.diaSemana === cur.diaSemana) {
        const [h,m] = prev.horaInicio.split(":").map(n => Number(n));
        const mins = h*60+m + 45;
        const nh = Math.floor(mins/60); const nm = mins%60;
        list[i] = { ...cur, horaInicio: `${nh<10?`0${nh}`:nh}:${nm<10?`0${nm}`:nm}` };
      }
    }
    return list;
  };

  // Helpers de tiempo para encadenar bloques de 45m
  const fmt2 = (n: number) => (n < 10 ? `0${n}` : String(n));
  function addMinutes(hhmm: string, delta: number): { time: string; overflow: boolean } {
    const [h, m] = (hhmm || "08:00").split(":").map((x) => Number(x) || 0);
    const total = h * 60 + m + delta;
    const endHour = 22; // respetar TimeSelect por defecto
    const endTotal = endHour * 60 + 59;
    if (total > endTotal) return { time: "08:00", overflow: true };
    const nh = Math.floor(total / 60);
    const nm = total % 60;
    return { time: `${fmt2(nh)}:${fmt2(nm)}`, overflow: false };
  }

  function nextDay(d: number): number { return d >= 7 ? 1 : d + 1; }

  // Al abrir el diálogo no seleccionamos curso por defecto
  useEffect(() => {
    if (!plannerDialogOpen) return;
    setPlannerCurso(null);
    setPlannerBlocks([]);
    setPlannerTargetMin(0);
  }, [plannerDialogOpen]);

  function recalcFrom(list: HorarioBloque[], startIndex: number): HorarioBloque[] {
    // Recalcula sólo bloques posteriores encadenando día y hora desde el previo.
    const res = [...list];
    for (let j = startIndex + 1; j < res.length; j++) {
      const prevB = res[j - 1];
      const { time, overflow } = addMinutes(prevB.horaInicio, 45);
      res[j] = {
        ...res[j],
        diaSemana: overflow ? nextDay(prevB.diaSemana) : prevB.diaSemana,
        horaInicio: overflow ? "08:00" : time,
      };
    }
    return res;
  }

  // Initial load: cursos, evaluaciones, horario
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

  // Load period bounds from current status
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
        } catch {
          // ignore
        }
      }
    })();
    return () => { mounted = false; };
  }, [token]);

  // evaluacionId -> curso info
  const byEvalId = useMemo(() => {
    const map = new Map<number, { curso: string; usuarioCursoId: number; cursoId: number }>();
    cursos.forEach((c) => (c.evaluaciones || []).forEach((ev) => map.set(ev.id, { curso: c.cursoNombre, usuarioCursoId: c.usuarioCursoId, cursoId: c.cursoId })));
    return map;
  }, [cursos]);

  // Month grid 7x6
  const days: DayCell[] = useMemo(() => {
    const first = startOfMonth(month);
    const last = endOfMonth(month);
    const firstWeekDay = (first.getDay() + 6) % 7; // monday=0
    const grid: DayCell[] = [];
    for (let i = 0; i < firstWeekDay; i++) {
      const d = new Date(first); d.setDate(first.getDate() - (firstWeekDay - i));
      grid.push({ date: d, inMonth: false });
    }
    for (let d = 1; d <= last.getDate(); d++) {
      grid.push({ date: new Date(month.getFullYear(), month.getMonth(), d), inMonth: true });
    }
    while (grid.length % 7 !== 0 || grid.length < 42) {
      const prev = grid[grid.length - 1].date; const d = new Date(prev); d.setDate(prev.getDate() + 1); grid.push({ date: d, inMonth: false });
    }
    return grid;
  }, [month]);

  // Weekly classes derived from horario, repeated on visible dates within period
  const scheduleByDay = useMemo(() => {
    const map = new Map<string, ScheduleEvent[]>();
    const visibleDates = days.map((c) => c.date);
    const monthDatesByDow = new Map<number, Date[]>(); // 1..7 -> dates
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
          const key = `${fd.getFullYear()}-${pad2(fd.getMonth() + 1)}-${pad2(fd.getDate())}`;
          const entry: ScheduleEvent = { curso: c.cursoNombre, cursoId: c.cursoId, usuarioCursoId: c.usuarioCursoId, horaInicio: b.horaInicio, duracionMin: Number(b.duracionMin || 45) };
          if (!map.has(key)) map.set(key, []);
          map.get(key)!.push(entry);
        });
      });
    });
    return map;
  }, [cursos, horario, days, periodStart, periodEnd]);

  // Evaluations placed on their effective day: use fechaEstimada; if curso has horario, move within that week to the earliest diaSemana; filter by period bounds
  const hitosByDay = useMemo(() => {
    const map = new Map<string, UsuarioEvaluacionDto[]>();
    (evaluaciones ?? []).forEach((ev) => {
      if (!ev.fechaEstimada) return;
      const info = byEvalId.get(ev.id);
      const d = parseLocalDate(ev.fechaEstimada);
      if (!d || Number.isNaN(d.getTime())) return;
      const dow = (d.getDay() + 6) % 7; // monday=0
      const monday = new Date(d); monday.setDate(d.getDate() - dow);
      let target = new Date(d);
      const blocks = info ? (horario[info.usuarioCursoId] ?? []) : [];
      if (blocks.length) {
        const pref = Math.min(...blocks.map((b) => Math.max(1, Math.min(7, Number(b.diaSemana || 1)))));
        const offset = pref - 1; target = new Date(monday); target.setDate(monday.getDate() + offset);
      }
      if ((periodStart && target < periodStart) || (periodEnd && target > periodEnd)) return;
      const key = `${target.getFullYear()}-${pad2(target.getMonth() + 1)}-${pad2(target.getDate())}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(ev);
    });
    return map;
  }, [evaluaciones, horario, byEvalId, periodStart, periodEnd]);

  const selectedKey = `${selected.getFullYear()}-${pad2(selected.getMonth() + 1)}-${pad2(selected.getDate())}`;
  const selectedHitos = (hitosByDay.get(selectedKey) ?? []).map((ev) => ({ ev, info: byEvalId.get(ev.id) }));
  const selectedClases = scheduleByDay.get(selectedKey) ?? [];

  // Schedule editor helpers
  const upsertBlock = (usuarioCursoId: number, index: number, patch: Partial<HorarioBloque>) => {
    setHorario((prev) => {
      const list = [...(prev[usuarioCursoId] ?? [])];
      const current = list[index] || { usuarioCursoId, diaSemana: 1, horaInicio: "08:00", duracionMin: 45 };
      list[index] = { ...current, ...patch, usuarioCursoId } as HorarioBloque;
      return { ...prev, [usuarioCursoId]: list };
    });
  };
  const addBlock = (usuarioCursoId: number) => upsertBlock(usuarioCursoId, (horario[usuarioCursoId]?.length ?? 0), {});
  const removeBlock = (usuarioCursoId: number, index: number) => {
    setHorario((prev) => {
      const list = [...(prev[usuarioCursoId] ?? [])];
      list.splice(index, 1);
      return { ...prev, [usuarioCursoId]: list };
    });
  };
  const saveBlocks = async (usuarioCursoId: number) => {
    const blocks = (horario[usuarioCursoId] ?? []).map((b) => ({
      usuarioCursoId,
      diaSemana: Math.max(1, Math.min(7, Number(b.diaSemana || 1))),
      horaInicio: b.horaInicio || "08:00",
      duracionMin: [45, 90, 135, 180].includes(Number(b.duracionMin)) ? Number(b.duracionMin) : 45,
    }));
    await meService.postHorario(blocks, token);
  };

  // Modal helpers
  const openModalForCurso = (c: UsuarioCursoResumenDto) => {
    const blocks = [...(horario[c.usuarioCursoId] ?? [])];
    setModalBlocks(blocks.length ? blocks : [{ usuarioCursoId: c.usuarioCursoId, diaSemana: 1, horaInicio: "08:00", duracionMin: 45 }]);
    setModalCurso({ usuarioCursoId: c.usuarioCursoId, cursoId: c.cursoId, nombre: c.cursoNombre });
    setModalOpen(true);
  };
  const modalUpsert = (index: number, patch: Partial<HorarioBloque>) => {
    setModalBlocks((prev) => {
      const list = [...prev];
      const base = list[index] ?? { usuarioCursoId: modalCurso!.usuarioCursoId, diaSemana: 1, horaInicio: "08:00", duracionMin: 45 };
      list[index] = { ...base, ...patch, usuarioCursoId: modalCurso!.usuarioCursoId } as HorarioBloque;
      return list;
    });
  };
  const modalAdd = () => setModalBlocks((prev) => [...prev, { usuarioCursoId: modalCurso!.usuarioCursoId, diaSemana: 1, horaInicio: "08:00", duracionMin: 45 }]);
  const modalRemove = (i: number) => setModalBlocks((prev) => prev.filter((_, idx) => idx !== i));
  const modalSuggestByHoras = async () => {
    if (!modalCurso) return;
    const detail = await onboardingService.fetchCursoDetalle(modalCurso.cursoId, token);
    const horas = Number(detail?.horasSemanales ?? 0);
    const blocksCount = Math.max(1, Math.ceil((horas * 60) / 45));
    const generated: HorarioBloque[] = [];
    for (let i = 0; i < blocksCount; i++) {
      const dia = (i % 5) + 1; // Mon..Fri
      // distribute start times a bit: 08:00, 10:00, 12:00, 14:00...
      const hour = 8 + (i % 5) * 2;
      const hh = hour < 10 ? `0${hour}` : String(hour);
      generated.push({ usuarioCursoId: modalCurso.usuarioCursoId, diaSemana: dia, horaInicio: `${hh}:00`, duracionMin: 45 });
    }
    setModalBlocks(generated);
  };
  const modalSave = async () => {
    if (!modalCurso) return;
    const ucid = modalCurso.usuarioCursoId;
    const blocks = modalBlocks.map((b) => ({
      usuarioCursoId: ucid,
      diaSemana: Math.max(1, Math.min(7, Number(b.diaSemana || 1))),
      horaInicio: b.horaInicio || "08:00",
      duracionMin: [45, 90, 135, 180].includes(Number(b.duracionMin)) ? Number(b.duracionMin) : 45,
    }));
    const ok = await meService.postHorario(blocks, token);
    if (ok) {
      // Re-fetch desde backend para reflejar expansión a 45m y reemplazo total
      const fresh = await meService.getHorario(token, ucid);
      const onlyThis = (fresh || []).filter((b) => Number(b.usuarioCursoId) === Number(ucid));
      setHorario((prev) => ({ ...prev, [ucid]: onlyThis as HorarioBloque[] }));
      setModalOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#18132a] px-4 py-10">
      <div className="max-w-6xl mx-auto space-y-6">
      <header className="flex items-start justify-between">
        <div>
          <a href="/home" className="text-white/70 hover:text-white underline text-sm">Inicio</a>
          <h1 className="text-3xl sm:text-4xl font-black text-white mt-1">Calendario de hitos</h1>
          <div className="text-white/60 mt-1 text-sm">{semanaActual ? `Semana ${semanaActual}` : ""}</div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { const t = new Date(); setMonth(new Date(t.getFullYear(), t.getMonth(), 1)); setSelected(new Date()); }} className="text-white/80 border border-white/20 px-3 py-1.5 rounded-xl">Hoy</button>
          <button
            onClick={() => {
              // Abrir el modal sin curso preseleccionado ni bloques cargados
              setPlannerCurso(null);
              setPlannerBlocks([]);
              setPlannerTargetMin(0);
              setPlannerLoading(false);
              setPlannerDialogOpen(true);
            }}
            className="text-white/90 border border-[#7c3aed] px-3 py-1.5 rounded-xl"
          >
            Configurar horario
          </button>
          <div className="relative">
            <button onClick={() => setUserMenu((s) => !s)} className="w-9 h-9 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center overflow-hidden hover:bg-white/15">
              {user?.image ? (
                <img src={user.image} alt={user?.name || "Usuario"} className="w-full h-full object-cover" />
              ) : (
                <span className="font-semibold">{(user?.name || "U").trim().charAt(0).toUpperCase()}</span>
              )}
            </button>
            {userMenu ? (
              <div className="absolute right-0 mt-2 w-40 bg-[#23203b] border border-[#7c3aed] rounded-xl shadow-xl p-1 z-10">
                <a href="/perfil" className="block px-3 py-2 text-white/90 hover:text-white hover:bg-white/10 rounded-lg">Perfil</a>
                <a href="/home" className="block px-3 py-2 text-white/90 hover:text-white hover:bg-white/10 rounded-lg">Volver a inicio</a>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#23203b] border border-[#7c3aed] rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <button onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))} className="text-white/80">◀</button>
            <div className="text-white font-bold">
              {month.toLocaleString("es-PE", { month: "long", year: "numeric" })}
            </div>
            <button onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))} className="text-white/80">▶</button>
          </div>
          <div className="grid grid-cols-7 text-center text-white/70 text-xs">
            {["Lun","Mar","Mie","Jue","Vie","Sab","Dom"].map((d) => (<div key={d}>{d}</div>))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((cell, idx) => {
              const key = `${cell.date.getFullYear()}-${pad2(cell.date.getMonth() + 1)}-${pad2(cell.date.getDate())}`;
              const hitosCount = (hitosByDay.get(key)?.length ?? 0);
              const clasesCount = (scheduleByDay.get(key)?.length ?? 0);
              const isToday = sameDate(cell.date, new Date());
              const isSel = sameDate(cell.date, selected);
              return (
                <button key={idx} onClick={() => setSelected(cell.date)}
                  className={[
                    "aspect-square rounded-lg border p-1 flex flex-col items-center justify-between",
                    cell.inMonth ? "border-[#7c3aed] bg-[#1f1a33]" : "border-white/10 bg-white/5 text-white/50",
                    isSel ? "outline outline-2 outline-[#7c3aed]" : "",
                  ].join(" ")}
                >
                  <div className={"text-white/90 text-sm" + (isToday ? " font-bold" : "")}>{cell.date.getDate()}</div>
                  <div className="flex gap-1">
                    {clasesCount > 0 && (<span className="text-[10px] text-white/80 bg-[#7c3aed]/30 px-2 py-0.5 rounded-full">{clasesCount} clases</span>)}
                    {hitosCount > 0 && (<span className="text-[10px] text-white/80 bg-white/10 px-2 py-0.5 rounded-full">{hitosCount} hitos</span>)}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-3 text-white/60 text-xs mt-2">
            <span className="inline-flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-[#7c3aed]/60"></span> Clase</span>
            <span className="inline-flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-white/40"></span> Hito</span>
            {!Object.keys(horario).length ? (
              <span className="ml-auto text-white/50">Tip: Configura tu horario para ver tus clases en el calendario.</span>
            ) : null}
          </div>
        </div>

        <div className="space-y-6">
          {false && showConfig && (<div />)}

          <section className="bg-[#23203b] border border-[#7c3aed] rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-3">{selected.toLocaleDateString("es-PE")}</h3>
            <div className="space-y-4">
              <div>
                <div className="text-white/80 font-medium mb-2">Clases</div>
                {selectedClases.length === 0 ? (
                  <div className="text-white/60">No hay clases este dia.</div>
                ) : (
                  <ul className="space-y-2">
                    {selectedClases.map((s, i) => (
                      <li key={i} className="bg-white/5 border border-white/10 rounded-xl p-3 text-white/90">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{s.curso}</span>
                          <span className="text-white/70 text-sm">{s.horaInicio} · {s.duracionMin}m</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <div className="text-white/80 font-medium mb-2">Hitos</div>
                {selectedHitos.length === 0 ? (
                  <div className="text-white/60">No hay hitos este dia.</div>
                ) : (
                  <ul className="space-y-2">
                    {selectedHitos.map(({ ev, info }) => (
                      <li key={ev.id} className="bg-white/5 border border-white/10 rounded-xl p-3 text-white/90">
                        <div className="flex items-center justify-between">
                          <a href={`/home/cursos/${info?.cursoId ?? ""}`} className="font-medium hover:underline">
                            {info?.curso ?? "Curso"}
                          </a>
                          <span className="text-white/70 text-sm">{ev.codigo ?? "Hito"}</span>
                        </div>
                        {ev.descripcion && (
                          <div className="text-white/70 text-sm mt-1">{ev.descripcion}</div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
      </section>
      </div>

      {/* Planner dialog */}
      {plannerDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative bg-[#23203b] border border-[#7c3aed] rounded-2xl w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-lg font-bold">Configurar horario</h3>
              <button onClick={() => setPlannerDialogOpen(false)} className="text-white/70 hover:text-white">Cerrar</button>
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
                    <option key={c.usuarioCursoId} value={c.usuarioCursoId}>{toTitleCase(c.cursoNombre)}</option>
                  ))}
                </select>
                </div>
              <div>
                <label className="block text-white/80 mb-1">Plan semanal</label>
                <div className="text-white/70 text-sm">{plannerLoading ? "Calculando..." : `${plannerBlocks.length * 45} / ${plannerTargetMin} min`}</div>
              </div>
                    <div className="text-white/60 text-xs md:text-right">Cada bloque es de 45 min. Ajusta día y hora para cada uno.</div>
                  </div>
                  {!plannerCurso ? (
                    <div className="text-white/60">Selecciona un curso.</div>
                  ) : (
                    <div className="space-y-2 max-h-[50vh] overflow-auto pr-1">
                      <div className="mb-2"></div>
                      {plannerBlocks.map((b, i) => (
                        <div key={i} className="grid grid-cols-12 gap-2 items-center">
                          <select value={b.diaSemana} onChange={(e) => setPlannerBlocks((prev) => {
                            const list=[...prev];
                            list[i] = { ...list[i], diaSemana: Number(e.target.value), horaInicio: "08:00" };
                            return recalcFrom(list, i);
                          })} className="col-span-5 rounded-xl bg-[#18132a] border border-[#7c3aed] p-2 text-white">
                            <option value={1}>Lunes</option>
                            <option value={2}>Martes</option>
                            <option value={3}>Miércoles</option>
                            <option value={4}>Jueves</option>
                            <option value={5}>Viernes</option>
                            <option value={6}>Sábado</option>
                            <option value={7}>Domingo</option>
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
                            45m
                            {(() => { const r = addMinutes(b.horaInicio,45); return ` · fin ${r.time}`; })()}
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
                  // Persist as 45-min blocks
                  const blocks = plannerBlocks.map((b) => ({
                    usuarioCursoId: ucid,
                    diaSemana: Math.max(1, Math.min(7, Number(b.diaSemana || 1))),
                    horaInicio: b.horaInicio || "08:00",
                    duracionMin: 45,
                  }));
                  const ok = await meService.postHorario(blocks, token);
                  if (ok) {
                    const fresh = await meService.getHorario(token, ucid);
                    const onlyThis = (fresh || []).filter((b) => Number(b.usuarioCursoId) === Number(ucid));
                    setHorario((prev) => ({ ...prev, [ucid]: onlyThis as HorarioBloque[] }));
                    setPlannerDialogOpen(false);
                  }
                }}
              >
                Guardar horario
              </button>
            </div>
          </div>
        </div>
      )}
      </section>
      {modalOpen && modalCurso && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setModalOpen(false)} />
          <div className="relative bg-[#23203b] border border-[#7c3aed] rounded-2xl w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-lg font-bold">Configurar horario · {modalCurso.nombre}</h3>
              <button onClick={() => setModalOpen(false)} className="text-white/70 hover:text-white">Cerrar</button>
            </div>
            <div className="mb-3">
              <button onClick={modalSuggestByHoras} className="text-white/90 border border-[#7c3aed] px-3 py-1.5 rounded-xl">Sugerir con horas semanales</button>
            </div>
            <div className="space-y-2 max-h-[60vh] overflow-auto pr-1">
              {modalBlocks.map((b, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <select value={b.diaSemana} onChange={(e) => modalUpsert(i, { diaSemana: Number(e.target.value) })} className="col-span-4 rounded-xl bg-[#18132a] border border-[#7c3aed] p-2 text-white">
                    <option value={1}>Lunes</option>
                    <option value={2}>Martes</option>
                    <option value={3}>Miercoles</option>
                    <option value={4}>Jueves</option>
                    <option value={5}>Viernes</option>
                    <option value={6}>Sabado</option>
                    <option value={7}>Domingo</option>
                  </select>
                              <TimeSelect value={b.horaInicio} onChange={(v) => modalUpsert(i, { horaInicio: v })} className="col-span-4" />
                  <select value={b.duracionMin} onChange={(e) => modalUpsert(i, { duracionMin: Number(e.target.value) })} className="col-span-3 rounded-xl bg-[#18132a] border border-[#7c3aed] p-2 text-white">
                    <option value={45}>45 min</option>
                    <option value={90}>90 min</option>
                    <option value={135}>135 min</option>
                    <option value={180}>180 min</option>
                  </select>
                  <button onClick={() => modalRemove(i)} className="col-span-1 text-white/70 hover:text-white">x</button>
                </div>
              ))}
              <div>
                <button onClick={modalAdd} className="text-white/90 border border-[#7c3aed] px-3 py-1 rounded-lg">Anadir bloque</button>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setModalOpen(false)} className="text-white/70 border border-white/20 px-3 py-1.5 rounded-xl">Cancelar</button>
              <button onClick={modalSave} className="text-white/90 border border-[#7c3aed] px-3 py-1.5 rounded-xl">Guardar</button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
