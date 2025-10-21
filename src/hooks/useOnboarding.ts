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
  clearError: () => void;
}

const TOTAL_STEPS = 7;

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
        const [campusesRes, cyclesRes, programsRes] = await Promise.all([
          onboardingService.fetchCampuses(token),
          onboardingService.fetchCycles(token),
          onboardingService.fetchPrograms(token),
        ]);
        setCampuses(campusesRes);
        setCycles(cyclesRes);
        setPrograms(programsRes);
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
        if (!formData.campus) {
          setError("Por favor selecciona un campus");
          return false;
        }
        break;
      case 2:
        if (!formData.cycle) {
          setError("Por favor selecciona un ciclo académico");
          return false;
        }
        break;
      case 3:
        if (!formData.program) {
          setError("Por favor selecciona un programa");
          return false;
        }
        break;
      case 4:
        if (formData.careerInterests.length === 0) {
          setError("Por favor selecciona al menos un interés profesional");
          return false;
        }
        break;
      case 5:
        if (!formData.learningStyle) {
          setError("Por favor selecciona tu estilo de aprendizaje");
          return false;
        }
        break;
      case 6:
        if (formData.motivationFactors.length === 0) {
          setError("Por favor selecciona al menos un factor de motivación");
          return false;
        }
        break;
      case 7:
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
    clearError,
  };
}
