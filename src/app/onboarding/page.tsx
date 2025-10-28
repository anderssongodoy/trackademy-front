"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { motion } from "framer-motion";
import { FaCheckCircle } from "react-icons/fa";
import { useOnboarding } from "@/hooks/useOnboarding";
import { CampusStep } from "@/components/onboarding/CampusStep";
import { CycleStep } from "@/components/onboarding/CycleStep";
import { ProgramStep } from "@/components/onboarding/ProgramStep";
import { CareerInterestsStep } from "@/components/onboarding/CareerInterestsStep";
import { LearningStyleStep } from "@/components/onboarding/LearningStyleStep";
import { MotivationFactorsStep } from "@/components/onboarding/MotivationFactorsStep";
import { PreferencesStep } from "@/components/onboarding/PreferencesStep";
import { ProgressBar } from "@/components/onboarding/ProgressBar";
import { TimeAvailabilityStep } from "@/components/onboarding/TimeAvailabilityStep";
import { ConfirmationStep } from "@/components/onboarding/ConfirmationStep";
import CoursesStep from "@/components/onboarding/CoursesStep";
import React, { useEffect } from "react";
import { useSession } from "next-auth/react";
import { onboardingService } from "@/services/onboardingService";

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
    submitCourses,
    savePartial,
    clearError,
  } = useOnboarding(idToken);

  // If the user already finished onboarding on the backend, skip the flow
  useEffect(() => {
    let mounted = true;
    const check = async () => {
      if (!idToken) return;
      try {
        const status = await onboardingService.getOnboardingStatus(idToken);
        if (mounted && status === true) router.push("/home");
      } catch {
        // ignore
      }
    };
    check();
    return () => {
      mounted = false;
    };
  }, [idToken, router]);

  const handleNext = async () => {
    if (currentStep === 6) {
      const okCourses = await submitCourses();
      if (!okCourses) return;
      const success = await submitOnboarding();
      if (success) {
        router.push("/home");
      }
    } else {
      await savePartial();
      nextStep();
    }
  };

  const handleSkip = () => {
    router.push("/home");
  };

  return (
    <div className="min-h-screen bg-[#18132a] flex flex-col items-center justify-center px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="w-full max-w-3xl mx-auto text-center">
        <div className="mb-10">
          <div className="flex items-center justify-center mb-6">
            <FaCheckCircle className="text-[#7c3aed] text-3xl mr-2" />
            <h1 className="text-3xl sm:text-4xl font-black text-white">Onboarding</h1>
          </div>
          <motion.div initial={{ width: 0 }} animate={{ width: `${(currentStep/6)*100}%` }} className="h-2 rounded-full bg-[#7c3aed] mb-8" />
        </div>
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }} className="bg-[#23203b] border border-[#7c3aed] rounded-3xl p-8 sm:p-12 text-left min-h-96 flex flex-col justify-between shadow-lg">
          {currentStep === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Preferencias</h2>
              <div className="mb-6">
                <label className="block text-white/80 mb-2">¿Quieres recibir alertas académicas?</label>
                <input type="checkbox" checked={formData.wantsAlerts} onChange={e => updateFormData({ wantsAlerts: e.target.checked })} className="accent-[#7c3aed] w-5 h-5" />
              </div>
              <div className="mb-6">
                <label className="block text-white/80 mb-2">¿Te interesan incentivos y recompensas?</label>
                <input type="checkbox" checked={formData.wantsIncentives} onChange={e => updateFormData({ wantsIncentives: e.target.checked })} className="accent-[#a21caf] w-5 h-5" />
              </div>
              <div>
                <label className="block text-white/80 mb-2">¿Permites compartir tus datos para mejorar la experiencia?</label>
                <input type="checkbox" checked={formData.allowDataSharing} onChange={e => updateFormData({ allowDataSharing: e.target.checked })} className="accent-[#c7d2fe] w-5 h-5" />
              </div>
            </div>
          )}
          {currentStep === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Datos Académicos</h2>
              <div className="mb-6">
                <label className="block text-white/80 mb-2">Campus</label>
                <select value={formData.campus || ""} onChange={e => updateFormData({ campus: e.target.value })} className="w-full rounded-md bg-[#18132a] border border-[#7c3aed] p-3 text-white">
                  <option value="">Selecciona tu campus</option>
                  {campuses.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="mb-6">
                <label className="block text-white/80 mb-2">Programa</label>
                <select value={formData.program || ""} onChange={e => updateFormData({ program: e.target.value })} className="w-full rounded-md bg-[#18132a] border border-[#a21caf] p-3 text-white">
                  <option value="">Selecciona tu programa</option>
                  {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="mb-6">
                <label className="block text-white/80 mb-2">Ciclo</label>
                <select value={formData.cycle || ""} onChange={e => updateFormData({ cycle: Number(e.target.value) })} className="w-full rounded-md bg-[#18132a] border border-[#c7d2fe] p-3 text-white">
                  <option value="">Selecciona tu ciclo</option>
                  {cycles.map(c => <option key={String(c)} value={String(c)}>{String(c)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-white/80 mb-2">Especialización (opcional)</label>
                <input value={formData.specialization || ""} onChange={e => updateFormData({ specialization: e.target.value })} className="w-full rounded-md bg-[#18132a] border border-[#7c3aed] p-3 text-white" placeholder="IA, Cloud, ..." />
              </div>
            </div>
          )}
          {currentStep === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Intereses y Estilo de Aprendizaje</h2>
              <div className="mb-6">
                <label className="block text-white/80 mb-2">Intereses profesionales</label>
                <input value={formData.careerInterests?.join(", ") || ""} onChange={e => updateFormData({ careerInterests: e.target.value.split(",") })} className="w-full rounded-md bg-[#18132a] border border-[#7c3aed] p-3 text-white" placeholder="Ej: IA, Cloud, Web" />
              </div>
              <div className="mb-6">
                <label className="block text-white/80 mb-2">Estilo de aprendizaje</label>
                <input value={formData.learningStyle || ""} onChange={e => updateFormData({ learningStyle: e.target.value })} className="w-full rounded-md bg-[#18132a] border border-[#a21caf] p-3 text-white" placeholder="Visual, Auditivo, Kinestésico..." />
              </div>
              <div>
                <label className="block text-white/80 mb-2">Factores de motivación</label>
                <input value={formData.motivationFactors?.join(", ") || ""} onChange={e => updateFormData({ motivationFactors: e.target.value.split(",") })} className="w-full rounded-md bg-[#18132a] border border-[#c7d2fe] p-3 text-white" placeholder="Ej: Logros, Comunidad..." />
              </div>
            </div>
          )}
          {currentStep === 4 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Disponibilidad y Horarios</h2>
              <div className="mb-6">
                <label className="block text-white/80 mb-2">Horas de estudio por día</label>
                <input type="number" value={formData.studyHoursPerDay || ""} onChange={e => updateFormData({ studyHoursPerDay: Number(e.target.value) })} className="w-full rounded-md bg-[#18132a] border border-[#7c3aed] p-3 text-white" placeholder="Ej: 2" />
              </div>
              <div className="mb-6">
                <label className="block text-white/80 mb-2">Horas de trabajo por semana</label>
                <input type="number" value={formData.workHoursPerWeek || ""} onChange={e => updateFormData({ workHoursPerWeek: Number(e.target.value) })} className="w-full rounded-md bg-[#18132a] border border-[#a21caf] p-3 text-white" placeholder="Ej: 10" />
              </div>
              <div className="mb-6">
                <label className="block text-white/80 mb-2">Horas extracurriculares por semana</label>
                <input type="number" value={formData.extracurricularHoursPerWeek || ""} onChange={e => updateFormData({ extracurricularHoursPerWeek: Number(e.target.value) })} className="w-full rounded-md bg-[#18132a] border border-[#c7d2fe] p-3 text-white" placeholder="Ej: 5" />
              </div>
              <div>
                <label className="block text-white/80 mb-2">Disponibilidad semanal (JSON)</label>
                <input value={formData.weeklyAvailabilityJson || ""} onChange={e => updateFormData({ weeklyAvailabilityJson: e.target.value })} className="w-full rounded-md bg-[#18132a] border border-[#7c3aed] p-3 text-white" placeholder="{...}" />
              </div>
            </div>
          )}
          {currentStep === 5 && (
  <div>
    <h2 className="text-2xl font-bold text-white mb-6">Cursos</h2>
    <CoursesStep
      token={idToken}
      termId={formData.termId}
      programId={formData.program}
      courses={formData.courses}
      onUpdate={(data) => updateFormData(data)}
    />
  </div>
          )}
          {currentStep === 6 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Confirmación</h2>
              <div className="mb-6">
                <p className="text-white/80">Revisa tus datos antes de continuar:</p>
                <pre className="bg-[#18132a] border border-[#7c3aed] rounded-md p-4 text-white text-sm mt-4">{JSON.stringify(formData, null, 2)}</pre>
              </div>
            </div>
          )}
          {error && (
            <div className="mt-6 p-4 bg-red-500/20 border border-red-500/40 rounded-xl flex items-start gap-3">
              <span className="text-xl">⚠️</span>
              <div className="text-left">
                <p className="text-sm text-red-100">{error}</p>
                <button onClick={clearError} className="text-xs text-red-300 hover:text-red-200 mt-1 underline">Cerrar</button>
              </div>
            </div>
          )}
          <div className="flex gap-3 justify-center pt-8">
            {currentStep > 1 && (
              <Button variant="outline" size="md" onClick={prevStep} disabled={isSubmitting} className="bg-[#18132a] border border-[#7c3aed] text-white">← Atrás</Button>
            )}
            <Button variant="primary" size="lg" onClick={handleNext} disabled={isSubmitting || loading} className="flex-1 bg-[#7c3aed] hover:bg-[#a21caf] text-white font-bold">
              {isSubmitting ? (
                <span className="animate-spin mr-2">⏳</span>
              ) : currentStep === 6 ? (
                "Completar ✨"
              ) : (
                "Siguiente →"
              )}
            </Button>
          </div>
        </motion.div>
        <div className="mt-8 text-center text-[#c7d2fe] text-sm">
          <p>Paso {currentStep} de 6</p>
        </div>
      </motion.div>
    </div>
  );
}



