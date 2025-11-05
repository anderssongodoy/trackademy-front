"use client";

export type LoadingEventDetail = { text?: string };

const BEGIN = "app:loading:begin";
const END = "app:loading:end";

export function beginLoading(text?: string) {
  if (typeof document !== "undefined") {
    document.dispatchEvent(new CustomEvent<LoadingEventDetail>(BEGIN, { detail: { text } }));
  }
}

export function endLoading() {
  if (typeof document !== "undefined") {
    document.dispatchEvent(new CustomEvent(END));
  }
}

export function subscribe(onBegin: (text?: string) => void, onEnd: () => void) {
  if (typeof document === "undefined") return () => {};
  const hBegin = (e: Event) => onBegin((e as CustomEvent<LoadingEventDetail>).detail?.text);
  const hEnd = () => onEnd();
  document.addEventListener(BEGIN, hBegin as EventListener);
  document.addEventListener(END, hEnd as EventListener);
  return () => {
    document.removeEventListener(BEGIN, hBegin as EventListener);
    document.removeEventListener(END, hEnd as EventListener);
  };
}

