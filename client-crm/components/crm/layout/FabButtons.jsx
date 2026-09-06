"use client";

import { Accessibility, MessageCircle, Check } from "lucide-react";
import { useEffect, useState } from "react";

export default function FabButtons() {
  const [accessibilityOpen, setAccessibilityOpen] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("a11y-large-text", largeText);
  }, [largeText]);

  useEffect(() => {
    document.documentElement.classList.toggle("a11y-high-contrast", highContrast);
  }, [highContrast]);

  return (
    <div className="safe-bottom fixed bottom-28 left-4 z-20 flex flex-col items-center gap-3">
      <button
        aria-label="פתיחת תפריט נגישות"
        onClick={() => setAccessibilityOpen((v) => !v)}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-[#5A4A3C] text-white shadow-lg transition active:scale-90"
      >
        <Accessibility size={22} />
      </button>
      <a
        href="https://wa.me/972543085242"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="פתיחת וואטסאפ"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#8C9A78] text-white shadow-[0_10px_25px_rgba(32,166,107,0.4)] transition active:scale-90"
      >
        <MessageCircle size={26} />
      </a>

      {accessibilityOpen && (
        <div className="absolute bottom-0 left-16 w-56 rounded-2xl border border-[#EADCCB] bg-white p-3 text-sm shadow-xl">
          <p className="mb-2 font-semibold text-[#5A4A3C]">הגדרות נגישות</p>
          <button
            onClick={() => setLargeText((v) => !v)}
            className="mb-1.5 flex w-full items-center justify-between rounded-xl bg-[#FBF3EA] px-3 py-2 text-right text-[13px] hover:bg-[#EADCCB]"
          >
            הגדלת טקסט
            {largeText && <Check size={14} className="text-[#8C9A78]" />}
          </button>
          <button
            onClick={() => setHighContrast((v) => !v)}
            className="flex w-full items-center justify-between rounded-xl bg-[#FBF3EA] px-3 py-2 text-right text-[13px] hover:bg-[#EADCCB]"
          >
            ניגודיות גבוהה
            {highContrast && <Check size={14} className="text-[#8C9A78]" />}
          </button>
        </div>
      )}
    </div>
  );
}
