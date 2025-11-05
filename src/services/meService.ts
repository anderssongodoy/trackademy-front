const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

export type UsuarioEvaluacionDto = {
  id: number;
  codigo: string | null;
  descripcion: string | null;
  semana: number | null;
  porcentaje: number;
  fechaEstimada?: string | null;
  nota?: string | null;
};

export type UsuarioCursoResumenDto = {
  usuarioCursoId: number;
  cursoId: number;
  cursoNombre: string;
  evaluaciones: UsuarioEvaluacionDto[];
};

export type DiaPreferenciaItem = { usuarioCursoId: number; diaSemana: number };
export type HorarioBloque = { usuarioCursoId: number; diaSemana: number; horaInicio: string; duracionMin: number };

import { beginLoading, endLoading } from "@/lib/loadingBus";

async function fetchJson<T>(path: string, token?: string): Promise<T | null> {
  try {
    beginLoading();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}${path}`, {
      headers,
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    endLoading();
  }
}

async function postJson(path: string, body: unknown, token?: string): Promise<boolean> {
  try {
    beginLoading();
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (token) (headers as Record<string, string>).Authorization = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    return res.status === 204 || res.ok;
  } catch {
    return false;
  } finally {
    endLoading();
  }
}

export const meService = {
  getCursos: (token?: string) => fetchJson<UsuarioCursoResumenDto[]>("/me/cursos", token),
  getEvaluaciones: (token?: string) => fetchJson<UsuarioEvaluacionDto[]>("/me/evaluaciones", token),
  getRecomendaciones: (token?: string) => fetchJson<string[]>("/me/recomendaciones", token),
  postNota: async (id: number, nota: string, token?: string): Promise<boolean> => {
    try {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) (headers as Record<string, string>).Authorization = `Bearer ${token}`;
      const res = await fetch(`${API_BASE}/me/evaluaciones/${encodeURIComponent(String(id))}/nota`, {
        method: "POST",
        headers,
        body: JSON.stringify({ nota }),
      });
      return res.status === 204 || res.ok;
    } catch {
      return false;
    }
  },
  setRecordatorios: async (anticipacionDias: number, token?: string): Promise<boolean> => {
    try {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) (headers as Record<string, string>).Authorization = `Bearer ${token}`;
      const res = await fetch(`${API_BASE}/me/preferencias/recordatorios`, {
        method: "POST",
        headers,
        body: JSON.stringify({ anticipacionDias }),
      });
      return res.status === 204 || res.ok;
    } catch {
      return false;
    }
  },
  getHorario: (token?: string, usuarioCursoId?: number) =>
    fetchJson<HorarioBloque[]>(`/me/horario${usuarioCursoId ? `?usuarioCursoId=${encodeURIComponent(String(usuarioCursoId))}` : ""}`, token),
  getHitosPreferencias: (token?: string) => fetchJson<DiaPreferenciaItem[]>(`/me/hitos/preferencias`, token),
  postHitosPreferencias: (items: DiaPreferenciaItem[], token?: string) => postJson(`/me/hitos/preferencias`, { items }, token),
  postHorario: (blocks: HorarioBloque[], token?: string) => postJson(`/me/horario`, blocks, token),
};

export default meService;
