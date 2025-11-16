"use client";

export default function KpisRow({ totalCursos, semanaActual, proximas }: { totalCursos?: number; semanaActual?: number | null; proximas?: number; }) {
  const show = (v?: number | null) => (typeof v === "number" && Number.isFinite(v) ? v : "--");
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      <div className="bg-[#23203b] border border-[#7c3aed] rounded-2xl p-5">
        <div className="text-white/70 text-sm">Cursos activos</div>
        <div className="text-3xl font-extrabold text-white">{show(totalCursos)}</div>
      </div>
      <div className="bg-[#23203b] border border-[#7c3aed] rounded-2xl p-5">
        <div className="text-white/70 text-sm">Semana actual</div>
        <div className="text-3xl font-extrabold text-white">{show(semanaActual ?? undefined)}</div>
      </div>
      <div className="bg-[#23203b] border border-[#7c3aed] rounded-2xl p-5">
        <div className="text-white/70 text-sm">Próximas evaluaciones</div>
        <div className="text-3xl font-extrabold text-white">{show(proximas)}</div>
      </div>
    </div>
  );
}

