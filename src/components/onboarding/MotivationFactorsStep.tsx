import { Badge } from "@/components/ui";

interface MotivationFactorsStepProps {
  selected: string[];
  onUpdate: (factors: string[]) => void;
}

const MOTIVATION_OPTIONS = [
  { id: "grades", label: "🎯 Mejorar mis calificaciones", icon: "⭐" },
  { id: "skills", label: "💪 Desarrollar nuevas habilidades", icon: "🚀" },
  { id: "career", label: "🏢 Avanzar en mi carrera profesional", icon: "📈" },
  { id: "knowledge", label: "🧠 Ampliar mi conocimiento", icon: "📚" },
  { id: "community", label: "🤝 Conectar con otros estudiantes", icon: "👥" },
  { id: "wellbeing", label: "😊 Mejorar mi bienestar académico", icon: "💚" },
];

export function MotivationFactorsStep({
  selected,
  onUpdate,
}: MotivationFactorsStepProps) {
  const toggleFactor = (id: string) => {
    if (selected.includes(id)) {
      onUpdate(selected.filter((x) => x !== id));
    } else {
      onUpdate([...selected, id]);
    }
  };

  return (
    <>
      <Badge variant="secondary" className="mb-6 inline-flex">
        Paso 7 de 7 - Casi Listo!
      </Badge>
      <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
        Qué te Motiva
      </h2>
      <p className="text-primary-100 mb-8 max-w-lg mx-auto">
        Selecciona los factores que más te motivan (puedes elegir múltiples)
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
        {MOTIVATION_OPTIONS.map((option) => (
          <button
            key={option.id}
            onClick={() => toggleFactor(option.id)}
            className={`p-4 rounded-xl font-semibold transition transform text-left ${
              selected.includes(option.id)
                ? "bg-gradient-primary border border-primary-400 text-white scale-105"
                : "bg-white/15 hover:bg-white/25 border border-white/30 text-white hover:scale-105"
            }`}
          >
            <div className="text-lg mb-1">{option.icon}</div>
            <div className="text-sm">{option.label}</div>
          </button>
        ))}
      </div>
    </>
  );
}
