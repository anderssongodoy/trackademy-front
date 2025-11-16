"use client";

import { DayCell, ScheduleEvent } from "@/components/hitos/types";
import { DOW_LABELS, sameDate } from "@/components/hitos/dateUtils";
import { type UsuarioEvaluacionDto } from "@/services/meService";

export default function CalendarGrid({
  month,
  days,
  selected,
  onSelect,
  onPrevMonth,
  onNextMonth,
  scheduleByDay,
  hitosByDay,
  toKey,
}: {
  month: Date;
  days: DayCell[];
  selected: Date;
  onSelect: (d: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  scheduleByDay: Map<string, ScheduleEvent[]>;
  hitosByDay: Map<string, UsuarioEvaluacionDto[]>;
  toKey: (d: Date) => string;
}) {
  return (
    <div className="lg:col-span-2 bg-[#23203b] border border-[#7c3aed] rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <button onClick={onPrevMonth} className="text-white/80">‹</button>
        <div className="text-white font-bold">
          {month.toLocaleString("es-PE", { month: "long", year: "numeric" })}
        </div>
        <button onClick={onNextMonth} className="text-white/80">›</button>
      </div>
      <div className="grid grid-cols-7 text-center text-white/70 text-xs">
        {DOW_LABELS.map((d) => (<div key={d}>{d}</div>))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((cell, idx) => {
          const key = toKey(cell.date);
          const hitosCount = (hitosByDay.get(key)?.length ?? 0);
          const clasesCount = (scheduleByDay.get(key)?.length ?? 0);
          const isToday = sameDate(cell.date, new Date());
          const isSel = sameDate(cell.date, selected);
          return (
            <button key={idx} onClick={() => onSelect(cell.date)}
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
      <div className="text-white/60 text-xs flex items-center gap-3">
        <span className="inline-block w-2 h-2 bg-[#7c3aed]/40 rounded-full border border-[#7c3aed]/60" /> Clase
        <span className="inline-block w-2 h-2 bg-white/10 rounded-full border border-white/30" /> Hito
      </div>
    </div>
  );
}

