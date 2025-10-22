
import { Badge } from "@/components/ui";
import { useMemo, useState } from "react";
import { Campus, Program } from "@/types/onboarding";

interface CampusStepProps {
  selectedCampus: string;
  campuses: Campus[];
  onSelectCampus: (campus: string) => void;
  selectedProgram: string;
  programs: Program[];
  onSelectProgram: (program: string) => void;
}

export function CampusStep({ selectedCampus, campuses, onSelectCampus, selectedProgram, programs, onSelectProgram }: CampusStepProps) {
  const [qCampus, setQCampus] = useState("");
  const [qProgram, setQProgram] = useState("");
  const filteredCampuses = useMemo(() => {
    const query = qCampus.trim().toLowerCase();
    if (!query) return campuses;
    return campuses.filter((c) =>
      [c.name, c.city, c.id].filter(Boolean).some((t) => String(t).toLowerCase().includes(query))
    );
  }, [qCampus, campuses]);
  const filteredPrograms = useMemo(() => {
    const query = qProgram.trim().toLowerCase();
    if (!query) return programs;
    return programs.filter((p) =>
      [p.name, p.code, p.id].filter(Boolean).some((t) => String(t).toLowerCase().includes(query))
    );
  }, [qProgram, programs]);
  return (
    <>
      <Badge variant="secondary" className="mb-6 inline-flex">Campus y Programa</Badge>
      <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Selecciona tu Campus y Programa</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <p className="text-primary-100 mb-4 max-w-lg">Elige el campus donde estudias</p>
          <input
            value={qCampus}
            onChange={(e) => setQCampus(e.target.value)}
            className="w-full rounded-xl bg-white/10 border border-white/20 p-3 text-white mb-4"
            placeholder="Buscar campus"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-auto scrollbar-none">
            {filteredCampuses.map((campus) => (
              <button
                key={campus.id}
                onClick={() => onSelectCampus(campus.id)}
                className={`p-3 rounded-xl font-bold transition border text-left ${
                  selectedCampus === campus.id
                    ? "bg-gradient-primary border-primary-400 text-white scale-105"
                    : "bg-white/15 hover:bg-white/25 border-white/30 text-white"
                }`}
              >
                {campus.name}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-primary-100 mb-4 max-w-lg">Selecciona tu programa académico</p>
          <input
            value={qProgram}
            onChange={(e) => setQProgram(e.target.value)}
            className="w-full rounded-xl bg-white/10 border border-white/20 p-3 text-white mb-4"
            placeholder="Buscar programa"
          />
          <div className="grid grid-cols-1 gap-3 max-h-56 overflow-auto scrollbar-none">
            {filteredPrograms.map((program) => (
              <button
                key={program.id}
                onClick={() => onSelectProgram(program.id)}
                className={`p-3 rounded-xl font-bold transition border text-left ${
                  selectedProgram === program.id
                    ? "bg-gradient-primary border-primary-400 text-white scale-105"
                    : "bg-white/15 hover:bg-white/25 border-white/30 text-white"
                }`}
              >
                {program.name}
                {program.code && (
                  <span className="block text-xs text-white/60">{program.code}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
