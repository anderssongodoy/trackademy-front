"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui";
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
    if (!query) return catalog;
    const q = query.trim().toLowerCase();
    return catalog.filter((c) => `${c.code} ${c.name}`.toLowerCase().includes(q));
  }, [catalog, query]);

  const addCourse = (item: CourseItem) => {
    if (courses.some((c) => c.courseId === item.id || c.courseCode === item.code)) return;
    onUpdate({ courses: [...courses, { courseId: item.id, courseCode: item.code }] });
  };

  const removeCourse = (index: number) => onUpdate({ courses: courses.filter((_, i) => i !== index) });


  return (
    <div className="space-y-6">
      {/* Layout principal: seleccionados (chips) + lista con buscador */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Seleccionados */}
        <section className="lg:col-span-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-white">Cursos seleccionados</h3>
            <span className="text-white/60 text-sm">{courses.length}</span>
          </div>
          {courses.length === 0 ? (
            <div className="text-white/60">Aun no agregaste cursos. Puedes continuar y registrar luego.</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {courses.map((c, i) => (
                <span key={i} className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white rounded-full px-3 py-1">
                  {(() => {
                    const byId = typeof c.courseId === 'number' ? catalog.find(x => x.id === c.courseId) : undefined;
                    const byCode = c.courseCode ? catalog.find(x => x.code === c.courseCode) : undefined;
                    return (byId?.name || byCode?.name || c.courseCode || c.courseId);
                  })()}
                  <button onClick={() => removeCourse(i)} className="text-white/70 hover:text-white">x</button>
                </span>
              ))}
            </div>
          )}
        </section>

        {/* Catalogo (lista) */}
        <section className="lg:col-span-7">
          <div className="flex items-center justify-between mb-2 gap-3">
            <h3 className="font-bold text-white">Catalogo de cursos</h3>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full max-w-sm rounded-xl bg-[#18132a] border border-white/20 p-2 text-white"
              placeholder="Codigo o nombre"
            />
          </div>
          {catalog.length === 0 ? (
            <div className="text-white/60">No hay cursos disponibles.</div>
          ) : (
            <div className="max-h-80 overflow-auto rounded-xl border border-white/20 bg-white/5">
              <ul className="divide-y divide-white/10">
                {results.map((course) => {
                  const isSelected = courses.some(c => c.courseId === course.id || c.courseCode === course.code);
                  return (
                    <li key={course.id} className="flex items-center gap-3 p-3 hover:bg-white/10">
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium leading-snug whitespace-normal break-words">{course.name}</div>
                        <div className="text-white/50 text-xs">{course.code}</div>
                      </div>
                      {isSelected ? (
                        <span className="text-xs text-white/60">Agregado</span>
                      ) : (
                        <Button size="sm" variant="secondary" onClick={() => addCourse(course)}>Anadir</Button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}



