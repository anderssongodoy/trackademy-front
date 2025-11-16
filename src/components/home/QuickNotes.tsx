"use client";

import { useState, useMemo } from "react";
import meService, { type UsuarioCursoResumenDto, type UsuarioEvaluacionDto } from "@/services/meService";
import ConfirmDialog from "@/components/ConfirmDialog";

type Props = {
  token: string;
  cursos: UsuarioCursoResumenDto[];
  loading?: boolean;
  onSaved?: (evId: number, nota: number) => void;
};

function firstPendingByCurso(cursos: UsuarioCursoResumenDto[]): { curso: string; ev: UsuarioEvaluacionDto }[] {
  const list: { curso: string; ev: UsuarioEvaluacionDto }[] = [];
  (cursos || []).forEach((c) => {
    const ev = (c.evaluaciones || []).find((e) => !e.nota);
    if (ev) list.push({ curso: c.cursoNombre, ev });
  });
  return list;
}

export default function QuickNotes({ token, cursos, loading, onSaved }: Props) {
  const items = useMemo(() => firstPendingByCurso(cursos), [cursos]);
  const [notaEdit, setNotaEdit] = useState<Record<number, string>>({});
  const [savingNota, setSavingNota] = useState<Record<number, boolean>>({});
  const [confirmNota, setConfirmNota] = useState<{ open: boolean; evId?: number; value?: number }>({ open: false });

  return (
    <section className="bg-[#23203b] border border-[#7c3aed] rounded-2xl p-6">
      <h2 className="text-xl font-bold text-white mb-4">Acciones rápidas</h2>
      {items.length === 0 ? (
        <div className="text-white/60">No hay evaluaciones pendientes de nota.</div>
      ) : (
        <>
          <div className="mb-3 text-white/80 text-xs bg-white/5 border border-white/10 rounded-lg px-3 py-2">
            Tip: para ver las siguientes evaluaciones y el estado actual, registra las notas de evaluaciones ya rendidas. Esto actualiza tu resumen y recomendaciones.
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {items.map(({ curso, ev }) => (
              <div key={ev.id} className="bg-white/10 border border-white/20 rounded-xl p-4">
                <div className="text-white font-semibold mb-1">{curso}</div>
                <div className="text-white/70 text-sm mb-2">{ev.codigo || ev.descripcion || "Evaluación"}</div>
                <div className="flex items-center gap-2">
                  <input
                    value={notaEdit[ev.id] ?? ""}
                    onChange={(e) => setNotaEdit((s) => ({ ...s, [ev.id]: e.target.value }))}
                    placeholder="Nota (0-20)"
                    className="flex-1 rounded-xl bg-white/10 border border-white/20 p-2 text-white"
                  />
                  <button
                    disabled={savingNota[ev.id]}
                    onClick={() => {
                      const val = (notaEdit[ev.id] ?? "").trim();
                      const num = Number(val);
                      if (!val || !Number.isFinite(num)) return;
                      if (num < 0 || num > 20) {
                        alert("La nota debe estar entre 0 y 20.");
                        return;
                      }
                      setConfirmNota({ open: true, evId: ev.id, value: num });
                    }}
                    className="border border-[#7c3aed] text-white/90 px-3 py-1.5 rounded-xl hover:text-white"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            ))}
          </div>

          <ConfirmDialog
            open={confirmNota.open}
            title="Confirmar guardado de nota"
            message={<>
              <div>¿Guardar la nota <span className="font-semibold">{confirmNota.value?.toFixed(1)}</span>?</div>
              <div className="text-white/70 text-sm mt-1">No podrás modificarla luego.</div>
            </>}
            confirmText="Guardar"
            cancelText="Cancelar"
            loading={confirmNota.evId ? !!savingNota[confirmNota.evId] : false}
            onCancel={() => setConfirmNota({ open: false })}
            onConfirm={async () => {
              if (!confirmNota.evId || confirmNota.value == null) return;
              const id = confirmNota.evId; const num = confirmNota.value;
              setSavingNota((s) => ({ ...s, [id]: true }));
              const ok = await meService.postNota(id, String(num), token);
              setSavingNota((s) => ({ ...s, [id]: false }));
              setConfirmNota({ open: false });
              if (ok) {
                setNotaEdit((s) => ({ ...s, [id]: "" }));
                onSaved?.(id, num);
              }
            }}
          />
        </>
      )}
    </section>
  );
}

