"use client";

import { Accessibility, MessageCircle, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { SUPPORT_WHATSAPP } from "@/lib/appConfig";

// הכפתורים הצפים מוצמדים לשפה השמאלית של המסך ולא מרחפים מעל התוכן.
// הם חצי-שקופים במנוחה וחוזרים לאטימות מלאה במגע, במעבר עכבר או בפוקוס
// מקלדת - כך הם זמינים תמיד בלי להעמיס על העין ובלי לדחוס את העמוד.
const FAB_BASE =
  "safe-bottom fixed left-0 z-20 flex items-center justify-center rounded-l-none rounded-r-full text-white shadow-lg " +
  "opacity-55 transition hover:opacity-100 focus-visible:opacity-100 active:opacity-100 active:scale-95 " +
  "motion-reduce:transition-none";

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
    <>
      <button
        aria-label="פתיחת תפריט נגישות"
        aria-expanded={accessibilityOpen}
        onClick={() => setAccessibilityOpen((v) => !v)}
        // כשהתפריט פתוח הכפתור אטום, אחרת הוא נראה מנותק מהחלונית שנפתחה ממנו
        className={`${FAB_BASE} bottom-[9.25rem] h-11 w-11 bg-[#23414E] ${accessibilityOpen ? "opacity-100" : ""}`}
      >
        <Accessibility size={20} />
      </button>

      {SUPPORT_WHATSAPP && (
        <a
          href={`https://wa.me/${SUPPORT_WHATSAPP}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="פנייה בוואטסאפ"
          className={`${FAB_BASE} bottom-24 h-11 w-11 bg-[#2FA39B]`}
        >
          <MessageCircle size={20} />
        </a>
      )}

      {accessibilityOpen && (
        <>
          {/* לחיצה מחוץ לחלונית סוגרת אותה, כדי שלא תישאר תקועה על המסך */}
          <div className="fixed inset-0 z-20" onClick={() => setAccessibilityOpen(false)} />
          <div className="safe-bottom fixed bottom-[9.25rem] left-14 z-30 w-56 rounded-2xl border border-[#CFE3EC] bg-white p-3 text-sm shadow-xl">
            <p className="mb-2 font-semibold text-[#23414E]">הגדרות נגישות</p>
            <button
              onClick={() => setLargeText((v) => !v)}
              className="mb-1.5 flex w-full items-center justify-between rounded-xl bg-[#F2F8FB] px-3 py-2 text-right text-[13px] hover:bg-[#CFE3EC]"
            >
              הגדלת טקסט
              {largeText && <Check size={14} className="text-[#2FA39B]" />}
            </button>
            <button
              onClick={() => setHighContrast((v) => !v)}
              className="flex w-full items-center justify-between rounded-xl bg-[#F2F8FB] px-3 py-2 text-right text-[13px] hover:bg-[#CFE3EC]"
            >
              ניגודיות גבוהה
              {highContrast && <Check size={14} className="text-[#2FA39B]" />}
            </button>
          </div>
        </>
      )}
    </>
  );
}
