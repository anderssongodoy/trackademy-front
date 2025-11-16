"use client";

import React from "react";

type Props = {
  open: boolean;
  title?: string;
  message?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  open,
  title = "Confirmar",
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={loading ? undefined : onCancel} />
      <div className="relative bg-[#23203b] border border-[#7c3aed] rounded-2xl w-full max-w-md p-6 shadow-xl">
        <div className="text-white text-lg font-bold mb-3">{title}</div>
        <div className="text-white/80 mb-5 text-sm leading-relaxed">{message}</div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="text-white/80 border border-white/20 px-3 py-1.5 rounded-xl hover:text-white disabled:opacity-60"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="text-white/90 border border-[#7c3aed] px-3 py-1.5 rounded-xl hover:text-white disabled:opacity-60"
          >
            {loading ? "Guardando..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

