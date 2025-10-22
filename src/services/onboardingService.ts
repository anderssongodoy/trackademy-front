import { OnboardingFormData, OnboardingResponse, ApiError, Campus, Cycle, Program, Enrollment, CurrentCoursesPayload } from "@/types/onboarding";
import { CourseItem, Term } from "@/types/onboarding";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

class OnboardingService {
  async submitOnboarding(data: OnboardingFormData, token?: string): Promise<OnboardingResponse> {
    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const payload = {
        campus: data.campus,
        cycle: data.cycle,
        program: data.program,
        specialization: data.specialization,
        careerInterests: data.careerInterests,
        studyHoursPerDay: data.studyHoursPerDay,
        learningStyle: data.learningStyle,
        motivationFactors: data.motivationFactors,
        wantsAlerts: data.wantsAlerts,
        wantsIncentives: data.wantsIncentives,
        allowDataSharing: data.allowDataSharing,
        preferredStudyTimes: data.preferredStudyTimes,
        workHoursPerWeek: data.workHoursPerWeek,
        extracurricularHoursPerWeek: data.extracurricularHoursPerWeek,
        weeklyAvailabilityJson: data.weeklyAvailabilityJson,
      };

      const response = await fetch(`${API_BASE}/onboarding/submit`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
          message: errorData.message || "Error al enviar datos de onboarding",
        } as ApiError;
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw {
          message: error.message,
        } as ApiError;
      }
      throw error;
    }
  }

  async getOnboardingMe(token?: string): Promise<Partial<OnboardingFormData> | null> {
    try {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      const response = await fetch(`${API_BASE}/onboarding/me`, { method: "GET", headers });
      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  }

  async patchOnboarding(data: Partial<OnboardingFormData>, token?: string): Promise<boolean> {
    try {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      const response = await fetch(`${API_BASE}/onboarding/me`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(data),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  

  async fetchCampuses(token?: string): Promise<Campus[]> {
    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (token) headers.Authorization = `Bearer ${token}`;
      const response = await fetch(`${API_BASE}/campuses`, {
        method: "GET",
        headers,
      });
      if (!response.ok) throw new Error("Error al obtener campuses");
      return await response.json();
    } catch (error) {
      return [];
    }
  }

  async fetchCycles(token?: string): Promise<Cycle[]> {
    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (token) headers.Authorization = `Bearer ${token}`;
      const response = await fetch(`${API_BASE}/cycles`, {
        method: "GET",
        headers,
      });
      if (!response.ok) throw new Error("Error al obtener ciclos");
      return await response.json();
    } catch (error) {
      return [];
    }
  }

  async fetchPrograms(token?: string): Promise<Program[]> {
    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (token) headers.Authorization = `Bearer ${token}`;
      const response = await fetch(`${API_BASE}/programs`, {
        method: "GET",
        headers,
      });
      if (!response.ok) throw new Error("Error al obtener programas");
      return await response.json();
    } catch (error) {
      return [];
    }
  }

  async fetchTerms(token?: string): Promise<Term[]> {
    try {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`${API_BASE}/terms`, { headers });
      if (!res.ok) throw new Error("Error al obtener términos");
      const data: unknown = await res.json();
      const arr = Array.isArray(data) ? data : [];
      return arr.map((raw) => {
        const t = raw as Record<string, unknown>;
        const id = Number((t.id as number | string | undefined) ?? (t.termId as number | string | undefined) ?? 0);
        const code = String((t.code as string | undefined) ?? (t.termCode as string | undefined) ?? (t.name as string | undefined) ?? "");
        const name = String((t.name as string | undefined) ?? (t.label as string | undefined) ?? (t.code as string | undefined) ?? `Término ${t.id as string | number}`);
        const active = Boolean((t.active as boolean | undefined) ?? (t.current as boolean | undefined) ?? false);
        return { id, code, name, active };
      });
    } catch {
      return [];
    }
  }

  async getTermByCode(code: string, token?: string): Promise<Term | null> {
    try {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`${API_BASE}/terms/by-code/${encodeURIComponent(code)}`, { headers });
      if (!res.ok) return null;
      const t = await res.json();
      return {
        id: Number(t.id ?? t.termId ?? 0),
        code: String(t.code ?? t.termCode ?? t.name ?? code),
        name: String(t.name ?? t.label ?? t.code ?? code),
        active: Boolean(t.active ?? t.current ?? false),
      } as Term;
    } catch {
      return null;
    }
  }

  async getOnboardingStatus(token?: string): Promise<boolean | null> {
    try {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`${API_BASE}/onboarding/status`, { headers });
      if (!res.ok) return null;
      const data = await res.json();
      if (!data) return null;
      // expect { onboarded: boolean }
      if (typeof (data as any).onboarded === "boolean") return (data as any).onboarded;
      return null;
    } catch {
      return null;
    }
  }

  async getTermById(id: number, token?: string): Promise<Term | null> {
    try {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`${API_BASE}/terms/${encodeURIComponent(String(id))}`, { headers });
      if (!res.ok) return null;
      const t = await res.json();
      return {
        id: Number(t.id ?? t.termId ?? id),
        code: String(t.code ?? t.termCode ?? t.name ?? String(id)),
        name: String(t.name ?? t.label ?? t.code ?? String(id)),
        active: Boolean(t.active ?? t.current ?? false),
      } as Term;
    } catch {
      return null;
    }
  }

  async fetchMyEnrollments(token: string): Promise<Enrollment[]> {
    const headers: HeadersInit = { "Content-Type": "application/json" };
    headers.Authorization = `Bearer ${token}`;
    const response = await fetch(`${API_BASE}/enrollments/me`, { headers });
    if (!response.ok) throw new Error("Error al obtener matrículas");
    return await response.json();
  }

  // GET /api/courses returns all courses. Keep q optional for client-side filtering.
  async fetchCourses(q?: string, token?: string): Promise<CourseItem[]> {
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    const url = `${API_BASE}/courses${q ? `?q=${encodeURIComponent(q)}` : ""}`;
    const res = await fetch(url, { headers });
    if (!res.ok) return [];
    return await res.json();
  }

  async submitCourses(payload: CurrentCoursesPayload, token?: string): Promise<boolean> {
    try {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      const response = await fetch(`${API_BASE}/onboarding/courses`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const onboardingService = new OnboardingService();
