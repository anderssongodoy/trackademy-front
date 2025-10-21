export interface OnboardingFormData {
  campus: string;
  cycle: number;
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
  icon?: string;
}

export interface Cycle {
  id: number;
  label: string;
  description?: string;
}

export interface OnboardingResponse {
  success: boolean;
  message: string;
  enrollmentId?: string;
}

export interface ApiError {
  status: number;
  message: string;
  code?: string;
}
