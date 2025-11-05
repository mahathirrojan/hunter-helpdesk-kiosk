"use client";

import React, { useState } from "react";
import { useLocalQueue } from "./useLocalQueue";
import KioskForm from "./KioskForm";
import QueuePreview from "./QueuePreview";
import QueueView from "./QueueView";
import PinModal from "./PinModal";

const HUNTER_PURPLE = "#5F259F";
const HUNTER_GOLD = "#FFC72A";
const ADMIN_PIN = "2468";

export default function HunterHelpdeskKiosk() {
  const {
    entries,
    todayCount,
    totalCount,
    addEntry,
    removeEntry,
    clearAll,
    exportCSV,
  } = useLocalQueue();

  const [view, setView] = useState<"kiosk" | "queue">("kiosk");
  const [isAdmin, setIsAdmin] = useState(false);
  const [pinPrompt, setPinPrompt] = useState(false);

  function handleAdminToggle() {
    if (isAdmin) {
      setIsAdmin(false);
      return;
    }
    setPinPrompt(true);
  }

  function submitPin(pin: string) {
    if (pin === ADMIN_PIN) {
      setIsAdmin(true);
      setView("queue");
    } else {
      alert("Incorrect PIN");
    }
    setPinPrompt(false);
  }

  return (
    <div className="min-h-screen w-full text-slate-900" style={{ backgroundColor: "#F6F5FA" }}>
      {/* Header */}
      <header className="sticky top-0 z-10 shadow-sm" style={{ backgroundColor: HUNTER_PURPLE }}>
        <div className="mx-auto max-w-5xl p-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Hunter IT – Helpdesk Check-In</h1>
              <p className="text-sm/5 opacity-90">
                Student Helpdesk · Faculty/Staff Helpdesk · LMS Support · Technology Resource Center
              </p>
            </div>
            <span
              className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium"
              style={{ backgroundColor: HUNTER_GOLD, color: "#111827" }}
              title="Walk-ins recorded today (local time)"
            >
              Today: {todayCount}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setView("kiosk")}
              className="px-4 py-2 rounded-xl text-base font-medium border border-white/30 hover:border-white/60 transition"
              style={{ backgroundColor: view === "kiosk" ? "white" : "transparent", color: view === "kiosk" ? "#111827" : "white" }}
            >
              Check-In
            </button>
            <button
              onClick={() => setView("queue")}
              className="px-4 py-2 rounded-xl text-base font-medium border border-white/30 hover:border-white/60 transition"
              style={{ backgroundColor: view === "queue" ? "white" : "transparent", color: view === "queue" ? "#111827" : "white" }}
            >
              Queue
            </button>
            <button
              onClick={handleAdminToggle}
              className="px-4 py-2 rounded-xl text-base font-medium border border-white/30 hover:border-white/60 transition"
              style={{ backgroundColor: isAdmin ? HUNTER_GOLD : "transparent", color: isAdmin ? "#111827" : "white" }}
              title={isAdmin ? "Admin mode ON" : "Admin login"}
            >
              Admin
            </button>
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="mx-auto max-w-5xl p-4">
        {view === "kiosk" ? (
          <section className="grid gap-6 md:grid-cols-2">
            <KioskForm
              onSubmit={(data) => {
                addEntry(data);
              }}
            />
            <QueuePreview entries={entries} />
          </section>
        ) : (
          <QueueView
            entries={entries}
            todayCount={todayCount}
            totalCount={totalCount}
            onResolve={removeEntry}
            onExportCSV={exportCSV}
            onClearAll={clearAll}
            primaryColor={HUNTER_PURPLE}
            accentColor={HUNTER_GOLD}
          />
        )}
      </main>

      {/* PIN Modal */}
      {pinPrompt && <PinModal onClose={() => setPinPrompt(false)} onSubmit={submitPin} primaryColor={HUNTER_PURPLE} />}

      <footer className="mx-auto max-w-5xl p-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} Hunter IT · Frontdesk Kiosk Prototype · Local-only demo
      </footer>
    </div>
  );
}