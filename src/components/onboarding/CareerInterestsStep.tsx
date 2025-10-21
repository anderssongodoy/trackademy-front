import { Badge } from "@/components/ui";

interface CareerInterestsStepProps {
  selected: string[];
  onUpdate: (interests: string[]) => void;
}

const CAREER_OPTIONS = [
  { id: "backend", label: "🔧 Backend & Infraestructura", icon: "⚙️" },
  { id: "frontend", label: "🎨 Frontend & UX", icon: "✨" },
  { id: "mobile", label: "📱 Desarrollo Móvil", icon: "📲" },
  { id: "data", label: "📊 Data Science & Analytics", icon: "📈" },
  { id: "devops", label: "🚀 DevOps & Cloud", icon: "☁️" },
  { id: "security", label: "🔐 Seguridad Informática", icon: "🛡️" },
  { id: "ai", label: "🤖 IA & Machine Learning", icon: "🧠" },
  { id: "gamedev", label: "🎮 Game Development", icon: "🎯" },
];

export function CareerInterestsStep({
  selected,
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
      <Badge variant="secondary" className="mb-6 inline-flex">
        Paso 4 de 7
      </Badge>
      <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
        Intereses Profesionales
      </h2>
      <p className="text-primary-100 mb-8 max-w-lg mx-auto">
        Selecciona las áreas que te interesan (puedes elegir múltiples)
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
        {CAREER_OPTIONS.map((option) => (
          <button
            key={option.id}
            onClick={() => toggleInterest(option.id)}
            className={`p-4 rounded-xl font-semibold transition transform text-left ${
              selected.includes(option.id)
                ? "bg-gradient-primary border border-primary-400 text-white scale-105"
                : "bg-white/15 hover:bg-white/25 border border-white/30 text-white hover:scale-105"
            }`}
          >
            <div className="text-lg mb-1">{option.icon}</div>
            <div>{option.label}</div>
          </button>
        ))}
      </div>
    </>
  );
}
