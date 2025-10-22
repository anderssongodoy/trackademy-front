"use client";

import React from "react";
import { Button } from "@/components/ui";

type Props = {
  studyHoursPerDay: number;
  preferredStudyTimes: string[];
  workHoursPerWeek: number;
  extracurricularHoursPerWeek: number;
  weeklyAvailabilityJson: string;
  onUpdate: (data: Partial<{
    studyHoursPerDay: number;
    preferredStudyTimes: string[];
    workHoursPerWeek: number;
    extracurricularHoursPerWeek: number;
    weeklyAvailabilityJson: string;
  }>) => void;
};

const OPTIONS = [
  { id: "morning", label: "Mañana" },
  { id: "afternoon", label: "Tarde" },
  { id: "evening", label: "Noche" },
  { id: "weekend", label: "Fin de semana" },
];

export function TimeAvailabilityStep({
  studyHoursPerDay,
  preferredStudyTimes,
  workHoursPerWeek,
  extracurricularHoursPerWeek,
  onUpdate,
}: Props) {
  const toggle = (id: string) => {
    const set = new Set(preferredStudyTimes);
    if (set.has(id)) {
      set.delete(id);
    } else {
      set.add(id);
    }
    onUpdate({ preferredStudyTimes: Array.from(set) });
  };
  return (
    <div className="space-y-6 text-left">
      <div>
        <h3 className="text-white text-lg font-bold mb-2">Tiempo de Estudio Diario</h3>
        <input
          type="range"
          min={0}
          max={12}
          step={1}
          value={Number.isFinite(studyHoursPerDay as number) ? studyHoursPerDay : 0}
          onChange={(e) => onUpdate({ studyHoursPerDay: Number(e.target.value) })}
          className="w-full"
        />
        <p className="text-white/80 mt-1">{studyHoursPerDay} h/día</p>
      </div>
      <div>
        <h3 className="text-white text-lg font-bold mb-2">Franjas Preferidas</h3>
        <div className="flex flex-wrap gap-2">
          {OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => toggle(opt.id)}
              className={`px-4 py-2 rounded-lg border font-semibold transition text-white/90 ${
                preferredStudyTimes.includes(opt.id)
                  ? "bg-gradient-primary border-primary-400"
                  : "bg-white/10 border-white/20 hover:bg-white/20"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-white/80 mb-1">Horas de trabajo/semana</label>
          <input
            type="number"
            min={0}
            max={80}
            value={workHoursPerWeek}
            onChange={(e) => onUpdate({ workHoursPerWeek: Number(e.target.value) })}
            className="w-full rounded-xl bg-white/10 border border-white/20 p-2 text-white"
          />
        </div>
        <div>
          <label className="block text-white/80 mb-1">Horas extracurriculares/semana</label>
          <input
            type="number"
            min={0}
            max={80}
            value={extracurricularHoursPerWeek}
            onChange={(e) => onUpdate({ extracurricularHoursPerWeek: Number(e.target.value) })}
            className="w-full rounded-xl bg-white/10 border border-white/20 p-2 text-white"
          />
        </div>
      </div>
    </div>
  );
}
