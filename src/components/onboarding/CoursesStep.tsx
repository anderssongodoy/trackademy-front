"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui";
import { onboardingService } from "@/services/onboardingService";
import { CourseItem, Term } from "@/types/onboarding";

export type CourseEntry = { courseId?: number; courseCode?: string };

interface Props {
  token?: string;
  termId?: number;  
  programId?: string | number; // carrera seleccionada
  courses?: CourseEntry[];
  onUpdate: (data: Partial<{ termId?: number; termCode?: string; courses: CourseEntry[] }>) => void;
}

export default function CoursesStep({ token, termId, programId, courses = [], onUpdate }: Props) {
  const [terms, setTerms] = useState<Term[]>([]);
  const [catalog, setCatalog] = useState<CourseItem[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedTermCode, setSelectedTermCode] = useState<string | undefined>(undefined);

  // Cargar periodos; no actualizar al padre para evitar loops.
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const t = await onboardingService.fetchTerms(token);
        if (!mounted) return;
        setTerms(t);
        if (termId) {
          const found = t.find((x) => x.id === termId) ?? null;
          if (found) setSelectedTermCode(found.code ?? String(found.id));
        }
      } catch {
        if (!mounted) return;
        setTerms([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [token, termId]);

  // Cargar cursos por carrera; depende solo de carrera (programId) y token.
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
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
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [token, programId]);

  const results = useMemo(() => {
    if (!query) return catalog;
    const q = query.trim().toLowerCase();
    return catalog.filter((c) => `${c.code} ${c.name}`.toLowerCase().includes(q));
  }, [catalog, query]);

  const handleAddFromCatalog = (item: CourseItem) => {
    if (courses.some((c) => c.courseId === item.id || c.courseCode === item.code)) return;
    onUpdate({ courses: [...courses, { courseId: item.id, courseCode: item.code }] });
  };

  const handleRemove = (index: number) => onUpdate({ courses: courses.filter((_, i) => i !== index) });

  const onTermSelect = (val: string) => {
    const code = val || undefined;
    setSelectedTermCode(code);
    const found = terms.find((t) => (t.code ?? String(t.id)) === val) ?? null;
    onUpdate({ termId: found?.id, ...(code ? { termCode: code } : {}) });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-4">
          <label className="block text-white/80 mb-1">Periodo</label>
          <select
            value={selectedTermCode ?? ""}
            onChange={(e) => onTermSelect(e.target.value)}
            className="w-full rounded-xl bg-white/10 border border-white/20 p-3 text-white"
          >
            <option value="">Selecciona el periodo...</option>
            {terms.map((term) => (
              <option key={term.id} value={term.code ?? String(term.id)}>
                {term.name || term.code || term.id}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-8">
          <label className="block text-white/80 mb-1">Buscar cursos</label>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl bg-white/10 border border-white/20 p-3 text-white"
            placeholder="Código o nombre"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-6 max-h-72 overflow-auto rounded-xl scrollbar-none">
          <div className="font-bold text-white mb-2">Catálogo de cursos</div>
          {catalog.length === 0 ? (
            <div className="text-white/60 text-center">No hay cursos disponibles.</div>
          ) : (
            results.map((course) => (
              <div key={course.id} className="bg-white/10 border border-white/20 rounded-xl p-4 mb-3 flex items-center justify-between">
                <div className="min-w-0">
                  <div className="font-bold text-white truncate">{course.code} - {course.name}</div>
                </div>
                <Button size="sm" variant="secondary" onClick={() => handleAddFromCatalog(course)}>Añadir</Button>
              </div>
            ))
          )}
        </div>
        <div className="md:col-span-6 max-h-72 overflow-auto rounded-xl scrollbar-none">
          <div className="font-bold text-white mb-2">Cursos seleccionados</div>
          {courses.length === 0 ? (
            <div className="text-white/60">Aún no agregaste cursos. Puedes continuar y registrar luego.</div>
          ) : (
            courses.map((c, i) => (
              <div key={i} className="bg-white/10 border border-white/20 rounded-xl p-3 mb-2 flex items-center justify-between">
                <span className="text-white font-semibold truncate">{c.courseCode || c.courseId}</span>
                <Button size="sm" variant="outline" onClick={() => handleRemove(i)}>Quitar</Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
