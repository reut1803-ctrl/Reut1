"use client";

import { useState } from "react";
import { Lightbulb, Plus, X, Check } from "lucide-react";
import { useCrmStore } from "@/lib/crm/store";

export default function TipsCarousel() {
  const role = useCrmStore((s) => s.role);
  const tips = useCrmStore((s) => s.tips);
  const addTip = useCrmStore((s) => s.addTip);
  const removeTip = useCrmStore((s) => s.removeTip);
  const showToast = useCrmStore((s) => s.showToast);
  const [showAdd, setShowAdd] = useState(false);
  const [draft, setDraft] = useState("");

  const isAdmin = role === "admin";
  if (tips.length === 0 && !isAdmin) return null;

  const handleAdd = async () => {
    if (!draft.trim()) return;
    await addTip(draft);
    setDraft("");
    setShowAdd(false);
    showToast("הטיפ נוסף בהצלחה");
  };

  return (
    <div className="mb-4 rounded-2xl border border-[#EBD79A] bg-[#FDF6E3] p-3.5">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Lightbulb size={16} className="text-[#8A6A12]" />
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#8A6A12]">טיפ בשידוכים</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowAdd((v) => !v)}
            aria-label="הוספת טיפ"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#8A6A12] text-white transition active:scale-90"
          >
            <Plus size={14} />
          </button>
        )}
      </div>

      {showAdd && (
        <div className="mb-3 flex gap-1.5">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="טיפ חדש..."
            autoFocus
            className="flex-1 rounded-xl border border-[#EBD79A] bg-white px-2.5 py-1.5 text-[12px] outline-none focus:border-[#8A6A12]"
          />
          <button
            onClick={handleAdd}
            aria-label="שמירת טיפ"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#8A6A12] text-white"
          >
            <Check size={14} />
          </button>
        </div>
      )}

      {tips.length === 0 ? (
        <p className="text-[13px] text-[#8B8175]">אין עדיין טיפים</p>
      ) : (
        <div className="-mx-0.5 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-0.5 pb-1 [&::-webkit-scrollbar]:hidden">
          {tips.map((tip, i) => (
            <div key={i} className="relative w-full shrink-0 snap-center">
              <p className="pl-5 text-[13px] leading-relaxed text-[#3B332A]">{tip}</p>
              {isAdmin && (
                <button
                  onClick={() => removeTip(i)}
                  aria-label="מחיקת טיפ"
                  className="absolute left-0 top-0 rounded-full p-0.5 text-[#B4AA9C] hover:text-[#C24545]"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {tips.length > 1 && (
        <p className="mt-1.5 text-center text-[10px] text-[#B4AA9C]">החליקו לצדדים לעוד טיפים ({tips.length})</p>
      )}
    </div>
  );
}
