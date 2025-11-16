"use client";

import React, { useMemo, useRef } from "react";
import { FiClock } from "react-icons/fi";

type Props = {
  value?: string; // HH:mm (24h)
  onChange: (val: string) => void;
  startHour?: number; // inclusive
  endHour?: number; // inclusive
  minuteStep?: 1 | 5 | 10 | 15 | 30;
  className?: string;
};

export default function TimeSelect({ value = "08:00", onChange, startHour = 6, endHour = 22, minuteStep = 5, className = "" }: Props) {
  const fmt = (n: number) => (n < 10 ? `0${n}` : String(n));
  const min = useMemo(() => `${fmt(Math.max(0,startHour))}:00`, [startHour]);
  const max = useMemo(() => `${fmt(Math.min(23,endHour))}:59`, [endHour]);
  const ref = useRef<HTMLInputElement | null>(null);
  function clampAndRound(v: string): string {
    const m = /^([0-9]{1,2}):([0-9]{1,2})$/.exec(v || "");
    let hh = Number(m?.[1]);
    let mm = Number(m?.[2]);
    if (Number.isNaN(hh)) hh = startHour;
    if (Number.isNaN(mm)) mm = 0;
    hh = Math.max(startHour, Math.min(endHour, hh));
    // round to nearest step down
    mm = Math.max(0, Math.min(59, mm));
    const rounded = Math.floor(mm / minuteStep) * minuteStep;
    return `${fmt(hh)}:${fmt(rounded)}`;
  }
  const normalized = clampAndRound(value || "08:00");
  return (
    <div className={`relative ${className}`}>
      <input
        ref={ref}
        type="time"
        value={normalized}
        min={min}
        max={max}
        step={minuteStep * 60}
        onChange={(e) => onChange(clampAndRound(e.target.value))}
        className={`ta-time-input pr-9 w-full rounded-xl bg-[#18132a] border border-[#7c3aed] p-2 text-white`}
      />
      <button
        type="button"
        aria-label="Elegir hora"
        onClick={() => { const el = ref.current as (HTMLInputElement & { showPicker?: () => void }) | null; if (!el) return; el.showPicker?.(); el.focus(); }}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-white/80 hover:text-white"
      >
        <FiClock size={16} />
      </button>
      <style jsx global>{`
        .ta-time-input { color-scheme: dark; }
        /* Oculta el icono nativo para evitar contraste negro */
        .ta-time-input::-webkit-calendar-picker-indicator { display: none; opacity: 0; }
        .ta-time-input::-webkit-clear-button { display: none; }
      `}</style>
    </div>
  );
}
