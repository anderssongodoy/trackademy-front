"use client";

type Item = { title: string; subtitle?: string; right?: string; kind?: "clase" | "evaluacion" };

export default function AgendaToday({
  items,
  onSyncMicrosoft,
  //onDownloadICS,
  syncing,
  //downloading,
  calendarHref = "/home/hitos",
}: {
  items: Item[];
  onSyncMicrosoft?: () => void;
  onDownloadICS?: () => void;
  syncing?: boolean;
  downloading?: boolean;
  calendarHref?: string;
}) {
  return (
    <section className="bg-[#23203b] border border-[#7c3aed] rounded-2xl p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <h2 className="text-xl font-bold text-white">Agenda de hoy</h2>
        <div className="flex w-full sm:w-auto flex-wrap gap-2">
          {onSyncMicrosoft ? (
            <button
              onClick={onSyncMicrosoft}
              disabled={!!syncing}
              className={`w-full sm:w-auto inline-flex justify-center px-3 py-1.5 rounded-xl border ${syncing ? "opacity-60 cursor-not-allowed" : "hover:text-white"} text-white/90 border-[#7c3aed]`}
            >
              {syncing ? "Sincronizando…" : "Sincronizar con Microsoft"}
            </button>
          ) : null}
          {/* {onDownloadICS ? (
            <button
              onClick={onDownloadICS}
              disabled={!!downloading}
              className={`w-full sm:w-auto inline-flex justify-center px-3 py-1.5 rounded-xl border ${downloading ? "opacity-60 cursor-not-allowed" : "hover:text-white"} text-white/90 border-white/30`}
            >
              {downloading ? "Generando…" : "Descargar .ics"}
            </button>
          ) : null} */}
          {calendarHref ? (
            <a href={calendarHref} className="w-full sm:w-auto inline-flex justify-center text-white/90 border border-[#7c3aed] px-3 py-1.5 rounded-xl hover:text-white">Ver calendario</a>
          ) : null}
        </div>
      </div>
      {items.length === 0 ? (
        <div className="text-white/60">No tienes clases ni evaluaciones hoy.</div>
      ) : (
        <ul className="space-y-3">
          {items.map((it, i) => (
            <li key={i} className="bg-white/10 border border-white/20 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="min-w-0">
                <div className="text-white font-medium truncate">{it.title}</div>
                {it.subtitle ? (<div className="text-white/60 text-sm truncate">{it.subtitle}</div>) : null}
              </div>
              {it.right ? (
                <div className={`text-xs px-2 py-1 rounded-lg border shrink-0 self-start sm:self-auto ${it.kind === "clase" ? "border-white/20 text-white/80" : "border-[#7c3aed] text-white"}`}>
                  {it.right}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

