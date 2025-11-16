export type DayCell = { date: Date; inMonth: boolean };

export type ScheduleEvent = {
  curso: string;
  cursoId: number;
  usuarioCursoId: number;
  horaInicio: string; // HH:mm
  duracionMin: number; // 45, 90, 135, 180
};

