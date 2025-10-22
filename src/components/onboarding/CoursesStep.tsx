
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui";
import { onboardingService } from "@/services/onboardingService";
import { CourseItem, Term } from "@/types/onboarding";

export type CourseEntry = { courseId?: number; courseCode?: string };

interface Props {
  token?: string;
  termId?: number;
  courses?: CourseEntry[];
  onUpdate: (data: Partial<{ termId?: number; termCode?: string; courses: CourseEntry[] }>) => void;
}

export default function CoursesStep({ token, termId, courses = [], onUpdate }: Props) {
  const [terms, setTerms] = useState<Term[]>([]);
  const [catalog, setCatalog] = useState<CourseItem[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [selectedTermCode, setSelectedTermCode] = useState<string | undefined>(undefined);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const t = await onboardingService.fetchTerms(token);
        if (!mounted) return;
        setTerms(t);
        if (termId) {
          const found = t.find((x) => x.id === termId) ?? null;
          if (found) {
            setSelectedTermCode(found.code ?? String(found.id));
            onUpdate({ termId: found.id, termCode: found.code });
          }
        }
      } catch {
        if (!mounted) return;
        setTerms([]);
      }
    })();

    (async () => {
      try {
        setLoading(true);
        const all = await onboardingService.fetchCourses(undefined, token);
        if (!mounted) return;
        setCatalog(all);
      } catch {
        if (!mounted) return;
        setCatalog([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [token, termId, onUpdate]);

  const results = useMemo(() => {
    if (!query) return catalog;
    const q = query.trim().toLowerCase();
    return catalog.filter((c) => `${c.code} ${c.name}`.toLowerCase().includes(q));
  }, [catalog, query]);

  const handleAddFromCatalog = (item: CourseItem) => {
    if (courses.some((c) => c.courseId === item.id || c.courseCode === item.code)) return;
    onUpdate({ courses: [...courses, { courseId: item.id, courseCode: item.code }] });
  };

  const handleAddManual = (code: string) => {
    const san = code.trim();
    if (!san) return;
    if (courses.some((c) => c.courseCode === san)) return;
    onUpdate({ courses: [...courses, { courseCode: san }] });
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
      <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div>
          <label className="block text-white/80 mb-1">Término académico</label>
          <select
            value={selectedTermCode ?? ""}
            onChange={(e) => onTermSelect(e.target.value)}
            className="w-full rounded-xl bg-white/10 border border-white/20 p-3 text-white"
          >
            <option value="">Selecciona el término...</option>
            {terms.map((term) => (
              <option key={term.id} value={term.code ?? String(term.id)}>{term.code || term.name || term.id}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-white/80 mb-1">Buscar cursos</label>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl bg-white/10 border border-white/20 p-3 text-white"
            placeholder="Código o nombre"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="max-h-64 overflow-auto rounded-xl scrollbar-none">
          {catalog.length === 0 ? (
            <div className="text-white/60 text-center">No hay cursos disponibles.</div>
          ) : (
            results.map((course) => (
              <div key={course.id} className="bg-white/10 border border-white/20 rounded-xl p-4 mb-2 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">{course.code} - {course.name}</div>
                  <div className="text-xs text-white/60">Créditos {course.credits} · Horas {course.weeklyHours}</div>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleAddFromCatalog(course)}
                >
                  Añadir
                </Button>
              </div>
            ))
          )}
        </div>
        <div className="max-h-64 overflow-auto rounded-xl scrollbar-none">
          <div className="font-bold text-white mb-2">Cursos seleccionados</div>
          {courses.length === 0 ? (
            <div className="text-white/60">Aún no agregaste cursos. Puedes continuar y registrar luego.</div>
          ) : (
            courses.map((c, i) => (
              <div key={i} className="bg-white/10 border border-white/20 rounded-xl p-3 mb-2 flex items-center justify-between">
                <span className="text-white font-semibold">{c.courseCode || c.courseId}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRemove(i)}
                >
                  Quitar
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
