"use client";

import { AlertTriangle, HelpCircle } from "lucide-react";
import Overlay from "@/components/crm/ui/Overlay";

// חלון אישור.
//
// ברירת המחדל היא פעולה הרסנית: אייקון אזהרה אדום וכפתור "מחיקה" - בדיוק
// כפי שהיה עד היום, כדי שכל מי שקורא לחלון הזה ימשיך לקבל את אותו מסך.
// אבל לא כל אישור הוא מחיקה: שחרור שיוך, למשל, אינו מוחק דבר. לכן אפשר
// להעביר כיתוב ואופי אחרים, כדי שהחלון לא יזהיר מפני משהו שאינו קורה.
export default function ConfirmDialog({ message, onConfirm, onCancel, confirmLabel = "מחיקה", tone = "danger" }) {
  const danger = tone !== "neutral";
  const Icon = danger ? AlertTriangle : HelpCircle;

  return (
    <Overlay>
      <div className="fixed inset-0 z-[200] flex items-center justify-center px-6">
        <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
        <div className="relative w-full max-w-xs rounded-3xl bg-white p-5 text-center shadow-2xl">
          <div
            className={`mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full ${
              danger ? "bg-red-50" : "bg-[#F6E4E6]"
            }`}
          >
            <Icon size={20} className={danger ? "text-[#C24545]" : "text-[#8C4A55]"} />
          </div>
          <p className="mb-5 text-sm font-semibold text-[#3A3335]">{message}</p>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="flex-1 rounded-2xl border border-[#EAE5E3] py-2.5 text-sm font-semibold text-[#3A3335]"
            >
              ביטול
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 rounded-2xl py-2.5 text-sm font-semibold text-white ${
                danger ? "bg-[#C24545]" : "bg-[#8C4A55]"
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
