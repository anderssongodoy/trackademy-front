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
  // New fields per ONBOARDING_FRONT_SPEC.md
  preferredStudyTimes?: string[]; // ["morning","afternoon","evening","weekend"]
  workHoursPerWeek?: number; // 0..80
  extracurricularHoursPerWeek?: number; // 0..80
  weeklyAvailabilityJson?: string; // JSON string with time blocks
  termId?: number;
  termCode?: string;
  courses?: Array<{
    courseId?: number;
    courseCode?: string;
  }>;
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

export interface Enrollment {
  id: string;
  userId: string;
  termId?: string;
  campusId?: string;
  programId?: string;
  studentCode?: string;
  currentCycle?: number;
  status?: string;
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

export interface CurrentCoursesPayload {
  termId?: number;
  termCode?: string;
  courses: Array<{
    courseId?: number;
    courseCode?: string;
  }>;
  campusId?: string;
  programId?: string;
}

export interface CourseItem {
  id: number;
  code: string;
  name: string;
  credits?: number;
  weeklyHours?: number;
  modality?: string;
}

// Academic term used to select the current period without asking for raw IDs
export interface Term {
  id: number; // backend identifier
  code?: string; // human-readable code, e.g. "2025-1"
  name: string; // display label, e.g. "2025 - Semestre I"
  active?: boolean;
}
