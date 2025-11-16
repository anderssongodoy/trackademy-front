"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { onboardingService } from "@/services/onboardingService";
import CoursesStep, { type CourseEntry } from "@/components/onboarding/CoursesStep";
import meService from "@/services/meService";
import { getLoginStatus } from "@/services/accountService";

type BasicItem = { id: string; name: string };

export default function PerfilPage() {
  const { data: session } = useSession();
  type ClientSession = { idToken?: string; user?: { image?: string } } | null;
  const token = (session as ClientSession)?.idToken ?? "";
  const userImage = (session as ClientSession)?.user?.image;
  const user = (session as { user?: { image?: string | null; name?: string | null } } | null)?.user;

  const [campuses, setCampuses] = useState<BasicItem[]>([]);
  const [programs, setPrograms] = useState<BasicItem[]>([]);
  const [periodos, setPeriodos] = useState<Array<{ id: number; code?: string; name: string }>>([]);

  const [campus, setCampus] = useState<string>("");
  const [program, setProgram] = useState<string>("");
  const [termId, setTermId] = useState<number | undefined>(undefined);
  const [courses, setCourses] = useState<CourseEntry[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const [c, p, t] = await Promise.all([
        onboardingService.fetchCampuses(token),
        onboardingService.fetchPrograms(token),
        onboardingService.fetchTerms(token),
      ]);
      if (!mounted) return;
      setCampuses(c.map((x) => ({ id: x.id, name: x.name })));
      setPrograms(p.map((x) => ({ id: x.id, name: x.name })));
      setPeriodos(t.map((x) => ({ id: x.id, code: x.code, name: x.name })));

      try {
        const status = await getLoginStatus(token, userImage);
        if (status) {
          if (status.campusId) setCampus(String(status.campusId));
          if (status.carreraId) setProgram(String(status.carreraId));
          if (status.periodoId) setTermId(Number(status.periodoId));
        }
      } catch {
        // ignore
      }

      const misCursos = await meService.getCursos(token);
      if (misCursos && misCursos.length > 0) {
        setCourses(misCursos.map((mc) => ({ courseId: mc.cursoId })) as CourseEntry[]);
      }
    }
    if (token) void load();
    return () => {
      mounted = false;
    };
  }, [token, userImage]);

  const canSave = useMemo(
    () => campus && program && termId && (courses?.length ?? 0) > 0,
    [campus, program, termId, courses]
  );

  return (
    <div className="min-h-screen bg-[#18132a] px-4 py-10">
      <div className="max-w-5xl mx-auto">
        {/* Header con navegación */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <a href="/home" className="text-white/70 hover:text-white underline text-sm">Inicio</a>
            <h1 className="text-3xl sm:text-4xl font-black text-white mt-1">Perfil</h1>
          </div>
          <div className="relative">
            <button className="w-9 h-9 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center overflow-hidden hover:bg-white/15">
              {user?.image ? (
                <img src={user.image} alt={user?.name || "Usuario"} className="w-full h-full object-cover" />
              ) : (
                <span className="font-semibold">{(user?.name || "U").trim().charAt(0).toUpperCase()}</span>
              )}
            </button>
          </div>
        </div>

        <section className="bg-[#23203b] border border-[#7c3aed] rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Datos académicos</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-white/80 mb-1">Campus</label>
              <select
                value={campus}
                onChange={(e) => setCampus(e.target.value)}
                className="w-full rounded-xl bg-[#18132a] border border-[#7c3aed] p-3 text-white"
              >
                {!campus && <option value="">Selecciona tu campus</option>}
                {campuses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-white/80 mb-1">Carrera</label>
              <select
                value={program}
                onChange={(e) => setProgram(e.target.value)}
                className="w-full rounded-xl bg-[#18132a] border border-[#7c3aed] p-3 text-white"
              >
                {!program && <option value="">Selecciona tu carrera</option>}
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-white/80 mb-1">Periodo</label>
              <select
                value={termId ?? ""}
                onChange={(e) => setTermId(Number(e.target.value))}
                className="w-full rounded-xl bg-[#18132a] border border-[#7c3aed] p-3 text-white"
              >
                {!termId && <option value="">Selecciona el periodo</option>}
                {periodos.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="bg-[#23203b] border border-[#7c3aed] rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Tus cursos</h2>
          <CoursesStep
            token={token}
            termId={termId}
            programId={program}
            courses={courses}
            onUpdate={(data) => {
              if (data.termId) setTermId(data.termId);
              if (data.courses) setCourses(data.courses);
            }}
          />
          <div className="flex justify-end mt-6 sticky bottom-4 z-10">
            <button
              disabled={!canSave || saving}
              onClick={async () => {
                if (!canSave) return;
                setSaving(true);
                try {
                  const cursoIds = (courses || [])
                    .map(c => (typeof c.courseId === 'number' ? Number(c.courseId) : NaN))
                    .filter(n => Number.isFinite(n)) as number[];
                  const payload = {
                    campusId: Number(campus),
                    periodoId: Number(termId),
                    carreraId: Number(program),
                    cursoIds,
                  };
                  const updated = await meService.putCursos(payload, token);
                  if (updated && updated.length) {
                    setCourses(updated.map(u => ({ courseId: u.cursoId })) as CourseEntry[]);
                  }
                } finally {
                  setSaving(false);
                }
              }}
              className="border border-[#7c3aed] text-white/90 px-4 py-2 rounded-xl hover:text-white"
            >
              Guardar cambios
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
