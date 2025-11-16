"use client";

import { getGraphAccessToken } from "./msalClient";

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

// Mapeo mínimo de IANA -> Windows TZ que Graph acepta mejor en campos timeZone
function ianaToWindows(tz: string): string {
  const map: Record<string, string> = {
    "UTC": "UTC",
    "Etc/UTC": "UTC",
    "America/Lima": "SA Pacific Standard Time",
    "America/Bogota": "SA Pacific Standard Time",
  };
  return map[tz] || tz;
}

function formatLocalISO(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  // Importante: sin sufijo Z; Graph lo interpreta en la zona indicada en timeZone
  return `${y}-${m}-${d}T${hh}:${mm}:${ss}`;
}

function toIsoUtc(d: Date) {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), 0, 0)).toISOString();
}

function getMonday(d: Date) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = x.getDay();
  const diff = (day === 0 ? -6 : 1 - day); // Monday as start, if Sunday -> go back 6
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

export type PAWeekOptions = {
  subject?: string;
  startHour?: number; // 0-23 local time used only for label; we send UTC
  durationMinutes?: number; // default 15
  reminderMinutes?: number; // default 30
  timeZone?: string; // default "UTC"
};

export async function ensurePAForCurrentWeek(loginHint?: string, opts?: PAWeekOptions) {
  const monday = getMonday(new Date());
  await ensurePAForWeek(monday, loginHint, opts);
}

export async function ensurePAForWeek(weekStartMonday: Date, loginHint?: string, opts?: PAWeekOptions) {
  const token = await getGraphAccessToken(["Calendars.ReadWrite"], loginHint);
  if (!token) return false;

  const tzIana = (opts?.timeZone || (typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : undefined) || "UTC");
  const tz = ianaToWindows(tzIana);
  const subject = opts?.subject ?? "[Trackademy] Semana PA";
  const reminderMinutes = typeof opts?.reminderMinutes === "number" ? opts!.reminderMinutes! : 30;
  const duration = typeof opts?.durationMinutes === "number" ? opts!.durationMinutes! : 15;

  const start = new Date(weekStartMonday);
  const end = new Date(weekStartMonday);
  end.setDate(end.getDate() + 6); // full week window for search
  end.setHours(23, 59, 59, 0);

  // 1) Buscar si ya existe algo de Trackademy esta semana
  const searchUrl = `${GRAPH_BASE}/me/calendarView?startDateTime=${encodeURIComponent(toIsoUtc(start))}&endDateTime=${encodeURIComponent(toIsoUtc(end))}`;
  const found = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  }).then(r => r.ok ? r.json() : Promise.resolve({ value: [] as any[] }))
    .then((d: { value?: any[] }) => (d.value || []).filter(e => typeof e?.subject === "string" && e.subject.includes("[Trackademy]")));

  if (found.length >= 3) return true; // ya hay eventos de la semana

  // 2) Crear serie diaria (5 ocurrencias) ALL-DAY lun-vie dentro de esa semana
  const startDay = new Date(weekStartMonday);
  startDay.setHours(0, 0, 0, 0);
  const endDay = new Date(startDay);
  endDay.setDate(endDay.getDate() + 1); // fin exclusivo al día siguiente a las 00:00

  const payload = {
    subject,
    body: { contentType: "HTML", content: "Esta semana tienes PA. <br/>— Trackademy" },
    start: { dateTime: formatLocalISO(startDay), timeZone: tz },
    end: { dateTime: formatLocalISO(endDay), timeZone: tz },
    isAllDay: true,
    isReminderOn: true,
    reminderMinutesBeforeStart: reminderMinutes,
    location: { displayName: "Trackademy" },
    recurrence: {
      pattern: { type: "daily", interval: 1 },
      range: {
        type: "numbered",
        startDate: `${weekStartMonday.getFullYear()}-${String(weekStartMonday.getMonth() + 1).padStart(2, "0")}-${String(weekStartMonday.getDate()).padStart(2, "0")}`,
        numberOfOccurrences: 5,
      },
    },
  } as const;

  const res = await fetch(`${GRAPH_BASE}/me/events`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      // Nota: se puede usar Prefer: outlook.timezone para forzar TZ; aquí mandamos en el cuerpo timeZone
    },
    body: JSON.stringify(payload),
  });

  return res.ok;
}

export type EvaluationItem = {
  id: number;
  date: Date; // fecha del evento (local)
  title: string; // texto visible
  timeZone?: string; // IANA preferida
};

export async function ensureEvaluationEvent(item: EvaluationItem, loginHint?: string, reminderMinutes = 60) {
  const token = await getGraphAccessToken(["Calendars.ReadWrite"], loginHint);
  if (!token) return false;

  const tzIana = item.timeZone || (typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : undefined) || "UTC";
  const tz = ianaToWindows(tzIana);
  const start = new Date(item.date); start.setHours(0,0,0,0);
  const end = new Date(start); end.setDate(end.getDate() + 1);
  const tag = `[TA] Eval #${item.id}`;
  const subject = `${tag} ${item.title}`;

  // 1) buscar en el día si ya existe un evento con el tag
  const url = `${GRAPH_BASE}/me/calendarView?startDateTime=${encodeURIComponent(toIsoUtc(start))}&endDateTime=${encodeURIComponent(toIsoUtc(end))}`;
  const list = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" })
    .then(r => r.ok ? r.json() : Promise.resolve({ value: [] as any[] }))
    .then((d: { value?: any[] }) => (d.value || []));
  const exists = list.some(e => typeof e?.subject === "string" && String(e.subject).includes(tag));
  if (exists) return true;

  // 2) crear all-day
  const payload = {
    subject,
    body: { contentType: "HTML", content: `Evaluación programada: ${item.title}<br/>— Trackademy` },
    start: { dateTime: formatLocalISO(start), timeZone: tz },
    end: { dateTime: formatLocalISO(end), timeZone: tz },
    isAllDay: true,
    isReminderOn: true,
    reminderMinutesBeforeStart: reminderMinutes,
    location: { displayName: "Trackademy" },
  } as const;
  const res = await fetch(`${GRAPH_BASE}/me/events`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.ok;
}
