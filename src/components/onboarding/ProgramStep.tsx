import { Badge } from "@/components/ui";
import { Program } from "@/types/onboarding";

interface ProgramStepProps {
  selected: string;
  programs: Program[];
  onSelect: (program: string) => void;
}

export function ProgramStep({ selected, programs, onSelect }: ProgramStepProps) {
  return (
    <>
      <Badge variant="secondary" className="mb-6 inline-flex">
        Paso 3 de 7
      </Badge>
      <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
        Tu Programa Académico
      </h2>
      <p className="text-primary-100 mb-8 max-w-lg mx-auto">
        Selecciona el programa en el que estás matriculado
      </p>

      <div className="space-y-3 max-w-md mx-auto">
        {programs.map((program) => (
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
