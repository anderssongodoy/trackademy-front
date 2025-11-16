import {
  OnboardingFormData,
  OnboardingResponse,
  ApiError,
  Campus,
  Program,
  Term,
} from "@/types/onboarding";
import { beginLoading, endLoading } from "@/lib/loadingBus";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;
const UNI_ID = Number(process.env.NEXT_PUBLIC_UNIVERSIDAD_ID || "1");

class OnboardingService {
  async submitOnboarding(
    data: OnboardingFormData,
    token?: string,
    userImage?: string,
  ): Promise<OnboardingResponse> {
    try {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      if (userImage) (headers as Record<string, string>)["X-User-Image"] = userImage;

      const periodoId = Number.isFinite(Number(data.termId)) && Number(data.termId) > 0 ? Number(data.termId) : undefined;

      let carreraId: number | undefined = undefined;
      if (data.program) {
        const asNum = Number(data.program);
        if (!Number.isNaN(asNum) && asNum > 0) {
          carreraId = asNum;
        } else {
          const carreras = await this.fetchCarreras(token).catch(() => [] as Array<{ id: number; nombre: string }>);
          const match = carreras.find((c) => c.nombre?.toLowerCase?.() === String(data.program).toLowerCase());
          if (match) carreraId = Number(match.id);
        }
      }

      let campusId: number | undefined = undefined;
      if (data.campus) {
        const asNum = Number(data.campus);
        if (!Number.isNaN(asNum) && asNum > 0) campusId = asNum;
      }

      let cursoIds: number[] = [];
      const inputCourses = data.courses || [];
      const explicitIds = inputCourses
        .filter((c) => typeof c.courseId === "number")
        .map((c) => Number(c.courseId));
      cursoIds.push(...explicitIds);
      const codes = inputCourses
        .map((c) => c.courseCode)
        .filter((v): v is string => !!v);
      if (codes.length && carreraId) {
        const catalog = await this.fetchCursosPorCarrera(carreraId, token).catch(
          () => [] as Array<{ id: number; codigo: string; nombre: string }>
        );
        const byCode = new Map(
          catalog.map((c) => [String(c.codigo).toLowerCase(), Number(c.id)])
        );
        for (const code of codes) {
          const id = byCode.get(String(code).toLowerCase());
          if (id) cursoIds.push(id);
        }
      }
      cursoIds = Array.from(new Set(cursoIds)).filter(
        (n) => typeof n === "number" && !Number.isNaN(n)
      );

      if (!campusId || !Number.isFinite(campusId) || campusId <= 0)
        throw { message: "Selecciona un campus valido" } as ApiError;
      if (!periodoId || !Number.isFinite(periodoId) || periodoId <= 0)
        throw { message: "Selecciona un periodo valido" } as ApiError;
      if (!carreraId || !Number.isFinite(carreraId) || carreraId <= 0)
        throw { message: "Selecciona una carrera valida" } as ApiError;
      if (!cursoIds.length)
        throw { message: "Debe seleccionar al menos un curso" } as ApiError;

      const payload = { campusId, periodoId, carreraId, cursoIds } as const;
      beginLoading();
      const res = await fetch(`${API_BASE}/onboarding`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw {
          message: errorData.message || "Error al enviar datos de onboarding",
        } as ApiError;
      }
      await res.json().catch(() => null);
      return { success: true, message: "ok" } as OnboardingResponse;
    } catch (error) {
      if (error instanceof Error) throw { message: error.message } as ApiError;
      throw error as ApiError;
    } finally {
      endLoading();
    }
  }

  async patchOnboarding(
    _data: Partial<OnboardingFormData>,
    _token?: string
  ): Promise<boolean> {
    void _data;
    void _token;
    return true;
  }

  async fetchCampuses(token?: string): Promise<Campus[]> {
    try {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      const url = `${API_BASE}/catalog/campus?universidadId=${encodeURIComponent(
        String(UNI_ID)
      )}`;
      beginLoading();
      const res = await fetch(url, { headers });
      if (!res.ok) return [];
      const data = (await res.json()) as Array<{
        id: number | string;
        nombre: string;
      }>;
      return data.map((c) => ({ id: String(c.id), name: c.nombre })) as Campus[];
    } catch {
      return [];
    } finally {
      endLoading();
    }
  }

  async fetchPrograms(token?: string): Promise<Program[]> {
    try {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      const url = `${API_BASE}/catalog/carreras?universidadId=${encodeURIComponent(
        String(UNI_ID)
      )}`;
      beginLoading();
      const res = await fetch(url, { headers });
      if (!res.ok) return [];
      const carreras = (await res.json()) as Array<{
        id: number;
        nombre: string;
        codigo?: string;
      }>;
      return carreras.map((c) => ({ id: String(c.id), name: c.nombre, code: c.codigo })) as Program[];
    } catch {
      return [];
    } finally {
      endLoading();
    }
  }

  async fetchCarreras(token?: string): Promise<Array<{ id: number; nombre: string }>> {
    try {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      const url = `${API_BASE}/catalog/carreras?universidadId=${encodeURIComponent(
        String(UNI_ID)
      )}`;
      beginLoading();
      const res = await fetch(url, { headers });
      if (!res.ok) return [];
      return (await res.json()) as Array<{ id: number; nombre: string }>;
    } catch {
      return [];
    } finally {
      endLoading();
    }
  }

  async fetchCursosPorCarrera(
    carreraId: number,
    token?: string
  ): Promise<Array<{ id: number; codigo: string; nombre: string }>> {
    try {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      const url = `${API_BASE}/catalog/cursos?carreraId=${encodeURIComponent(
        String(carreraId)
      )}`;
      const res = await fetch(url, { headers });
      if (!res.ok) return [];
      return (await res.json()) as Array<{
        id: number;
        codigo: string;
        nombre: string;
      }>;
    } catch {
      return [];
    }
  }

  async fetchCursoDetalle(
    id: number,
    token?: string
  ): Promise<{
    id: number;
    codigo: string;
    nombre: string;
    horasSemanales?: number | null;
    silaboDescripcion?: string | null;
    resultadosAprendizaje: Array<{
      id: number;
      texto: string;
      tipo?: string | null;
      unidadId?: number | null;
    }>;
    unidades: Array<{
      id?: number;
      numero: number;
      titulo?: string | null;
      temas: Array<{ id: number; titulo: string }>;
    }>;
    evaluaciones: Array<{
      id: number;
      codigo: string;
      descripcion: string | null;
      semana: number | null;
      porcentaje: number;
    }>;
    bibliografia: string[];
    competencias: string[];
    politicas: Array<{ seccion: string; texto: string }>;
  } | null> {
    try {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      beginLoading();
      const res = await fetch(
        `${API_BASE}/catalog/curso/${encodeURIComponent(String(id))}`,
        { headers }
      );
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    } finally {
      endLoading();
    }
  }

  async fetchTerms(token?: string): Promise<Term[]> {
    try {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      const url = `${API_BASE}/catalog/periodos?universidadId=${encodeURIComponent(
        String(UNI_ID)
      )}`;
      beginLoading();
      const res = await fetch(url, { headers });
      if (!res.ok) return [];
      const data = (await res.json()) as Array<{
        id: number | string;
        etiqueta?: string | null;
        fechaInicio?: string | null;
        fechaFin?: string | null;
      }>;
      const meses = [
        "Enero",
        "Febrero",
        "Marzo",
        "Abril",
        "Mayo",
        "Junio",
        "Julio",
        "Agosto",
        "Septiembre",
        "Octubre",
        "Noviembre",
        "Diciembre",
      ];
      return data.map((p) => {
        const etiqueta = p.etiqueta || String(p.id);
        let nombre = etiqueta;
        if (p.fechaInicio) {
          const d = new Date(p.fechaInicio);
          if (!isNaN(d.getTime())) nombre = `${etiqueta} ${meses[d.getMonth()]}`;
        }
        return { id: Number(p.id), code: etiqueta, name: nombre } as Term;
      });
    } catch {
      return [];
    } finally {
      endLoading();
    }
  }
}

export const onboardingService = new OnboardingService();
