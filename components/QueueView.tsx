"use client";

import React, { useMemo, useState } from "react";
import type { Entry } from "./useLocalQueue";
import { formatTime } from "./useLocalQueue";

type Props = {
  entries: Entry[];
  todayCount: number;
  totalCount: number;
  onResolve: (id: string) => void;
  onExportCSV: () => void;
  onClearAll: () => void;
  primaryColor?: string;  // hex
  accentColor?: string;   // hex
};

export default function QueueView({
  entries,
  todayCount,
  totalCount,
  onResolve,
  onExportCSV,
  onClearAll,
  primaryColor = "#5F259F",
  accentColor = "#FFC72A",
}: Props) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) =>
      [e.nameOrNetId, e.emplid, e.role, e.purpose, e.details ?? ""].some((v) =>
        String(v).toLowerCase().includes(q)
      )
    );
  }, [entries, search]);

  return (
    <section className="rounded-2xl shadow p-6 bg-white">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-semibold">Queue (Admin)</h2>

        {/* Badges */}
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium"
            style={{ backgroundColor: accentColor, color: "#111827" }}
            title="Walk-ins recorded today"
          >
            Today: {todayCount}
          </span>
          <span
            className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium"
            style={{ backgroundColor: "#E5E7EB", color: "#111827" }}
            title="All-time walk-ins stored for today on this device"
          >
            Total: {totalCount}
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <input
            className="rounded-xl border border-slate-300 p-2 min-w-[220px]"
            placeholder="Search name, EMPLID, purpose…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            onClick={onExportCSV}
            className="rounded-xl px-4 py-2 text-white"
            style={{ backgroundColor: primaryColor }}
          >
            Export CSV
          </button>
          <button
            onClick={() => {
              if (!confirm("Clear ALL entries? This cannot be undone.")) return;
              onClearAll();
            }}
            className="rounded-xl border px-4 py-2"
            style={{ borderColor: primaryColor, color: primaryColor }}
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="overflow-auto -mx-2 px-2 mt-4">
        <table className="w-full border-separate border-spacing-y-2">
          <thead>
            <tr className="text-left text-sm text-slate-600">
              <th className="px-3">Time</th>
              <th className="px-3">Name/NetID</th>
              <th className="px-3">EMPLID</th>
              <th className="px-3">Role</th>
              <th className="px-3">Purpose</th>
              <th className="px-3">Details</th>
              <th className="px-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => (
              <tr key={e.id} className="bg-slate-50">
                <td className="px-3 py-2 text-sm">{formatTime(e.ts)}</td>
                <td className="px-3 py-2 text-sm font-medium">{e.nameOrNetId}</td>
                <td className="px-3 py-2 text-sm">{e.emplid}</td>
                <td className="px-3 py-2 text-sm">{e.role}</td>
                <td className="px-3 py-2 text-sm">{e.purpose}</td>
                <td className="px-3 py-2 text-sm max-w-[28ch] truncate" title={e.details}>
                  {e.details ?? ""}
                </td>
                <td className="px-3 py-2 text-sm">
                  <button
                    onClick={() => onResolve(e.id)}
                    className="rounded-lg px-3 py-1 text-white"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Resolve
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-slate-500" colSpan={7}>
                  No matches.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}