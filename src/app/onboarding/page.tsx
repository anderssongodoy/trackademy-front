"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useSession } from "next-auth/react";
import { CampusStep } from "@/components/onboarding/CampusStep";
import { CycleStep } from "@/components/onboarding/CycleStep";
import { ProgramStep } from "@/components/onboarding/ProgramStep";
import { CareerInterestsStep } from "@/components/onboarding/CareerInterestsStep";
import { StudyHoursStep } from "@/components/onboarding/StudyHoursStep";
import { LearningStyleStep } from "@/components/onboarding/LearningStyleStep";
import { MotivationFactorsStep } from "@/components/onboarding/MotivationFactorsStep";
import { PreferencesStep } from "@/components/onboarding/PreferencesStep";
import { ProgressBar } from "@/components/onboarding/ProgressBar";

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const idToken = (session as unknown as { idToken?: string } | null)?.idToken ?? "";

  const {
    currentStep,
    formData,
    campuses,
    cycles,
    programs,
    loading,
    error,
    isSubmitting,
    nextStep,
    prevStep,
    updateFormData,
    submitOnboarding,
    clearError,
  } = useOnboarding(idToken);

  const handleNext = async () => {
    if (currentStep === 7) {
      const success = await submitOnboarding();
      if (success) {
        router.push("/dashboard");
      }
    } else {
      nextStep();
    }
  };

  const handleSkip = () => {
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-950 bg-linear-to-b from-slate-950 via-primary-950 to-slate-950 overflow-hidden">
      <div className="fixed inset-0 opacity-20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-secondary-500 rounded-full mix-blend-multiply filter blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary-500 rounded-full mix-blend-multiply filter blur-3xl"></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 py-8">
        <div className="w-full max-w-2xl">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                Bienvenido, {session?.user?.name || "Estudiante"}
              </h1>
              <Button variant="outline" size="sm" onClick={handleSkip}>
                Omitir
              </Button>
            </div>

            <ProgressBar current={currentStep} total={7} className="mb-8" />
          </div>

          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-3xl p-6 sm:p-10 text-center min-h-96 flex flex-col justify-between">
            <div>
              {currentStep === 1 && (
                <CampusStep
                  selected={formData.campus}
                  campuses={campuses}
                  onSelect={(campus) => updateFormData({ campus })}
                />
              )}

              {currentStep === 2 && (
                <CycleStep
                  selected={formData.cycle}
                  cycles={cycles}
                  onSelect={(cycle) => updateFormData({ cycle })}
                />
              )}

              {currentStep === 3 && (
                <ProgramStep
                  selected={formData.program}
                  programs={programs}
                  onSelect={(program) => updateFormData({ program })}
                />
              )}

              {currentStep === 4 && (
                <CareerInterestsStep
                  selected={formData.careerInterests}
                  onUpdate={(careerInterests) =>
                    updateFormData({ careerInterests })
                  }
                />
              )}

              {currentStep === 5 && (
                <StudyHoursStep
                  selected={formData.studyHoursPerDay}
                  onUpdate={(studyHoursPerDay) =>
                    updateFormData({ studyHoursPerDay })
                  }
                />
              )}

              {currentStep === 6 && (
                <LearningStyleStep
                  selected={formData.learningStyle}
                  onUpdate={(learningStyle) =>
                    updateFormData({ learningStyle })
                  }
                />
              )}

              {currentStep === 7 && (
                <div>
                  <MotivationFactorsStep
                    selected={formData.motivationFactors}
                    onUpdate={(motivationFactors) =>
                      updateFormData({ motivationFactors })
                    }
                  />

                  <PreferencesStep
                    preferences={{
                      wantsAlerts: formData.wantsAlerts,
                      wantsIncentives: formData.wantsIncentives,
                      allowDataSharing: formData.allowDataSharing,
                    }}
                    onUpdate={updateFormData}
                  />
                </div>
              )}
            </div>

            {error && (
              <div className="mt-6 p-4 bg-red-500/20 border border-red-500/40 rounded-xl flex items-start gap-3">
                <span className="text-xl">⚠️</span>
                <div className="text-left">
                  <p className="text-sm text-red-100">{error}</p>
                  <button
                    onClick={clearError}
                    className="text-xs text-red-300 hover:text-red-200 mt-1 underline"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-center pt-8">
              {currentStep > 1 && (
                <Button
                  variant="outline"
                  size="md"
                  onClick={prevStep}
                  disabled={isSubmitting}
                >
                  ← Atrás
                </Button>
              )}

              <Button
                variant="primary"
                size="lg"
                onClick={handleNext}
                disabled={isSubmitting || loading}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Guardando...
                  </>
                ) : currentStep === 7 ? (
                  "Completar ✨"
                ) : (
                  "Siguiente →"
                )}
              </Button>
            </div>
          </div>

          <div className="mt-8 text-center text-white/60 text-sm">
            <p>Paso {currentStep} de 7</p>
          </div>
        </div>
      </div>
    </div>
  );
}
