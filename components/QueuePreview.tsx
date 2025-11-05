"use client";

import React from "react";
import type { Entry } from "./useLocalQueue";
import { formatTime } from "./useLocalQueue";

type Props = {
  entries: Entry[]; // FIFO already
};

export default function QueuePreview({ entries }: Props) {
  return (
    <div className="rounded-2xl shadow p-6 bg-white">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold">Live Queue</h2>
        <span className="text-sm text-slate-500">Oldest first</span>
      </div>
      <div className="space-y-3 max-h-[560px] overflow-auto pr-2">
        {entries.length === 0 && (
          <p className="text-slate-500">No one has checked in yet.</p>
        )}
        {entries.map((e) => (
          <div key={e.id} className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div className="font-medium text-lg">{e.nameOrNetId}</div>
              <div className="text-sm text-slate-500">{formatTime(e.ts)}</div>
            </div>
            <div className="text-sm text-slate-600 mt-1">
              EMPLID {e.emplid} · {e.role} · {e.purpose}
            </div>
            {e.details && <div className="text-sm text-slate-700 mt-1">{e.details}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}