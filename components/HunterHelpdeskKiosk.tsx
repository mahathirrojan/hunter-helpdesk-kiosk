"use client";

import React, { useEffect, useMemo, useState } from "react";

// ---- Types ----
export type Role = "Student" | "Faculty" | "Staff";
export type Purpose =
  | "Password reset"
  | "Account unlock / NetID"
  | "MFA / Duo / Okta"
  | "Wi-Fi / Eduroam"
  | "Printing / PaperCut"
  | "Blackboard / LMS"
  | "Email / Outlook"
  | "Hardware (laptop/desktop)"
  | "Software install/access"
  | "Loaner pickup/return"
  | "General question"
  | "Other";

type Entry = {
  id: string;
  ts: number;
  nameOrNetId: string;
  emplid: string;
  role: Role;
  purpose: Purpose;
  details?: string;
};

const PURPOSES: Purpose[] = [
  "Password reset",
  "Account unlock / NetID",
  "MFA / Duo / Okta",
  "Wi-Fi / Eduroam",
  "Printing / PaperCut",
  "Blackboard / LMS",
  "Email / Outlook",
  "Hardware (laptop/desktop)",
  "Software install/access",
  "Loaner pickup/return",
  "General question",
  "Other",
];

const ROLES: Role[] = ["Student", "Faculty", "Staff"];

const LS_KEY = "hunter-helpdesk-queue-v1";
const ADMIN_PIN = "2468";

function uid() {
  return Math.random().toString(36).slice(2) + "-" + Date.now().toString(36);
}

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function toCSV(rows: Entry[]) {
  const header = [
    "timestamp_iso",
    "time_display",
    "name_or_netid",
    "emplid",
    "role",
    "purpose",
    "details",
  ];
  const lines = [header.join(",")];
  rows.forEach((r) => {
    const record = [
      new Date(r.ts).toISOString(),
      formatTime(r.ts),
      r.nameOrNetId,
      r.emplid,
      r.role,
      r.purpose,
      r.details ?? "",
    ].map((v) => `"${String(v).replaceAll('"', '""')}"`);
    lines.push(record.join(","));
  });
  return lines.join("\n");
}

export default function HunterHelpdeskKiosk() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [view, setView] = useState<"kiosk" | "queue">("kiosk");
  const [isAdmin, setIsAdmin] = useState(false);
  const [pinPrompt, setPinPrompt] = useState(false);

  // Form state
  const [nameOrNetId, setNameOrNetId] = useState("");
  const [emplid, setEmplid] = useState("");
  const [role, setRole] = useState<Role>("Student");
  const [purpose, setPurpose] = useState<Purpose>("Password reset");
  const [details, setDetails] = useState("");
  const [acceptPolicy, setAcceptPolicy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load/save from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setEntries(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(entries));
    } catch {}
  }, [entries]);

  // Validation
  const validate = () => {
    const e: Record<string, string> = {};
    if (!nameOrNetId.trim()) e.nameOrNetId = "Required";
    if (emplid.trim() && !/^\d{8}$/.test(emplid.trim()) && emplid.trim().toLowerCase() !== "n/a") {
      e.emplid = "Must be 8 digits or 'N/A'";
    }
    if (!acceptPolicy) e.acceptPolicy = "Please acknowledge";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    const newEntry: Entry = {
      id: uid(),
      ts: Date.now(),
      nameOrNetId: nameOrNetId.trim(),
      emplid: emplid.trim() || "N/A",
      role,
      purpose,
      details: details.trim() || undefined,
    };
    setEntries((prev) => [newEntry, ...prev]);

    // Reset form
    setNameOrNetId("");
    setEmplid("");
    setRole("Student");
    setPurpose("Password reset");
    setDetails("");
    setAcceptPolicy(false);
    setView("kiosk");

    try { (navigator as any).vibrate?.(30); } catch {}
  };

  const removeEntry = (id: string) =>
    setEntries((prev) => prev.filter((e) => e.id !== id));

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

  // Export CSV
  const exportCSV = () => {
    const csv = toCSV(entries.slice().reverse());
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hunter_helpdesk_walkins_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearAll = () => {
    if (!confirm("Clear ALL entries? This cannot be undone.")) return;
    setEntries([]);
  };

  const handleAdminToggle = () => {
    if (isAdmin) {
      setIsAdmin(false);
      return;
    }
    setPinPrompt(true);
  };

  const submitPin = (pin: string) => {
    if (pin === ADMIN_PIN) {
      setIsAdmin(true);
      setView("queue");
    } else {
      alert("Incorrect PIN");
    }
    setPinPrompt(false);
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-10 bg-white shadow-sm">
        <div className="mx-auto max-w-5xl p-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Hunter IT – Helpdesk Check-In</h1>
            <p className="text-sm text-slate-500">
              Student Helpdesk · Faculty/Staff Helpdesk · LMS Support · Technology Resource Center
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView("kiosk")}
              className={`px-4 py-2 rounded-xl text-base font-medium border ${
                view === "kiosk" ? "bg-slate-900 text-white" : "bg-white"
              }`}
            >
              Check-In
            </button>
            <button
              onClick={() => setView("queue")}
              className={`px-4 py-2 rounded-xl text-base font-medium border ${
                view === "queue" ? "bg-slate-900 text-white" : "bg-white"
              }`}
            >
              Queue
            </button>
            <button
              onClick={handleAdminToggle}
              className={`px-4 py-2 rounded-xl text-base font-medium border ${
                isAdmin ? "bg-emerald-600 text-white" : "bg-white"
              }`}
            >
              Admin
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl p-4">
        {view === "kiosk" ? (
          <section className="grid gap-6 md:grid-cols-2">
            {/* Check-In Form */}
            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Welcome! Please check in</h2>
              <form className="grid gap-4" onSubmit={onSubmit}>
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="nameOrNetId">
                    Name or NetID
                  </label>
                  <input
                    id="nameOrNetId"
                    className={`w-full rounded-xl border p-3 text-lg ${
                      errors.nameOrNetId ? "border-red-500" : "border-slate-300"
                    }`}
                    placeholder="e.g., jdoe123 or Jane Doe"
                    value={nameOrNetId}
                    onChange={(e) => setNameOrNetId(e.target.value)}
                  />
                  {errors.nameOrNetId && (
                    <p className="text-red-600 text-sm mt-1">{errors.nameOrNetId}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="emplid">
                    EMPLID (optional)
                  </label>
                  <input
                    id="emplid"
                    className={`w-full rounded-xl border p-3 text-lg ${
                      errors.emplid ? "border-red-500" : "border-slate-300"
                    }`}
                    placeholder="8-digit EMPLID or 'N/A'"
                    inputMode="numeric"
                    value={emplid}
                    onChange={(e) =>
                      setEmplid(e.target.value.replace(/[^0-9aA\/N]/g, "").slice(0, 8))
                    }
                  />
                  {errors.emplid && (
                    <p className="text-red-600 text-sm mt-1">{errors.emplid}</p>
                  )}
                </div>

                <div>
                  <span className="block text-sm font-medium mb-2">Role</span>
                  <div className="flex flex-wrap gap-2">
                    {ROLES.map((r) => (
                      <button
                        type="button"
                        key={r}
                        onClick={() => setRole(r)}
                        className={`px-4 py-2 rounded-xl border text-base ${
                          role === r ? "bg-slate-900 text-white" : "bg-white"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="purpose">
                    Purpose
                  </label>
                  <select
                    id="purpose"
                    className="w-full rounded-xl border border-slate-300 p-3 text-lg bg-white"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value as Purpose)}
                  >
                    {PURPOSES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="details">
                    Details (optional)
                  </label>
                  <textarea
                    id="details"
                    className="w-full rounded-xl border border-slate-300 p-3 text-lg min-h-[96px]"
                    placeholder="Short description helps us route you faster"
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                  />
                </div>

                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1 h-5 w-5"
                    checked={acceptPolicy}
                    onChange={(e) => setAcceptPolicy(e.target.checked)}
                  />
                  <span className="text-sm text-slate-700">
                    I acknowledge this information will be used to assist my request per Hunter IT
                    policies.
                  </span>
                </label>
                {errors.acceptPolicy && (
                  <p className="text-red-600 text-sm -mt-2">{errors.acceptPolicy}</p>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="flex-1 rounded-2xl bg-emerald-600 text-white text-lg font-semibold py-3"
                  >
                    Check In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNameOrNetId("");
                      setEmplid("");
                      setRole("Student");
                      setPurpose("Password reset");
                      setDetails("");
                      setAcceptPolicy(false);
                    }}
                    className="rounded-2xl border border-slate-300 bg-white px-5 text-lg"
                  >
                    Clear
                  </button>
                </div>
              </form>
            </div>

            {/* Queue preview */}
            <div className="bg-white rounded-2xl shadow p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-semibold">Live Queue</h2>
                <span className="text-sm text-slate-500">Newest first</span>
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
                    {e.details && (
                      <div className="text-sm text-slate-700 mt-1 line-clamp-2">{e.details}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : (
          <section className="bg-white rounded-2xl shadow p-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-semibold">Queue (Admin)</h2>
                <div className="ml-auto flex items-center gap-2">
                  <input
                    className="rounded-xl border border-slate-300 p-2 min-w-[220px]"
                    placeholder="Search name, EMPLID, purpose…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <button onClick={exportCSV} className="rounded-xl border px-4 py-2">
                    Export CSV
                  </button>
                  <button onClick={clearAll} className="rounded-xl border px-4 py-2">
                    Clear All
                  </button>
                </div>
              </div>

              <div className="overflow-auto -mx-2 px-2">
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
                            onClick={() => removeEntry(e.id)}
                            className="rounded-lg border px-3 py-1"
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
            </div>
          </section>
        )}
      </main>

      {pinPrompt && <PinModal onClose={() => setPinPrompt(false)} onSubmit={submitPin} />}

      <footer className="mx-auto max-w-5xl p-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} Hunter IT · Frontdesk Kiosk Prototype · Local-only demo
      </footer>
    </div>
  );
}

//