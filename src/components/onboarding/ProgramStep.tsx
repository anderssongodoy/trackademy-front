import { Badge } from "@/components/ui";
import { useMemo, useState } from "react";
import { Program } from "@/types/onboarding";

interface ProgramStepProps {
  selected: string;
  programs: Program[];
  onSelect: (program: string) => void;
}

export function ProgramStep({ selected, programs, onSelect }: ProgramStepProps) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return programs;
    return programs.filter((p) =>
      [p.name, p.code, p.id].filter(Boolean).some((t) => String(t).toLowerCase().includes(query))
    );
  }, [q, programs]);
  return (
    <>
      <Badge variant="secondary" className="mb-6 inline-flex">Programa</Badge>
      <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
        Tu Programa Académico
      </h2>
      <p className="text-primary-100 mb-8 max-w-lg mx-auto">
        Selecciona el programa en el que estás matriculado
      </p>

      <div className="mb-4 max-w-md mx-auto">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full rounded-xl bg-white/10 border border-white/20 p-3 text-white"
          placeholder="Buscar programa"
        />
      </div>

      <div className="space-y-3 max-w-md mx-auto max-h-72 overflow-auto">
        {filtered.map((program) => (
          <button
            key={program.id}
            onClick={() => onSelect(program.id)}
            className={`w-full p-4 rounded-xl font-bold transition transform text-left ${
              selected === program.id
                ? "bg-gradient-primary border border-primary-400 text-white scale-105"
                : "bg-white/15 hover:bg-white/25 border border-white/30 text-white hover:scale-105"
            }`}
          >
            <div className="font-bold">{program.name}</div>
            {program.code && (
              <div className="text-sm text-white/70">{program.code}</div>
            )}
          </button>
        ))}
      </div>
    </>
  );
}
