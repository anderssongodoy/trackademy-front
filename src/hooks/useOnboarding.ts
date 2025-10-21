import { useState, useCallback, useEffect } from "react";
import { OnboardingFormData, Campus, Cycle, ApiError } from "@/types/onboarding";
import { onboardingService } from "@/services/onboardingService";

interface UseOnboardingReturn {
  currentStep: number;
  formData: OnboardingFormData;
  campuses: Campus[];
  cycles: Cycle[];
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

const TOTAL_STEPS = 3;

const DEFAULT_FORM_DATA: OnboardingFormData = {
  campus: "",
  cycle: 0,
  wantsAlerts: true,
  wantsIncentives: true,
  allowDataSharing: false,
};

export function useOnboarding(
  campusesData?: Campus[],
  cyclesData?: Cycle[]
): UseOnboardingReturn {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<OnboardingFormData>(DEFAULT_FORM_DATA);
  const [campuses, setCampuses] = useState<Campus[]>(campusesData || []);
  const [cycles, setCycles] = useState<Cycle[]>(cyclesData || []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [campusesRes, cyclesRes] = await Promise.all([
          onboardingService.fetchCampuses(),
          onboardingService.fetchCycles(),
        ]);
        setCampuses(campusesRes);
        setCycles(cyclesRes);
      } catch (err) {
        console.error("Error loading onboarding data:", err);
        setError("No se pudieron cargar los datos. Usando valores por defecto.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

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
          setError("Por favor selecciona un ciclo");
          return false;
        }
        break;
      case 3:
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
      const response = await onboardingService.submitOnboarding(formData);
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
  }, [formData, validateStep]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    currentStep,
    formData,
    campuses,
    cycles,
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
