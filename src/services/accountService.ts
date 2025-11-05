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

import { beginLoading, endLoading } from "@/lib/loadingBus";

export async function getLoginStatus(token?: string, userImage?: string): Promise<LoginStatus | null> {
  try {
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (token) (headers as any).Authorization = `Bearer ${token}`;
    if (userImage) {
      (headers as Record<string, string>)["X-User-Image"] = userImage;
    }
    beginLoading();
    const res = await fetch(`${API_BASE}/me/status`, {
      headers,
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as LoginStatus;
  } catch {
    return null;
  } finally {
    endLoading();
  }
}


