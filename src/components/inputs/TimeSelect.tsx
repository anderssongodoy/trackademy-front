"use client";

import React from "react";

type Props = {
  value?: string; // HH:mm (24h)
  onChange: (val: string) => void;
  startHour?: number; // inclusive
  endHour?: number; // inclusive
  minuteStep?: 5 | 10 | 15 | 30;
  className?: string;
};

export default function TimeSelect({ value = "08:00", onChange, startHour = 6, endHour = 22, minuteStep = 15, className = "" }: Props) {
  const [hh, mm] = (value || "08:00").split(":").map((x) => Number(x) || 0);
  const hours: number[] = [];
  for (let h = startHour; h <= endHour; h++) hours.push(h);
  const minutes: number[] = [];
  for (let m = 0; m < 60; m += minuteStep) minutes.push(m);

  const fmt = (n: number) => (n < 10 ? `0${n}` : String(n));
  const setHour = (h: number) => onChange(`${fmt(h)}:${fmt(mm)}`);
  const setMin = (m: number) => onChange(`${fmt(hh)}:${fmt(m)}`);

  return (
    <div className={`grid grid-cols-5 gap-2 ${className}`}>
      <select
        value={hh}
        onChange={(e) => setHour(Number(e.target.value))}
        className="col-span-2 rounded-xl bg-[#18132a] border border-[#7c3aed] p-2 text-white"
      >
        {hours.map((h) => (
          <option key={h} value={h}>{fmt(h)}</option>
        ))}
      </select>
      <div className="text-center text-white/60 self-center">:</div>
      <select
        value={mm}
        onChange={(e) => setMin(Number(e.target.value))}
        className="col-span-2 rounded-xl bg-[#18132a] border border-[#7c3aed] p-2 text-white"
      >
        {minutes.map((m) => (
          <option key={m} value={m}>{fmt(m)}</option>
        ))}
      </select>
    </div>
  );
}

