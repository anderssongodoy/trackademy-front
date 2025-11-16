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
  preferredStudyTimes?: string[];
  workHoursPerWeek?: number;
  extracurricularHoursPerWeek?: number;
  weeklyAvailabilityJson?: string;
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

export interface Term {
  id: number;
  code?: string;
  name: string;
  active?: boolean;
}
