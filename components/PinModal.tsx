"use client";

import React, { useEffect, useState } from "react";

type Props = {
  onClose: () => void;
  onSubmit: (pin: string) => void;
  primaryColor?: string;
};

export default function PinModal({ onClose, onSubmit, primaryColor = "#5F259F" }: Props) {
  const [pin, setPin] = useState("");

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold mb-2">Admin PIN</h3>
        <p className="text-sm text-slate-600 mb-4">Enter the 4-digit PIN to access admin tools.</p>
        <input
          className="w-full rounded-xl border border-slate-300 p-3 text-xl tracking-widest text-center"
          inputMode="numeric"
          maxLength={6}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ""))}
          autoFocus
        />
        <div className="mt-4 flex gap-2">
          <button className="flex-1 rounded-xl border px-4 py-2" onClick={onClose}>Cancel</button>
          <button
            className="flex-1 rounded-xl text-white px-4 py-2"
            style={{ backgroundColor: primaryColor }}
            onClick={() => onSubmit(pin)}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}