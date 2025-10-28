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
  cursoId: number;
  cursoNombre: string;
  evaluaciones: UsuarioEvaluacionDto[];
};

async function fetchJson<T>(path: string, token?: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export const meService = {
  getCursos: (token?: string) => fetchJson<UsuarioCursoResumenDto[]>("/me/cursos", token),
  getEvaluaciones: (token?: string) => fetchJson<UsuarioEvaluacionDto[]>("/me/evaluaciones", token),
  getRecomendaciones: (token?: string) => fetchJson<string[]>("/me/recomendaciones", token),
  postNota: async (id: number, nota: string, token?: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/me/evaluaciones/${encodeURIComponent(String(id))}/nota`, {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nota }),
      });
      return res.status === 204 || res.ok;
    } catch {
      return false;
    }
  },
  setRecordatorios: async (anticipacionDias: number, token?: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/me/preferencias/recordatorios`, {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ anticipacionDias }),
      });
      return res.status === 204 || res.ok;
    } catch {
      return false;
    }
  },
};

export default meService;
