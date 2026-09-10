"use client";

import { Accessibility, MessageCircle, Check } from "lucide-react";
import { useEffect, useState } from "react";

// הכפתורים הצפים הוצמדו לשוליים הקיצוניים של המסך והם שקופים למחצה במנוחה,
// כדי שלא יסתירו כרטיסי מועמדים. מגע/מעבר עכבר או פתיחת תפריט הנגישות
// מחזירים אותם לאטימות מלאה.
export default function FabButtons() {
  const [accessibilityOpen, setAccessibilityOpen] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [awake, setAwake] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("a11y-large-text", largeText);
  }, [largeText]);

  useEffect(() => {
    document.documentElement.classList.toggle("a11y-high-contrast", highContrast);
  }, [highContrast]);

  const active = awake || accessibilityOpen;

  return (
    <div
      onPointerEnter={() => setAwake(true)}
      onPointerLeave={() => setAwake(false)}
      onTouchStart={() => setAwake(true)}
      className={`safe-bottom fixed bottom-28 left-0 z-20 flex flex-col items-start gap-2.5 transition-opacity duration-300 ${
        active ? "opacity-100" : "opacity-30"
      }`}
    >
      <button
        aria-label="פתיחת תפריט נגישות"
        onClick={() => {
          setAwake(true);
          setAccessibilityOpen((v) => !v);
        }}
        className="flex h-10 w-9 items-center justify-center rounded-l-none rounded-r-2xl bg-[#3A3335] pr-0.5 text-white shadow-lg transition active:scale-90"
      >
        <Accessibility size={19} />
      </button>
      <a
        href="https://wa.me/972543085242"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="פתיחת וואטסאפ"
        onClick={() => setAwake(true)}
        className="flex h-11 w-10 items-center justify-center rounded-l-none rounded-r-2xl bg-[#20A66B] pr-0.5 text-white shadow-[0_10px_25px_rgba(32,166,107,0.3)] transition active:scale-90"
      >
        <MessageCircle size={21} />
      </a>

      {accessibilityOpen && (
        <div className="absolute bottom-0 left-12 w-56 rounded-2xl border border-[#EAE5E3] bg-white p-3 text-sm shadow-xl">
          <p className="mb-2 font-semibold text-[#3A3335]">הגדרות נגישות</p>
          <button
            onClick={() => setLargeText((v) => !v)}
            className="mb-1.5 flex w-full items-center justify-between rounded-xl bg-[#F6F5F4] px-3 py-2 text-right text-[13px] hover:bg-[#EAE5E3]"
          >
            הגדלת טקסט
            {largeText && <Check size={14} className="text-[#20A66B]" />}
          </button>
          <button
            onClick={() => setHighContrast((v) => !v)}
            className="flex w-full items-center justify-between rounded-xl bg-[#F6F5F4] px-3 py-2 text-right text-[13px] hover:bg-[#EAE5E3]"
          >
            ניגודיות גבוהה
            {highContrast && <Check size={14} className="text-[#20A66B]" />}
          </button>
        </div>
      )}
    </div>
  );
}
