"use client";

export type ToastKind = "info" | "success" | "warning" | "error";
export type ToastEvent = { id?: string; kind?: ToastKind; message: string; timeoutMs?: number };

const SHOW = "app:toast:show";

export function showToast(toast: ToastEvent) {
  if (typeof document !== "undefined") {
    document.dispatchEvent(new CustomEvent<ToastEvent>(SHOW, { detail: toast }));
  }
}

export function subscribeToast(onShow: (t: ToastEvent) => void) {
  if (typeof document === "undefined") return () => {};
  const h = (e: Event) => onShow((e as CustomEvent<ToastEvent>).detail);
  document.addEventListener(SHOW, h as EventListener);
  return () => document.removeEventListener(SHOW, h as EventListener);
}

