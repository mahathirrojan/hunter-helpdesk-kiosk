"use client";

import React, { useState } from "react";
import type { Purpose, Role } from "./useLocalQueue";

const HUNTER_PURPLE = "#5F259F";

const PURPOSES: Purpose[] = [
  "Password reset",
  "NetID",
  "CunyFirst",
  "CUNY MFA / Outlook MFA",
  "Wi-Fi / HunterSecure",
  "Printing / PaperCut",
  "BrightSpace",
  "Email / Outlook",
  "Hardware (laptop/desktop)",
  "Software install/access",
  "Loaner pickup/return",
  "General question",
  "Other",
];

const ROLES: Role[] = ["Student", "Faculty", "Staff"];

type Props = {
  onSubmit: (data: {
    nameOrNetId: string;
    emplid: string; // "N/A" or 8 digits
    role: Role;
    purpose: Purpose;
    details?: string;
  }) => void;
};

export default function KioskForm({ onSubmit }: Props) {
  const [nameOrNetId, setNameOrNetId] = useState("");
  const [emplid, setEmplid] = useState(""); // empty allowed; will normalize to "N/A"
  const [role, setRole] = useState<Role>("Student");
  const [purpose, setPurpose] = useState<Purpose>("Password reset");
  const [details, setDetails] = useState("");
  const [acceptPolicy, setAcceptPolicy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!nameOrNetId.trim()) e.nameOrNetId = "Required";
    const em = emplid.trim();
    if (em && em.toLowerCase() !== "n/a" && !/^\d{8}$/.test(em)) {
      e.emplid = "Must be 8 digits or 'N/A'";
    }
    if (!acceptPolicy) e.acceptPolicy = "Please acknowledge";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;

    let normalized = "N/A";
    if (/^\d{8}$/.test(emplid.trim())) normalized = emplid.trim();
    // empty stays as "N/A"

    onSubmit({
      nameOrNetId: nameOrNetId.trim(),
      emplid: normalized,
      role,
      purpose,
      details: details.trim() || undefined,
    });

    // reset
    setNameOrNetId("");
    setEmplid("");
    setRole("Student");
    setPurpose("Password reset");
    setDetails("");
    setAcceptPolicy(false);
    try { (navigator as any).vibrate?.(30); } catch {}
  }

  return (
    <div className="rounded-2xl shadow p-6 bg-white">
      <h2 className="text-xl font-semibold mb-4">Welcome! Please check in</h2>
      <form className="grid gap-4" onSubmit={handleSubmit}>
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
            autoComplete="off"
          />
          {errors.nameOrNetId && (
            <p className="text-red-600 text-sm mt-1">{errors.nameOrNetId}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="emplid">
            EMPLID (optional)
          </label>
          <div className="flex gap-2">
            <input
              id="emplid"
              className={`w-full rounded-xl border p-3 text-lg ${
                errors.emplid ? "border-red-500" : "border-slate-300"
              }`}
              placeholder="8-digit EMPLID or 'N/A'"
              inputMode="numeric"   // fast numeric keypad on iPad
              value={emplid}
              onChange={(e) => {
                const v = e.target.value;
                // For kiosk: keep only digits, cap to 8
                const digits = v.replace(/[^0-9]/g, "").slice(0, 8);
                setEmplid(digits);
              }}
              autoComplete="off"
            />
            <button
              type="button"
              className="shrink-0 rounded-xl px-3 text-sm font-medium border"
              style={{ borderColor: HUNTER_PURPLE, color: HUNTER_PURPLE }}
              onClick={() => setEmplid("N/A")}
              title="Set EMPLID to N/A"
            >
              N/A
            </button>
          </div>
          {errors.emplid && <p className="text-red-600 text-sm mt-1">{errors.emplid}</p>}
        </div>

        <div>
          <span className="block text-sm font-medium mb-2">Role</span>
          <div className="flex flex-wrap gap-2">
            {ROLES.map((r) => (
              <button
                type="button"
                key={r}
                onClick={() => setRole(r)}
                className="px-4 py-2 rounded-xl border text-base transition"
                style={{
                  borderColor: role === r ? HUNTER_PURPLE : "#e5e7eb",
                  backgroundColor: role === r ? HUNTER_PURPLE : "white",
                  color: role === r ? "white" : "#111827",
                }}
                aria-pressed={role === r}
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
            style={{ accentColor: HUNTER_PURPLE }}
            checked={acceptPolicy}
            onChange={(e) => setAcceptPolicy(e.target.checked)}
          />
          <span className="text-sm text-slate-700">
            I acknowledge this information will be used to assist my request per Hunter IT policies.
          </span>
        </label>
        {errors.acceptPolicy && (
          <p className="text-red-600 text-sm -mt-2">{errors.acceptPolicy}</p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="flex-1 rounded-2xl text-white text-lg font-semibold py-3 shadow"
            style={{ backgroundColor: HUNTER_PURPLE }}
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
            className="rounded-2xl border bg-white px-5 text-lg"
            style={{ borderColor: HUNTER_PURPLE, color: HUNTER_PURPLE }}
          >
            Clear
          </button>
        </div>
      </form>
    </div>
  );
}