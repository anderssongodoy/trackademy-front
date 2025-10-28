const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

export type LoginStatus = {
  needsOnboarding: boolean;
  missing: string[];
  usuarioId: number;
  subject: string;
  email: string;
  campusId: number | null;
  periodoId: number | null;
  carreraId: number | null;
  cursosCount: number;
};

export async function getLoginStatus(token?: string): Promise<LoginStatus | null> {
  try {
    const res = await fetch(`${API_BASE}/me/status`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as LoginStatus;
  } catch {
    return null;
  }
}

