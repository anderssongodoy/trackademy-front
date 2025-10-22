import { Badge } from "@/components/ui";
import { Cycle } from "@/types/onboarding";

interface CycleStepProps {
  selected: number;
  cycles: Cycle[];
  onSelect: (cycle: number) => void;
}

export function CycleStep({ selected, cycles, onSelect }: CycleStepProps) {
  const allCycles = cycles.length >= 10 ? cycles : Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    label: `Ciclo ${i + 1}`,
    description: `${ordinal(i + 1)} Ciclo`,
  }));
  function ordinal(n: number) {
    switch (n) {
      case 1: return "Primer";
      case 2: return "Segundo";
      case 3: return "Tercer";
      case 4: return "Cuarto";
      case 5: return "Quinto";
      case 6: return "Sexto";
      case 7: return "Sétimo";
      case 8: return "Octavo";
      case 9: return "Noveno";
      case 10: return "Décimo";
      default: return `${n}º`;
    }
  }
  return (
    <>
      <Badge variant="secondary" className="mb-6 inline-flex">
        Paso 2 de 7
      </Badge>
      <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
        ¿En qué ciclo estás?
      </h2>
      <p className="text-primary-100 mb-8 max-w-lg mx-auto">
        Selecciona tu ciclo académico actual
      </p>

  <div className="space-y-3 max-w-xs mx-auto max-h-96 overflow-auto scrollbar-none">
        {allCycles.map((cycle) => (
          <button
            key={cycle.id}
            onClick={() => onSelect(cycle.id)}
            className={`w-full p-4 rounded-xl font-bold transition transform ${
              selected === cycle.id
                ? "bg-gradient-primary border border-primary-400 text-white scale-105"
                : "bg-white/15 hover:bg-white/25 border border-white/30 text-white hover:scale-105"
            }`}
          >
            <div className="font-bold">{cycle.label}</div>
            {cycle.description && (
              <div className="text-sm text-white/70">{cycle.description}</div>
            )}
          </button>
        ))}
      </div>
    </>
  );
}
