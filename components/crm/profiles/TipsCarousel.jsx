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
    <div className="mb-4 rounded-2xl border border-[#E0C478] bg-[#F7E9C8] p-3.5">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Lightbulb size={16} className="text-[#7A5A08]" />
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#7A5A08]">טיפ בשידוכים</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowAdd((v) => !v)}
            aria-label="הוספת טיפ"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#7A5A08] text-white transition active:scale-90"
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
            className="flex-1 rounded-xl border border-[#E0C478] bg-white px-2.5 py-1.5 text-[12px] outline-none focus:border-[#7A5A08]"
          />
          <button
            onClick={handleAdd}
            aria-label="שמירת טיפ"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#7A5A08] text-white"
          >
            <Check size={14} />
          </button>
        </div>
      )}

      {tips.length === 0 ? (
        <p className="text-[13px] text-[#7A6A55]">אין עדיין טיפים</p>
      ) : (
        <div className="-mx-0.5 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-0.5 pb-1 [&::-webkit-scrollbar]:hidden">
          {tips.map((tip, i) => (
            <div key={i} className="relative w-full shrink-0 snap-center">
              <p className="pl-5 text-[13px] leading-relaxed text-[#2E2116]">{tip}</p>
              {isAdmin && (
                <button
                  onClick={() => removeTip(i)}
                  aria-label="מחיקת טיפ"
                  className="absolute left-0 top-0 rounded-full p-0.5 text-[#A08D74] hover:text-[#C24545]"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {tips.length > 1 && (
        <p className="mt-1.5 text-center text-[10px] text-[#A08D74]">החליקו לצדדים לעוד טיפים ({tips.length})</p>
      )}
    </div>
  );
}
