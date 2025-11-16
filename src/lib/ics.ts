export function formatDateICS(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

export function formatStampUTC(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  const ss = String(d.getUTCSeconds()).padStart(2, "0");
  return `${y}${m}${day}T${hh}${mm}${ss}Z`;
}

export function generatePAICS(rangeStart: Date, rangeEnd: Date, subject = "[Trackademy] Semana PA", description = "Esta semana tienes PA.") {
  const lines: string[] = [];
  lines.push("BEGIN:VCALENDAR");
  lines.push("VERSION:2.0");
  lines.push("PRODID:-//Trackademy//PA//ES");
  lines.push("CALSCALE:GREGORIAN");
  lines.push("METHOD:PUBLISH");

  const stamp = formatStampUTC(new Date());
  const getMonday = (d: Date) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); const day = x.getDay(); const diff = (day === 0 ? -6 : 1 - day); x.setDate(x.getDate() + diff); x.setHours(0,0,0,0); return x; };
  const start = getMonday(new Date(rangeStart));
  const end = new Date(rangeEnd);
  end.setHours(23,59,59,0);

  const addEvent = (date: Date) => {
    const dtStart = formatDateICS(date);
    const next = new Date(date); next.setDate(next.getDate() + 1);
    const dtEnd = formatDateICS(next);
    const uid = `${dtStart}-${Math.random().toString(36).slice(2)}@trackademy`;
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${stamp}`);
    lines.push(`SUMMARY:${subject}`);
    lines.push(`DESCRIPTION:${description.replace(/\n/g, "\\n")}`);
    lines.push(`DTSTART;VALUE=DATE:${dtStart}`);
    lines.push(`DTEND;VALUE=DATE:${dtEnd}`);
    lines.push("END:VEVENT");
  };

  for (let d = new Date(start); d.getTime() <= end.getTime(); d.setDate(d.getDate() + 7)) {
    for (let i = 0; i < 5; i++) {
      const day = new Date(d); day.setDate(d.getDate() + i);
      addEvent(day);
    }
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export function downloadICS(content: string, filename = "trackademy-pa.ics") {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.style.display = "none";
  document.body.appendChild(a); a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 0);
}

export function generatePAICSForWeeks(weekMondays: Date[], subject = "[Trackademy] Semana PA", description = "Esta semana tienes PA.") {
  const lines: string[] = [];
  lines.push("BEGIN:VCALENDAR");
  lines.push("VERSION:2.0");
  lines.push("PRODID:-//Trackademy//PA//ES");
  lines.push("CALSCALE:GREGORIAN");
  lines.push("METHOD:PUBLISH");
  const stamp = formatStampUTC(new Date());

  const addEvent = (date: Date) => {
    const dtStart = formatDateICS(date);
    const next = new Date(date); next.setDate(next.getDate() + 1);
    const dtEnd = formatDateICS(next);
    const uid = `${dtStart}-${Math.random().toString(36).slice(2)}@trackademy`;
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${stamp}`);
    lines.push(`SUMMARY:${subject}`);
    lines.push(`DESCRIPTION:${description.replace(/\n/g, "\\n")}`);
    lines.push(`DTSTART;VALUE=DATE:${dtStart}`);
    lines.push(`DTEND;VALUE=DATE:${dtEnd}`);
    lines.push("END:VEVENT");
  };

  for (const monday of weekMondays) {
    for (let i = 0; i < 5; i++) {
      const day = new Date(monday); day.setDate(monday.getDate() + i);
      addEvent(day);
    }
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export type EvalIcsItem = { id: number; date: Date; title: string };
export function generateICSForEvaluations(items: EvalIcsItem[], defaultSubject = "[Trackademy] Evaluación", description = "Evaluación programada.") {
  const lines: string[] = [];
  lines.push("BEGIN:VCALENDAR");
  lines.push("VERSION:2.0");
  lines.push("PRODID:-//Trackademy//Evaluaciones//ES");
  lines.push("CALSCALE:GREGORIAN");
  lines.push("METHOD:PUBLISH");
  const stamp = formatStampUTC(new Date());

  for (const it of items) {
    const start = new Date(it.date); start.setHours(0,0,0,0);
    const next = new Date(start); next.setDate(next.getDate() + 1);
    const dtStart = formatDateICS(start);
    const dtEnd = formatDateICS(next);
    const uid = `${dtStart}-eval-${it.id}-${Math.random().toString(36).slice(2)}@trackademy`;
    const subj = `[TA] Eval #${it.id} ${it.title || defaultSubject}`;
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${stamp}`);
    lines.push(`SUMMARY:${subj}`);
    lines.push(`DESCRIPTION:${description.replace(/\n/g, "\\n")}`);
    lines.push(`DTSTART;VALUE=DATE:${dtStart}`);
    lines.push(`DTEND;VALUE=DATE:${dtEnd}`);
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
