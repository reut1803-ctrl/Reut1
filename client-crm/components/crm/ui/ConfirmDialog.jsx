"use client";

import { AlertTriangle } from "lucide-react";
import Overlay from "@/components/crm/ui/Overlay";

export default function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <Overlay>

    <div className="fixed inset-0 z-[200] flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative w-full max-w-xs rounded-3xl bg-white p-5 text-center shadow-2xl">
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-red-50">
          <AlertTriangle size={20} className="text-[#C4584C]" />
        </div>
        <p className="mb-5 text-sm font-semibold text-[#5A4A3C]">{message}</p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 rounded-2xl border border-[#EADCCB] py-2.5 text-sm font-semibold text-[#5A4A3C]"
          >
            ביטול
          </button>
          <button onClick={onConfirm} className="flex-1 rounded-2xl bg-[#C4584C] py-2.5 text-sm font-semibold text-white">
            מחיקה
          </button>
        </div>
      </div>
    </div>
    </Overlay>
  );
}
