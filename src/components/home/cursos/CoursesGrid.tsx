"use client";

import { type UsuarioCursoResumenDto } from "@/services/meService";
import CourseCard from "./CourseCard";

export default function CoursesGrid({ cursos, loading }: { cursos: UsuarioCursoResumenDto[]; loading?: boolean }) {
  if (loading) return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-20 rounded-xl bg-white/10 border border-white/20 animate-pulse" />
      ))}
    </div>
  );
  if (!cursos || cursos.length === 0) return (
    <div className="text-white/60">No hay cursos activos.</div>
  );
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {cursos.map((c) => (<CourseCard key={c.usuarioCursoId} curso={c} />))}
    </div>
  );
}
