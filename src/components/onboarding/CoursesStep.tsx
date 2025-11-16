"use client";

import React, { useEffect, useMemo, useState } from "react";
import { onboardingService } from "@/services/onboardingService";
import { CourseItem } from "@/types/onboarding";

export type CourseEntry = { courseId?: number; courseCode?: string };

interface Props {
  token?: string;
  termId?: number;
  programId?: string | number; // carrera seleccionada
  courses?: CourseEntry[];
  onUpdate: (data: Partial<{ termId?: number; termCode?: string; courses: CourseEntry[] }>) => void;
}

export default function CoursesStep({ token, termId: _termId, programId, courses = [], onUpdate }: Props) {
  const [catalog, setCatalog] = useState<CourseItem[]>([]);
  const [query, setQuery] = useState("");

  // Load periods
  // Periodo se maneja en el Step 2

  // Load catalog by career
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const pid = programId ? Number(programId) : NaN;
        if (!Number.isNaN(pid)) {
          const list = await onboardingService.fetchCursosPorCarrera(pid, token);
          if (!mounted) return;
          setCatalog(list.map((c) => ({ id: c.id, code: c.codigo, name: c.nombre })) as CourseItem[]);
        } else {
          if (!mounted) return;
          setCatalog([]);
        }
      } catch {
        if (!mounted) return;
        setCatalog([]);
      }
    })();
    return () => { mounted = false; };
  }, [token, programId]);

  const results = useMemo(() => {
    const base = !query
      ? catalog
      : catalog.filter((c) => `${c.code} ${c.name}`.toLowerCase().includes(query.trim().toLowerCase()));
    return [...base].sort((a, b) => a.name.localeCompare(b.name));
  }, [catalog, query]);

  const addCourse = (item: CourseItem) => {
    if (courses.some((c) => c.courseId === item.id || c.courseCode === item.code)) return;
    onUpdate({ courses: [...courses, { courseId: item.id, courseCode: item.code }] });
  };

  const removeCourse = (index: number) => onUpdate({ courses: courses.filter((_, i) => i !== index) });


  // Helpers de presentación
  function toTitleCase(input?: string | null): string {
    if (!input) return "";
    const lower = input.toLowerCase();
    const small = new Set(["de","del","la","las","los","y","e","en","el","para","por","a"]);
    return lower
      .split(/\s+/)
      .map((w, i) => {
        if (/^(ii|iii|iv|vi|vii|viii|ix|x)$/i.test(w)) return w.toUpperCase();
        if (i > 0 && small.has(w)) return w;
        return w.charAt(0).toUpperCase() + w.slice(1);
      })
      .join(" ");
  }

  return (
    <div className="space-y-6">
      {/* Catálogo arriba, seleccionados abajo */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          <h3 className="font-bold text-white text-lg">Catálogo de cursos</h3>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full sm:w-96 rounded-xl bg-[#18132a] border border-white/20 p-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/60"
            placeholder="Código o nombre"
          />
        </div>
        {catalog.length === 0 ? (
          <div className="text-white/60">No hay cursos disponibles.</div>
        ) : (
          <div className="max-h-[420px] overflow-auto rounded-2xl border border-white/20 bg-white/5 shadow-inner">
            <ul className="divide-y divide-white/10">
              {results.map((course) => {
                const isSelected = courses.some(c => c.courseId === course.id || c.courseCode === course.code);
                return (
                  <li key={course.id} className="flex items-center gap-3 p-3 hover:bg-white/10">
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium leading-snug whitespace-normal break-words">{toTitleCase(course.name)}</div>
                      <div className="text-white/60 text-[10px] tracking-wider uppercase">{course.code}</div>
                    </div>
                    {isSelected ? (
                      <button
                        className="px-3 py-1.5 rounded-lg border border-white/20 text-white/80 hover:text-white hover:bg-white/10"
                        onClick={() => onUpdate({ courses: courses.filter(c => c.courseId !== course.id && c.courseCode !== course.code) })}
                      >
                        Quitar
                      </button>
                    ) : (
                      <button
                        className="px-3 py-1.5 rounded-lg border border-[#7c3aed] text-white/90 hover:text-white"
                        onClick={() => addCourse(course)}
                      >
                        Añadir
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-white text-lg">Cursos seleccionados</h3>
          <div className="flex items-center gap-3">
            <span className="text-white/60 text-sm">{courses.length}</span>
            {courses.length > 0 ? (
              <button className="text-white/70 hover:text-white text-sm underline" onClick={() => onUpdate({ courses: [] })}>
                Limpiar
              </button>
            ) : null}
          </div>
        </div>
        {courses.length === 0 ? (
          <div className="text-white/60">Aún no agregaste cursos. Puedes continuar y registrar luego.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-auto pr-1">
            {courses.map((c, i) => (
              <div key={i} className="inline-flex items-center gap-2 bg-white/8 border border-white/15 text-white rounded-2xl pl-3 pr-2 py-1.5 shadow-sm">
                <span className="text-[10px] tracking-wider uppercase bg-white/10 px-2 py-0.5 rounded-md border border-white/10">
                  {(() => {
                    const byId = typeof c.courseId === 'number' ? catalog.find(x => x.id === c.courseId) : undefined;
                    const byCode = c.courseCode ? catalog.find(x => x.code === c.courseCode) : undefined;
                    return (byId?.code || byCode?.code || c.courseCode || "");
                  })()}
                </span>
                <span className="text-sm max-w-[240px] truncate">
                  {(() => {
                    const byId = typeof c.courseId === 'number' ? catalog.find(x => x.id === c.courseId) : undefined;
                    const byCode = c.courseCode ? catalog.find(x => x.code === c.courseCode) : undefined;
                    return toTitleCase(byId?.name || byCode?.name || String(c.courseCode || c.courseId));
                  })()}
                </span>
                <button aria-label="Quitar" onClick={() => removeCourse(i)} className="ml-1 rounded-full hover:bg-white/15 w-6 h-6 flex items-center justify-center text-white/70 hover:text-white border border-white/10">×</button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}



