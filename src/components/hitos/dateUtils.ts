export function pad2(n: number) { return n < 10 ? `0${n}` : String(n); }
export function sameDate(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
export function toKey(d: Date) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }

export const DOW_LABELS = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"] as const;
export const DOW_OPTIONS: ReadonlyArray<{ value: number; label: string }> = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 7, label: "Domingo" },
];

