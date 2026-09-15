"use client";

import { AlertTriangle, History } from "lucide-react";
import Overlay from "@/components/crm/ui/Overlay";

// חלון אישור.
//
// ברירת המחדל היא פעולה הרסנית: אייקון אזהרה אדום וכפתור "מחיקה".
// אבל לא כל אישור הוא מחיקה - שחזור גרסה, למשל, אינו מוחק דבר. לכן
// אפשר להעביר כיתוב ואופי אחרים, כדי שהחלון לא יזהיר מפני משהו שאינו
// קורה ולא יבהיל שלא לצורך.
export default function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
  confirmLabel = "מחיקה",
  tone = "danger",
}) {
  const danger = tone !== "neutral";
  const Icon = danger ? AlertTriangle : History;

  return (
    <Overlay>
      <div className="fixed inset-0 z-[200] flex items-center justify-center px-6">
        <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
        <div className="relative w-full max-w-xs rounded-3xl bg-white p-5 text-center shadow-2xl">
          <div
            className={`mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full ${
              danger ? "bg-red-50" : "bg-[#EAF5FA]"
            }`}
          >
            <Icon size={20} className={danger ? "text-[#C4584C]" : "text-[#2E8BA8]"} />
          </div>
          <p className="mb-5 text-sm font-semibold leading-relaxed text-[#23414E]">{message}</p>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="flex-1 rounded-2xl border border-[#CFE3EC] py-2.5 text-sm font-semibold text-[#23414E]"
            >
              ביטול
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 rounded-2xl py-2.5 text-sm font-semibold text-white ${
                danger ? "bg-[#C4584C]" : "bg-[#2E8BA8]"
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </Overlay>
  );
}
