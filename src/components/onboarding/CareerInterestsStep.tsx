
import { Badge } from "@/components/ui";

interface CareerInterestsStepProps {
  selected?: string[];
  onUpdate: (interests: string[]) => void;
}

const CAREER_OPTIONS = [
  { id: "business", label: "Negocios y Gestión" },
  { id: "design", label: "Diseño y Creatividad" },
  { id: "tech", label: "Tecnología e Informática" },
  { id: "health", label: "Salud y Bienestar" },
  { id: "education", label: "Educación" },
  { id: "science", label: "Ciencia e Ingeniería" },
  { id: "social", label: "Ciencias Sociales" },
  { id: "other", label: "Otro" },
];

export function CareerInterestsStep({
  selected = [],
  onUpdate,
}: CareerInterestsStepProps) {
  const toggleInterest = (id: string) => {
    if (selected.includes(id)) {
      onUpdate(selected.filter((x) => x !== id));
    } else {
      onUpdate([...selected, id]);
    }
  };

  return (
    <>
      <Badge variant="secondary" className="mb-6 inline-flex">Intereses</Badge>
      <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Intereses Profesionales</h2>
      <p className="text-primary-100 mb-8 max-w-lg mx-auto">Selecciona tus áreas de interés</p>
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto max-h-48 overflow-auto scrollbar-none">
        {CAREER_OPTIONS.map((option) => (
          <button
            key={option.id}
            onClick={() => toggleInterest(option.id)}
            className={`p-3 rounded-xl font-semibold transition border text-left ${
              selected.includes(option.id)
                ? "bg-gradient-primary border-primary-400 text-white scale-105"
                : "bg-white/15 hover:bg-white/25 border-white/30 text-white hover:scale-105"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </>
  );
}
