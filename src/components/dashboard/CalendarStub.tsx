"use client";
import React from "react";
import { CalendarEvent } from "@/types/student";

export default function CalendarStub({ events }: { events: CalendarEvent[] | null }) {
  if (!events || events.length === 0) return <div className="bg-white/3 p-4 rounded-lg text-white/70">No hay eventos en tu calendario.</div>;
  return (
    <div className="space-y-2">
      {events.map((e) => (
        <div key={e.id} className="p-3 bg-white/3 rounded-lg border border-white/10">
          <div className="font-semibold text-white">{e.title}</div>
          <div className="text-xs text-white/70">{new Date(e.start).toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
}
