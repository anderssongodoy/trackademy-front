export interface OnboardingFormData {
  campus: string;
  cycle: number;
  program: string;
  specialization?: string;
  careerInterests: string[];
  studyHoursPerDay: number;
  learningStyle: string;
  motivationFactors: string[];
  wantsAlerts: boolean;
  wantsIncentives: boolean;
  allowDataSharing: boolean;
}

export interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon?: string;
}

export interface Campus {
  id: string;
  name: string;
  city?: string;
  icon?: string;
}

export interface Cycle {
  id: number;
  label: string;
  description?: string;
}

export interface Program {
  id: string;
  name: string;
  code?: string;
}

export interface OnboardingResponse {
  success: boolean;
  message: string;
  userId?: string;
  enrollmentId?: string;
}

export interface ApiError {
  message: string;
}
