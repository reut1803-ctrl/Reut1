"use client";

import { useEffect, useRef, useState } from "react";
import { Lightbulb, Plus, X, Check, ChevronRight, ChevronLeft } from "lucide-react";
import { useCrmStore } from "@/lib/crm/store";

export default function TipsCarousel() {
  const role = useCrmStore((s) => s.role);
  const tips = useCrmStore((s) => s.tips);
  const addTip = useCrmStore((s) => s.addTip);
  const removeTip = useCrmStore((s) => s.removeTip);
  const showToast = useCrmStore((s) => s.showToast);
  const [showAdd, setShowAdd] = useState(false);
  const [draft, setDraft] = useState("");
  const [active, setActive] = useState(0);
  const trackRef = useRef(null);

  const isAdmin = role === "admin";

  // מיקום הטיפ הנוכחי נקבע לפי הגלילה בפועל. הערך המוחלט נדרש כי בכיווניות ימין-לשמאל
  // הדפדפן מחזיר גלילה שלילית, ובלעדיו הנקודות לא היו מסתנכרנות עם ההחלקה.
  const syncActive = () => {
    const el = trackRef.current;
    if (!el || el.clientWidth === 0) return;
    setActive(Math.round(Math.abs(el.scrollLeft) / el.clientWidth));
  };

  // אם נמחק טיפ בזמן שצופים בו, חוזרים לטיפ תקין במקום להישאר על מיקום ריק
  useEffect(() => {
    if (active > tips.length - 1) {
      setActive(Math.max(0, tips.length - 1));
      trackRef.current?.scrollTo({ left: 0 });
    }
  }, [tips.length, active]);

  if (tips.length === 0 && !isAdmin) return null;

  const goTo = (index) => {
    const el = trackRef.current;
    if (!el) return;
    const target = el.children[index];
    if (target) target.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  };

  const handleAdd = async () => {
    if (!draft.trim()) return;
    await addTip(draft);
    setDraft("");
    setShowAdd(false);
    showToast("הטיפ נוסף בהצלחה");
  };

  const multiple = tips.length > 1;

  return (
    <div className="mb-4 rounded-2xl border border-[#F0DFA0] bg-[#FFF8E7] p-3.5">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Lightbulb size={16} className="text-[#946200]" />
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#946200]">
            טיפ בשידוכים{multiple ? ` (${active + 1}/${tips.length})` : ""}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowAdd((v) => !v)}
            aria-label="הוספת טיפ"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#946200] text-white transition active:scale-90"
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
            className="flex-1 rounded-xl border border-[#F0DFA0] bg-white px-2.5 py-1.5 text-[12px] outline-none focus:border-[#946200]"
          />
          <button
            onClick={handleAdd}
            aria-label="שמירת טיפ"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#946200] text-white"
          >
            <Check size={14} />
          </button>
        </div>
      )}

      {tips.length === 0 ? (
        <p className="text-[13px] text-[#8A8285]">אין עדיין טיפים</p>
      ) : (
        <div className="flex items-center gap-1">
          {multiple && (
            <button
              onClick={() => goTo(Math.max(0, active - 1))}
              disabled={active === 0}
              aria-label="לטיפ הקודם"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#946200] transition active:scale-90 disabled:opacity-25"
            >
              <ChevronRight size={18} />
            </button>
          )}

          <div
            ref={trackRef}
            onScroll={syncActive}
            className="flex flex-1 snap-x snap-mandatory overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden"
          >
            {tips.map((tip, i) => (
              <div key={i} className="relative w-full shrink-0 snap-center px-0.5">
                <p className="pl-5 text-[13px] leading-relaxed text-[#3A3335]">{tip}</p>
                {isAdmin && (
                  <button
                    onClick={() => removeTip(i)}
                    aria-label="מחיקת טיפ"
                    className="absolute left-0 top-0 rounded-full p-0.5 text-[#B5AEB0] hover:text-[#C24545]"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {multiple && (
            <button
              onClick={() => goTo(Math.min(tips.length - 1, active + 1))}
              disabled={active === tips.length - 1}
              aria-label="לטיפ הבא"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#946200] transition active:scale-90 disabled:opacity-25"
            >
              <ChevronLeft size={18} />
            </button>
          )}
        </div>
      )}

      {multiple && (
        <div className="mt-2.5 flex items-center justify-center gap-1.5">
          {tips.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`מעבר לטיפ ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === active ? "w-4 bg-[#946200]" : "w-1.5 bg-[#E0CE94]"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
