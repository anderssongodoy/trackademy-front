import { useState, useCallback, useEffect } from "react";
import { OnboardingFormData, Campus, Cycle, Program, ApiError, Enrollment } from "@/types/onboarding";
import { onboardingService } from "@/services/onboardingService";

interface UseOnboardingReturn {
  currentStep: number;
  formData: OnboardingFormData;
  campuses: Campus[];
  cycles: Cycle[];
  programs: Program[];
  loading: boolean;
  error: string | null;
  isSubmitting: boolean;
  setCurrentStep: (step: number) => void;
  updateFormData: (data: Partial<OnboardingFormData>) => void;
  nextStep: () => void;
  prevStep: () => void;
  submitOnboarding: () => Promise<boolean>;
  submitCourses: () => Promise<boolean>;
  savePartial: () => Promise<void>;
  clearError: () => void;
}

const TOTAL_STEPS = 6;

const DEFAULT_FORM_DATA: OnboardingFormData = {
  campus: "",
  cycle: 0,
  program: "",
  specialization: "",
  careerInterests: [],
  studyHoursPerDay: 3,
  learningStyle: "visual",
  motivationFactors: [],
  wantsAlerts: true,
  wantsIncentives: true,
  allowDataSharing: false,
  preferredStudyTimes: [],
  workHoursPerWeek: 0,
  extracurricularHoursPerWeek: 0,
  weeklyAvailabilityJson: "{}",
  termId: undefined,
  courses: [],
};

export function useOnboarding(token: string): UseOnboardingReturn {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<OnboardingFormData>(DEFAULT_FORM_DATA);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(!token);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const [me, campusesRes, cyclesRes, programsRes] = await Promise.all([
          onboardingService.getOnboardingMe(token),
          onboardingService.fetchCampuses(token),
          onboardingService.fetchCycles(token),
          onboardingService.fetchPrograms(token),
        ]);
        if (me) {
          setFormData((prev) => ({ ...prev, ...me }));
        }
        setCampuses(campusesRes);
        setCycles(cyclesRes);
        setPrograms(programsRes);

        try {
          const enrollments: Enrollment[] = await onboardingService.fetchMyEnrollments(token);
          if (enrollments && enrollments.length > 0) {
            const latest = enrollments[0];
            setFormData((prev) => ({
              ...prev,
              cycle: prev.cycle && prev.cycle > 0 ? prev.cycle : (latest.currentCycle || 0),
            }));
          }
        } catch {}
      } catch (err) {
        console.error("Error loading onboarding data:", err);
        setError("No se pudieron cargar los datos. Usando valores por defecto.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [token]);

  const updateFormData = useCallback((data: Partial<OnboardingFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setError(null);
  }, []);

  const validateStep = useCallback((): boolean => {
    switch (currentStep) {
      case 1:
        // Permisos: sin validaciones estrictas
        break;
      case 2:
        if (!formData.campus) {
          setError("Por favor selecciona un campus");
          return false;
        }
        if (!formData.program) {
          setError("Por favor selecciona un programa");
          return false;
        }
        if (!formData.cycle) {
          setError("Por favor selecciona un ciclo académico");
          return false;
        }
        break;
      case 3:
        if (formData.careerInterests.length === 0) {
          setError("Por favor selecciona al menos un interés profesional");
          return false;
        }
        if (!formData.learningStyle) {
          setError("Por favor selecciona tu estilo de aprendizaje");
          return false;
        }
        if (formData.motivationFactors.length === 0) {
          setError("Por favor selecciona al menos un factor de motivación");
          return false;
        }
        break;
      case 4:
        if (formData.studyHoursPerDay < 0 || formData.studyHoursPerDay > 12) {
          setError("Horas de estudio por día debe estar entre 0 y 12");
          return false;
        }
        break;
      case 5:
        // Cursos actuales (opcionalmente al menos uno)
        if (formData.courses && formData.courses.length === 0) {
        }
        break;
      case 6:
        // Confirmación
        break;
    }
    return true;
  }, [currentStep, formData]);

  const nextStep = useCallback(() => {
    if (validateStep() && currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
      setError(null);
    }
  }, [currentStep, validateStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError(null);
    }
  }, [currentStep]);

  const submitOnboarding = useCallback(async (): Promise<boolean> => {
    if (!validateStep()) return false;

    setIsSubmitting(true);
    try {
      const response = await onboardingService.submitOnboarding(formData, token);
      if (response.success) {
        return true;
      } else {
        setError(response.message || "Error al guardar datos");
        return false;
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "Error desconocido al enviar datos");
      console.error("Error submitting onboarding:", err);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateStep, token]);

  const submitCourses = useCallback(async (): Promise<boolean> => {
    try {
      // Prefer explicit termCode from the form, else try to resolve termId
  let term: { id?: number; code?: string; name?: string } | null = null;
      const suppliedCode = formData.termCode;
      if (suppliedCode) {
        term = await onboardingService.getTermByCode(String(suppliedCode), token);
      } else if (formData.termId) {
        term = await onboardingService.getTermById(Number(formData.termId), token);
      }

      if (!term) {
        setError("Término inválido o no encontrado. Por favor selecciona un término válido.");
        return false;
      }

      // Normalize campus/program to numbers if possible
      const campusIdNum = formData.campus ? Number(formData.campus) : undefined;
      const programIdNum = formData.program ? Number(formData.program) : undefined;

      const payload = {
        termCode: term.code || String(term.id),
        campusId: campusIdNum ? String(campusIdNum) : undefined,
        programId: programIdNum ? String(programIdNum) : undefined,
        courses: (formData.courses || []).map((c) => (c.courseId ? { courseId: c.courseId } : { courseCode: c.courseCode })),
      };

      const ok = await onboardingService.submitCourses(payload, token);
      if (!ok) {
        setError("No se pudieron registrar los cursos");
      }
      return ok;
    } catch (err) {
      console.error("submitCourses error:", err);
      setError("Error desconocido al registrar cursos");
      return false;
    }
  }, [formData.courses, formData.termId, formData.campus, formData.program, formData.termCode, token]);

  const savePartial = useCallback(async () => {
    try {
      await onboardingService.patchOnboarding(
        {
          campus: formData.campus,
          program: formData.program,
          cycle: formData.cycle,
          specialization: formData.specialization,
          careerInterests: formData.careerInterests,
          learningStyle: formData.learningStyle,
          motivationFactors: formData.motivationFactors,
          studyHoursPerDay: formData.studyHoursPerDay,
          preferredStudyTimes: formData.preferredStudyTimes,
          workHoursPerWeek: formData.workHoursPerWeek,
          extracurricularHoursPerWeek: formData.extracurricularHoursPerWeek,
          weeklyAvailabilityJson: formData.weeklyAvailabilityJson,
          wantsAlerts: formData.wantsAlerts,
          wantsIncentives: formData.wantsIncentives,
          allowDataSharing: formData.allowDataSharing,
        },
        token
      );
    } finally {
    }
  }, [formData, token]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    currentStep,
    formData,
    campuses,
    cycles,
    programs,
    loading,
    error,
    isSubmitting,
    setCurrentStep,
    updateFormData,
    nextStep,
    prevStep,
    submitOnboarding,
    submitCourses,
    savePartial,
    clearError,
  };
}
