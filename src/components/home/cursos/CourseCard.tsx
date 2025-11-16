"use client";

import Link from "next/link";
import { type UsuarioCursoResumenDto } from "@/services/meService";

function parseLocalDate(s?: string | null) {
  if (!s) return null;
  const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(s);
  if (!m) {
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const y = Number(m[1]);
  const mm = Number(m[2]);
  const dd = Number(m[3]);
  return new Date(y, (mm || 1) - 1, dd || 1);
}

function formatDate(dateStr?: string | null) {
  const d = parseLocalDate(dateStr);
  return d ? d.toLocaleDateString("es-PE", { year: "numeric", month: "short", day: "2-digit" }) : null;
}

export default function CourseCard({ curso }: { curso: UsuarioCursoResumenDto }) {
  const next = [...(curso.evaluaciones || [])]
    .filter((e) => parseLocalDate(e.fechaEstimada))
    .sort((a, b) => (parseLocalDate(a.fechaEstimada)!.getTime() - parseLocalDate(b.fechaEstimada)!.getTime()))[0];

  return (
    <div className="bg-white/10 border border-white/20 rounded-xl p-4">
      <Link href={`/home/cursos/${curso.cursoId}`} className="text-white font-semibold hover:underline">
        {curso.cursoNombre}
      </Link>
      <div className="text-white/70 text-sm mt-1">
        {next ? (
          <>
            Próxima: {next.codigo || next.descripcion || "Evaluación"} • {next.semana ? `Semana ${next.semana}` : (formatDate(next.fechaEstimada) || "Fecha por definir")}
          </>
        ) : (
          "Sin evaluaciones registradas"
        )}
      </div>
    </div>
  );
}

