export interface StudentMe {
  id: number; name: string; email: string; campusId?: string | number; programId?: string | number; currentTerm?: { code?: string };
  creditsRequired?: number | null; creditsApproved?: number | null; gpa?: number | null;
}

export interface AlertItem { id: string; type?: string; level?: 'low'|'medium'|'high'|'critical'; title?: string; message?: string; read?: boolean }

export interface CalendarEvent { id: string; title: string; start: string; end?: string; type?: string }

export interface Recommendation { type?: string; courseId?: number; code?: string; title?: string; reason?: string }

export type { AlertItem as AlertItemDTO };
