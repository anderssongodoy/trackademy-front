import { Badge } from "@/components/ui";
import { OnboardingFormData } from "@/types/onboarding";

interface PreferencesStepProps {
  preferences: Pick<OnboardingFormData, "wantsAlerts" | "wantsIncentives" | "allowDataSharing">;
  onUpdate: (preferences: Partial<OnboardingFormData>) => void;
}

export function PreferencesStep({ preferences, onUpdate }: PreferencesStepProps) {
  const handleToggle = (key: keyof typeof preferences) => {
    onUpdate({ [key]: !preferences[key] });
  };

  return (
    <>
      <Badge variant="secondary" className="mb-6 inline-flex">
        Paso 7 de 7 - Preferencias
      </Badge>
      <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
        Personaliza tu Experiencia
      </h2>
      <p className="text-primary-100 mb-8 max-w-lg mx-auto">
        Cuéntanos tus preferencias para darte la mejor motivación y apoyo
      </p>

      <div className="space-y-4 max-w-md mx-auto text-left">
        {/* Alertas */}
        <label
          onClick={() => handleToggle("wantsAlerts")}
          className="flex items-start gap-4 cursor-pointer p-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 transition"
        >
          <div className="flex-shrink-0 mt-1">
            <input
              type="checkbox"
              checked={preferences.wantsAlerts}
              readOnly
              className="w-6 h-6 rounded-lg cursor-pointer"
            />
          </div>
          <div className="flex-1">
            <div className="font-bold text-white text-lg">🔔 Recibir Alertas</div>
            <div className="text-sm text-white/70">
              Notificaciones sobre tareas, evaluaciones y eventos importantes
            </div>
          </div>
        </label>

        {/* Sistema de Incentivos */}
        <label
          onClick={() => handleToggle("wantsIncentives")}
          className="flex items-start gap-4 cursor-pointer p-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 transition"
        >
          <div className="flex-shrink-0 mt-1">
            <input
              type="checkbox"
              checked={preferences.wantsIncentives}
              readOnly
              className="w-6 h-6 rounded-lg cursor-pointer"
            />
          </div>
          <div className="flex-1">
            <div className="font-bold text-white text-lg">🎯 Motivación y Metas</div>
            <div className="text-sm text-white/70">
              Seguimiento de progreso, logros y consejos para mejorar tu desempeño
            </div>
          </div>
        </label>

        {/* Compartir Datos */}
        <label
          onClick={() => handleToggle("allowDataSharing")}
          className="flex items-start gap-4 cursor-pointer p-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 transition"
        >
          <div className="flex-shrink-0 mt-1">
            <input
              type="checkbox"
              checked={preferences.allowDataSharing}
              readOnly
              className="w-6 h-6 rounded-lg cursor-pointer"
            />
          </div>
          <div className="flex-1">
            <div className="font-bold text-white text-lg">📊 Análisis Anónimo</div>
            <div className="text-sm text-white/70">
              Permitir análisis de datos para mejorar nuestros servicios (completamente anónimo)
            </div>
          </div>
        </label>
      </div>

      <div className="mt-8 p-4 bg-primary-500/20 border border-primary-500/40 rounded-xl">
        <p className="text-sm text-primary-100">
          ✨ Puedes cambiar estas preferencias en cualquier momento desde tu perfil
        </p>
      </div>
    </>
  );
}
