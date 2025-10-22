"use client";

import React from "react";
import { OnboardingFormData } from "@/types/onboarding";

type Props = {
  data: OnboardingFormData;
};

export function ConfirmationStep({ data }: Props) {
  return (
    <div className="text-left space-y-4">
      <h3 className="text-white text-xl font-bold">Revisa tu información</h3>
      <div className="grid sm:grid-cols-2 gap-4 text-white/90">
        <Info label="Campus" value={data.campus} />
        <Info label="Programa" value={data.program} />
        <Info label="Ciclo" value={String(data.cycle)} />
        <Info label="Especialización" value={data.specialization || "-"} />
        <Info label="Intereses" value={data.careerInterests.join(", ") || "-"} />
        <Info label="Estilo" value={data.learningStyle} />
        <Info label="Motivación" value={data.motivationFactors.join(", ") || "-"} />
        <Info label="Horas estudio/día" value={String(data.studyHoursPerDay)} />
        <Info label="Franjas" value={(data.preferredStudyTimes || []).join(", ") || "-"} />
        <Info label="Trabajo/semana" value={String(data.workHoursPerWeek ?? 0)} />
        <Info label="Extracurriculares/semana" value={String(data.extracurricularHoursPerWeek ?? 0)} />
        <Info label="Compartir datos" value={data.allowDataSharing ? "Sí" : "No"} />
        <Info label="Alertas" value={data.wantsAlerts ? "Sí" : "No"} />
        <Info label="Incentivos" value={data.wantsIncentives ? "Sí" : "No"} />
      </div>
      <div>
        <p className="text-xs text-white/60">Disponibilidad (JSON):</p>
        <pre className="bg-white/10 border border-white/20 p-3 rounded-md text-white/90 overflow-auto text-xs">{data.weeklyAvailabilityJson || "{}"}</pre>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/10 border border-white/20 rounded-md p-3">
      <p className="text-xs text-white/60">{label}</p>
      <p className="font-semibold text-white">{value}</p>
    </div>
  );
}
