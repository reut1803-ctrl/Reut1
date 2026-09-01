"use client";

import { AlertTriangle } from "lucide-react";

// confirmLabel / tone הם תוספת אופציונלית בלבד. בלעדיהם הדיאלוג נשאר
// בדיוק כפי שהיה - אזהרת מחיקה אדומה - וכל השימושים הקיימים לא משתנים.
export default function ConfirmDialog({ message, onConfirm, onCancel, confirmLabel = "מחיקה", tone = "danger" }) {
  const confirmClass = tone === "danger" ? "bg-[#C24545]" : "bg-[#844442]";
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative w-full max-w-xs rounded-3xl bg-white p-5 text-center shadow-2xl">
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-red-50">
          <AlertTriangle size={20} className="text-[#C24545]" />
        </div>
        <p className="mb-5 text-sm font-semibold text-[#3A2E26]">{message}</p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 rounded-2xl border border-[#CCBDAB] py-2.5 text-sm font-semibold text-[#3A2E26]"
          >
            ביטול
          </button>
          <button onClick={onConfirm} className={`flex-1 rounded-2xl ${confirmClass} py-2.5 text-sm font-semibold text-white`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
