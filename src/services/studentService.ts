import { StudentMe, AlertItem, CalendarEvent, Recommendation } from "@/types/student";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

async function fetchWithAuth(path: string, token?: string) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: token ? `Bearer ${token}` : "" },
    cache: "no-store",
  });
  if (res.status === 401) throw new Error("unauthorized");
  return res.ok ? res.json() : Promise.resolve(null);
}

export const studentService = {
  getMe: (token?: string) => fetchWithAuth("/student/me", token) as Promise<StudentMe | null>,
  getAlerts: (token?: string) => fetchWithAuth("/student/alerts", token) as Promise<AlertItem[] | null>,
  getCalendar: (start?: string, end?: string, token?: string) => fetchWithAuth(`/student/calendar${start || end ? `?start=${encodeURIComponent(start||"")}&end=${encodeURIComponent(end||"")}` : ""}`, token) as Promise<CalendarEvent[] | null>,
  getRecommendations: (limit = 10, token?: string) => fetchWithAuth(`/student/recommendations?limit=${limit}`, token) as Promise<Recommendation[] | null>,
};

export default studentService;
