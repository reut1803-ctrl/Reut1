"use client";

import { Accessibility, MessageCircle, Check, HelpCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCrmStore } from "@/lib/crm/store";

export default function FabButtons() {
  const [accessibilityOpen, setAccessibilityOpen] = useState(false);
  // הכפתורים הצפים דוהים בזמן גלילה וחוזרים כשעוצרים, וגם במנוחה הם
  // חצי-שקופים - כדי שלא ישתלטו על המסך ולא יסתירו תוכן.
  const [scrolling, setScrolling] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const role = useCrmStore((s) => s.role);
  const requestTour = useCrmStore((s) => s.requestTour);
  const router = useRouter();
  const pathname = usePathname();

  // הסיור מתחיל תמיד ממסך המאגר, כי שם נמצאות רוב התחנות.
  // אם לוחצים עליו ממסך אחר, עוברים קודם למאגר ורק אז מפעילים.
  const handleTour = () => {
    if (pathname !== "/crm" && pathname !== "/crm/") {
      router.push("/crm");
      setTimeout(requestTour, 600);
      return;
    }
    requestTour();
  };

  useEffect(() => {
    let timer = null;
    const onScroll = () => {
      setScrolling(true);
      clearTimeout(timer);
      timer = setTimeout(() => setScrolling(false), 700);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("a11y-large-text", largeText);
  }, [largeText]);

  useEffect(() => {
    document.documentElement.classList.toggle("a11y-high-contrast", highContrast);
  }, [highContrast]);

  // תפריט הנגישות פתוח = לא מעמעמים, כדי שאפשר יהיה לקרוא אותו בנוחות
  const fade = accessibilityOpen ? "opacity-100" : scrolling ? "opacity-25" : "opacity-60";

  return (
    <div
      className={`safe-bottom fixed bottom-28 left-4 z-30 flex flex-col items-center gap-3 transition-opacity duration-300 hover:opacity-100 focus-within:opacity-100 ${fade}`}
    >
      {(role === "staff" || role === "admin") && (
        <button
          aria-label="הפעלת סיור הדרכה"
          onClick={handleTour}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-[#844442] text-white shadow-md transition active:scale-90 active:opacity-100"
        >
          <HelpCircle size={20} />
        </button>
      )}
      <button
        aria-label="פתיחת תפריט נגישות"
        onClick={() => setAccessibilityOpen((v) => !v)}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-[#3A2E26] text-white shadow-md transition active:scale-90 active:opacity-100"
      >
        <Accessibility size={20} />
      </button>
      <a
        href="https://wa.me/972543085242"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="פתיחת וואטסאפ"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-[#62826B] text-white shadow-md transition active:scale-90 active:opacity-100"
      >
        <MessageCircle size={22} />
      </a>

      {accessibilityOpen && (
        <div className="absolute bottom-0 left-16 w-56 rounded-2xl border border-[#CCBDAB] bg-white p-3 text-sm shadow-xl">
          <p className="mb-2 font-semibold text-[#3A2E26]">הגדרות נגישות</p>
          <button
            onClick={() => setLargeText((v) => !v)}
            className="mb-1.5 flex w-full items-center justify-between rounded-xl bg-[#E8DCCB] px-3 py-2 text-right text-[13px] hover:bg-[#CCBDAB]"
          >
            הגדלת טקסט
            {largeText && <Check size={14} className="text-[#62826B]" />}
          </button>
          <button
            onClick={() => setHighContrast((v) => !v)}
            className="flex w-full items-center justify-between rounded-xl bg-[#E8DCCB] px-3 py-2 text-right text-[13px] hover:bg-[#CCBDAB]"
          >
            ניגודיות גבוהה
            {highContrast && <Check size={14} className="text-[#62826B]" />}
          </button>
        </div>
      )}
    </div>
  );
}
