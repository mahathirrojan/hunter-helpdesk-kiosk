"use client";

import { useEffect, useState } from "react";

export type Role = "Student" | "Faculty" | "Staff";
export type Purpose =
  | "Password reset"
  | "NetID"
  | "CunyFirst"
  | "CUNY MFA / Outlook MFA"
  | "Wi-Fi / HunterSecure"
  | "Printing / PaperCut"
  | "BrightSpace"
  | "Email / Outlook"
  | "Hardware (laptop/desktop)"
  | "Software install/access"
  | "Loaner pickup/return"
  | "General question"
  | "Other";

export type Entry = {
  id: string;
  ts: number;
  nameOrNetId: string;
  emplid: string;     // "N/A" or 8 digits
  role: Role;
  purpose: Purpose;
  details?: string;
};

const LS_KEY = "hunter-helpdesk-queue-v1";
const HISTORY_KEY = "hunter-helpdesk-history-v1";

// Helpers
function uid() {
  return Math.random().toString(36).slice(2) + "-" + Date.now().toString(36);
}
function ymd(d: Date) {
  return [d.getFullYear(), d.getMonth(), d.getDate()].join("-");
}
function isSameLocalDay(aTs: number, bTs: number) {
  return ymd(new Date(aTs)) === ymd(new Date(bTs));
}

export function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function useLocalQueue() {
  const [entries, setEntries] = useState<Entry[]>([]);   // active queue
  const [history, setHistory] = useState<Entry[]>([]);   // today's all check-ins
  const [now, setNow] = useState<number>(Date.now());

  // Load queue + history (FIFO)
  useEffect(() => {
    try {
      const rawQ = localStorage.getItem(LS_KEY);
      if (rawQ) {
        const q: Entry[] = JSON.parse(rawQ);
        q.sort((a, b) => a.ts - b.ts);
        setEntries(q);
      }
      const rawH = localStorage.getItem(HISTORY_KEY);
      if (rawH) {
        const h: Entry[] = JSON.parse(rawH);
        const todayOnly = h.filter((e) => isSameLocalDay(e.ts, Date.now()));
        setHistory(todayOnly);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(todayOnly));
      }
    } catch {}
  }, []);

  // Persist
  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(entries)); } catch {}
  }, [entries]);

  useEffect(() => {
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); } catch {}
  }, [history]);

  // Tick each minute so midnight rollovers reset `history`
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    const today = ymd(new Date());
    setHistory((prev) => prev.filter((e) => ymd(new Date(e.ts)) === today));
  }, [now]);

  // Derived
  const todayCount = history.length;
  const totalCount = history.length;

  // Actions
  function addEntry(data: Omit<Entry, "id" | "ts">) {
    const newEntry: Entry = { id: uid(), ts: Date.now(), ...data };
    setEntries((prev) => [...prev, newEntry]);   // FIFO append
    setHistory((prev) => [...prev, newEntry]);   // count regardless of resolve
    return newEntry;
  }

  function removeEntry(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  function clearAll() {
    setEntries([]);
    setHistory([]);
  }

  function exportCSV() {
    const header = [
      "timestamp_iso",
      "time_display",
      "name_or_netid",
      "emplid",
      "role",
      "purpose",
      "details",
    ];
    const rows = history.map((r) => [
      new Date(r.ts).toISOString(),
      formatTime(r.ts),
      r.nameOrNetId,
      r.emplid,
      r.role,
      r.purpose,
      r.details ?? "",
    ]);
    const csv = [header, ...rows]
      .map((arr) => arr.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hunter_helpdesk_walkins_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return {
    entries,
    history,
    todayCount,
    totalCount,
    addEntry,
    removeEntry,
    clearAll,
    exportCSV,
  };
}