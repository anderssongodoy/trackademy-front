import { useState, useCallback, useEffect } from "react";
import { OnboardingFormData, Campus, Cycle, Program, ApiError } from "@/types/onboarding";
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

const TOTAL_STEPS = 3;

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
        const [campusesRes, programsRes] = await Promise.all([
          onboardingService.fetchCampuses(token),
          onboardingService.fetchPrograms(token),
        ]);
        setCampuses(campusesRes);
        setPrograms(programsRes);

        // Optional: load terms for future usage (non-blocking)
        await onboardingService.fetchTerms(token).catch(() => []);

        // Default cycles 1..10
        const defaultCycles = Array.from({ length: 10 }, (_, i) => (i + 1)) as unknown as Cycle[];
        setCycles(defaultCycles);
      } catch (err) {
        console.error("Error loading onboarding data:", err);
        setError("No se pudieron cargar los datos. Usa los campos manuales.");
        const defaultCycles = Array.from({ length: 10 }, (_, i) => (i + 1)) as unknown as Cycle[];
        setCycles(defaultCycles);
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
      case 1: // Datos académicos
        if (!formData.campus) {
          setError("Por favor selecciona un campus");
          return false;
        }
        if (!formData.program) {
          setError("Por favor selecciona un programa");
          return false;
        }
        if (!formData.termId) {
          setError("Por favor selecciona un periodo");
          return false;
        }
        break;
      default:
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
      if (response.success) return true;
      setError(response.message || "Error al guardar datos");
      return false;
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
    // En la API actual, los cursos se envÃ­an con submitOnboarding
    return true;
  }, []);

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
      // no-op
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


