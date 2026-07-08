"use client";

import { Accessibility, MessageCircle } from "lucide-react";
import { useState } from "react";

export default function FabButtons() {
  const [accessibilityOpen, setAccessibilityOpen] = useState(false);

  return (
    <div className="fixed bottom-20 left-4 z-30 flex flex-col items-center gap-3">
      <button
        aria-label="פתיחת תפריט נגישות"
        onClick={() => setAccessibilityOpen((v) => !v)}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-[#3A3335] text-white shadow-lg transition active:scale-90"
      >
        <Accessibility size={22} />
      </button>
      <a
        href="https://wa.me/972500000000"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="פתיחת וואטסאפ"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#20A66B] text-white shadow-[0_10px_25px_rgba(32,166,107,0.4)] transition active:scale-90"
      >
        <MessageCircle size={26} />
      </a>

      {accessibilityOpen && (
        <div className="absolute bottom-0 right-16 w-56 rounded-2xl border border-[#EAE5E3] bg-white p-3 text-sm shadow-xl">
          <p className="mb-2 font-semibold text-[#3A3335]">הגדרות נגישות</p>
          <button
            onClick={() => document.documentElement.classList.toggle("text-lg")}
            className="mb-1.5 w-full rounded-xl bg-[#F6F5F4] px-3 py-2 text-right text-[13px] hover:bg-[#EAE5E3]"
          >
            הגדלת טקסט
          </button>
          <button
            onClick={() => document.documentElement.classList.toggle("contrast-125")}
            className="w-full rounded-xl bg-[#F6F5F4] px-3 py-2 text-right text-[13px] hover:bg-[#EAE5E3]"
          >
            ניגודיות גבוהה
          </button>
        </div>
      )}
    </div>
  );
}
