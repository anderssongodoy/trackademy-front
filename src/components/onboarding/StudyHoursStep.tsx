import { Badge } from "@/components/ui";

interface StudyHoursStepProps {
  selected: number;
  onUpdate: (hours: number) => void;
}

const STUDY_OPTIONS = [
  { value: 1, label: "1 hora", description: "Poco tiempo disponible" },
  { value: 2, label: "2 horas", description: "Tiempo limitado" },
  { value: 3, label: "3 horas", description: "Tiempo moderado" },
  { value: 4, label: "4 horas", description: "Bastante tiempo" },
  { value: 5, label: "5+ horas", description: "Mucho tiempo disponible" },
];

export function StudyHoursStep({ selected, onUpdate }: StudyHoursStepProps) {
  return (
    <>
      <Badge variant="secondary" className="mb-6 inline-flex">
        Paso 5 de 7
      </Badge>
      <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
        Tiempo de Estudio
      </h2>
      <p className="text-primary-100 mb-8 max-w-lg mx-auto">
        ¿Cuántas horas diarias puedes dedicar al estudio?
      </p>

      <div className="space-y-3 max-w-md mx-auto">
        {STUDY_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onUpdate(option.value)}
            className={`w-full p-4 rounded-xl font-bold transition transform text-left ${
              selected === option.value
                ? "bg-gradient-primary border border-primary-400 text-white scale-105"
                : "bg-white/15 hover:bg-white/25 border border-white/30 text-white hover:scale-105"
            }`}
          >
            <div className="font-bold">{option.label}</div>
            <div className="text-sm text-white/70">{option.description}</div>
          </button>
        ))}
      </div>
    </>
  );
}
