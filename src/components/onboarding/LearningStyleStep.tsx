import { Badge } from "@/components/ui";

interface LearningStyleStepProps {
  selected: string;
  onUpdate: (style: string) => void;
}

const LEARNING_STYLES = [
  {
    id: "visual",
    label: "👁️ Visual",
    description: "Aprendo mejor con gráficos, diagramas y videos",
  },
  {
    id: "auditory",
    label: "👂 Auditivo",
    description: "Aprendo mejor escuchando explicaciones y discusiones",
  },
  {
    id: "reading",
    label: "📖 Lectura/Escritura",
    description: "Aprendo mejor leyendo y escribiendo notas",
  },
  {
    id: "kinesthetic",
    label: "🤲 Kinestésico",
    description: "Aprendo mejor haciendo y practicando",
  },
];

export function LearningStyleStep({
  selected,
  onUpdate,
}: LearningStyleStepProps) {
  return (
    <>
      <Badge variant="secondary" className="mb-6 inline-flex">
        Paso 6 de 7
      </Badge>
      <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
        Tu Estilo de Aprendizaje
      </h2>
      <p className="text-primary-100 mb-8 max-w-lg mx-auto">
        Ayúdanos a entender cómo aprendes mejor
      </p>

      <div className="space-y-3 max-w-md mx-auto">
        {LEARNING_STYLES.map((style) => (
          <button
            key={style.id}
            onClick={() => onUpdate(style.id)}
            className={`w-full p-4 rounded-xl font-bold transition transform text-left ${
              selected === style.id
                ? "bg-gradient-primary border border-primary-400 text-white scale-105"
                : "bg-white/15 hover:bg-white/25 border border-white/30 text-white hover:scale-105"
            }`}
          >
            <div className="font-bold text-lg">{style.label}</div>
            <div className="text-sm text-white/70">{style.description}</div>
          </button>
        ))}
      </div>
    </>
  );
}
