import { Badge } from "@/components/ui";
import { Campus } from "@/types/onboarding";

interface CampusStepProps {
  selected: string;
  campuses: Campus[];
  onSelect: (campus: string) => void;
}

export function CampusStep({ selected, campuses, onSelect }: CampusStepProps) {
  return (
    <>
      <Badge variant="secondary" className="mb-6 inline-flex">
        Paso 1 de 7
      </Badge>
      <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
        Selecciona tu Campus
      </h2>
      <p className="text-primary-100 mb-8 max-w-lg mx-auto">
        Elige el campus donde actualmente estudias en la UTP
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
        {campuses.map((campus) => (
          <button
            key={campus.id}
            onClick={() => onSelect(campus.id)}
            className={`p-4 rounded-2xl font-bold transition transform hover:scale-105 border ${
              selected === campus.id
                ? "bg-gradient-primary border-primary-400 text-white scale-105"
                : "bg-white/15 hover:bg-white/25 border-white/30 text-white"
            }`}
          >
            {campus.icon || "📍"} {campus.name}
          </button>
        ))}
      </div>
    </>
  );
}
