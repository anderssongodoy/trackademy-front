"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { motion } from "framer-motion";
import { FaCheckCircle } from "react-icons/fa";
import { useOnboarding } from "@/hooks/useOnboarding";
import CoursesStep from "@/components/onboarding/CoursesStep";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { onboardingService } from "@/services/onboardingService";
import { Term } from "@/types/onboarding";

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const idToken = (session as unknown as { idToken?: string } | null)?.idToken ?? "";
  const [terms, setTerms] = useState<Term[]>([]);
  const [confirmCatalog, setConfirmCatalog] = useState<Array<{ id: number; codigo: string; nombre: string }>>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!idToken) return;
      try {
        const t = await onboardingService.fetchTerms(idToken);
        if (!mounted) return;
        setTerms(t);
      } catch {
        if (!mounted) return;
        setTerms([]);
      }
    })();
    return () => { mounted = false; };
  }, [idToken]);

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

  // Cargar catálogo del programa para mostrar nombres de cursos en Confirmación
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const pid = Number(formData.program);
        if (!Number.isNaN(pid) && pid > 0) {
          const list = await onboardingService.fetchCursosPorCarrera(pid, idToken);
          if (!mounted) return;
          setConfirmCatalog(list);
        } else {
          if (!mounted) return;
          setConfirmCatalog([]);
        }
      } catch {
        if (!mounted) return;
        setConfirmCatalog([]);
      }
    })();
    return () => { mounted = false; };
  }, [idToken, formData.program]);

  const handleNext = async () => {
    if (currentStep === 3) {
      const okCourses = await submitCourses();
      if (!okCourses) return;
      const success = await submitOnboarding();
      if (success) {
        try {
          if (formData.wantsAlerts) {
            // Ya no creamos eventos automáticamente. Se hará desde Home con semanas reales de PA.
            try { localStorage.setItem("trackademy_calendar_sync", "1"); } catch {}
          }
        } catch {}
        router.push("/home");
      }
    } else {
      await savePartial();
      nextStep();
    }
  };

  return (
    <div className="min-h-screen bg-[#18132a] flex flex-col items-center justify-center px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="w-full max-w-3xl mx-auto text-center">
        <div className="mb-10">
          <div className="flex items-center justify-center mb-6">
            <FaCheckCircle className="text-[#7c3aed] text-3xl mr-2" />
            <h1 className="text-3xl sm:text-4xl font-black text-white">Onboarding</h1>
          </div>
          <motion.div initial={{ width: 0 }} animate={{ width: `${(currentStep / 3) * 100}%` }} className="h-2 rounded-full bg-[#7c3aed] mb-8" />
        </div>
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }} className="bg-[#23203b] border border-[#7c3aed] rounded-3xl p-8 sm:p-12 text-left min-h-96 flex flex-col justify-between shadow-lg">
          {currentStep === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Datos Academicos</h2>
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
                <select
                  value={formData.cycle || ""}
                  onChange={e => updateFormData({ cycle: Number(e.target.value) })}
                  className="w-full rounded-md bg-[#18132a] border border-[#c7d2fe] p-3 text-white"
                >
                  <option value="">Selecciona tu ciclo</option>
                  {(cycles as unknown as Array<number | { id: number; label?: string } | string>).map((c) => { const value = typeof c === 'number' ? c : (typeof c === 'string' ? c : (c?.id ?? '')); const label = typeof c === 'number' ? String(c) : (typeof c === 'string' ? c : (c?.label ?? String(c?.id ?? ''))); return (<option key={String(value)} value={String(value)}>{label}</option>); })}
                </select>
              </div>
              <div className="mb-6">
                <label className="block text-white/80 mb-2">Periodo</label>
                <select
                  value={formData.termId ? String(formData.termId) : ""}
                  onChange={e => {
                    const val = e.target.value;
                    const id = val ? Number(val) : undefined;
                    updateFormData({ termId: id });
                  }}
                  className="w-full rounded-md bg-[#18132a] border border-[#c7d2fe] p-3 text-white"
                >
                  <option value="">Selecciona el periodo</option>
                  {terms.map(t => (
                    <option key={t.id} value={String(t.id)}>{t.name || t.code || String(t.id)}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
          {currentStep === 2 && (
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
          {currentStep === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Confirmación</h2>
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white/5 border border-white/15 rounded-xl p-4">
                    <div className="text-white/60 text-sm mb-1">Campus</div>
                    <div className="text-white font-semibold">{campuses.find(c => String(c.id) === String(formData.campus))?.name || "—"}</div>
                  </div>
                  <div className="bg-white/5 border border-white/15 rounded-xl p-4">
                    <div className="text-white/60 text-sm mb-1">Programa</div>
                    <div className="text-white font-semibold">{programs.find(p => String(p.id) === String(formData.program))?.name || "—"}</div>
                  </div>
                  <div className="bg-white/5 border border-white/15 rounded-xl p-4">
                    <div className="text-white/60 text-sm mb-1">Periodo</div>
                    <div className="text-white font-semibold">{terms.find(t => Number(t.id) === Number(formData.termId))?.name || "—"}</div>
                  </div>
                  <div className="bg-white/5 border border-white/15 rounded-xl p-4">
                    <div className="text-white/60 text-sm mb-1">Ciclo</div>
                    <div className="text-white font-semibold">{formData.cycle || "—"}</div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-semibold">Cursos seleccionados</h3>
                    <span className="text-white/60 text-sm">{formData.courses?.length || 0}</span>
                  </div>
                  {(!formData.courses || formData.courses.length === 0) ? (
                    <div className="text-white/60">No seleccionaste cursos.</div>
                  ) : (
                    <div className="max-h-72 overflow-auto rounded-xl border border-white/15 bg-white/5">
                      <ul className="divide-y divide-white/10">
                        {formData.courses.map((c, i) => {
                          const course = typeof c.courseId === 'number'
                            ? confirmCatalog.find(x => x.id === c.courseId)
                            : confirmCatalog.find(x => x.codigo === c.courseCode);
                          const name = course?.nombre || String(c.courseCode || c.courseId);
                          const code = course?.codigo || c.courseCode || '';
                          return (
                            <li key={i} className="flex items-center justify-between p-3">
                              <div className="min-w-0">
                                <div className="text-white font-medium truncate max-w-[520px]">{name}</div>
                                <div className="text-white/60 text-[10px] tracking-wider uppercase">{code}</div>
                              </div>
                              <div className="text-white/60 text-sm">#{i + 1}</div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {error && (
            <div className="mt-6 p-4 bg-red-500/20 border border-red-500/40 rounded-xl flex items-start gap-3">
              <span className="text-xl">!</span>
              <div className="text-left">
                <p className="text-sm text-red-100">{error}</p>
                <button onClick={clearError} className="text-xs text-red-300 hover:text-red-200 mt-1 underline">Cerrar</button>
              </div>
            </div>
          )}
          <div className="flex gap-3 justify-center pt-8">
            {currentStep > 1 && (
              <Button variant="outline" size="md" onClick={prevStep} disabled={isSubmitting} className="bg-[#18132a] border border-[#7c3aed] text-white">Atras</Button>
            )}
            <Button variant="primary" size="lg" onClick={handleNext} disabled={isSubmitting || loading} className="flex-1 bg-[#7c3aed] hover:bg-[#a21caf] text-white font-bold">
              {isSubmitting ? (
                <span className="animate-spin mr-2">○</span>
              ) : currentStep === 3 ? (
                "Completar"
              ) : (
                "Siguiente"
              )}
            </Button>
          </div>
        </motion.div>
        <div className="mt-8 text-center text-[#c7d2fe] text-sm">
          <p>Paso {currentStep} de 3</p>
        </div>
      </motion.div>
    </div>
  );
}
