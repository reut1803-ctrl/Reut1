"use client";

// תצוגה מקדימה חיה של הטופס, מתוך לוח הבקרה.
//
// מציגה את הטיוטה שנערכת ברגע זה - לא את הגרסה השמורה. כך אפשר לראות
// שינוי לפני שמפרסמים אותו, במקום לשמור, לפתוח לשונית חדשה ולרענן.
//
// הציור נעשה ב-FormBody, אותו רכיב שמצייר את הטופס הציבורי עצמו, ולכן
// אין כאן "כמעט כמו" - זה בדיוק אותו מסך.

import { useEffect } from "react";
import { Eye, X } from "lucide-react";
import FormBody from "@/components/crm/register/FormBody";
import { APP_NAME, APP_SUBTITLE, LOGO_SRC } from "@/lib/appConfig";

export default function FormPreviewSheet({ content, dirty, onClose }) {
  // סגירה בכפתור "חזרה" של הטלפון, ונעילת הגלילה מאחור
  useEffect(() => {
    const onPop = () => onClose();
    window.history.pushState({ preview: true }, "");
    window.addEventListener("popstate", onPop);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("popstate", onPop);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-[#F2F8FB]" dir="rtl">
      <header className="safe-top flex items-center gap-2 border-b border-[#CFE3EC] bg-white px-4 py-3 shadow-sm">
        <Eye size={17} className="shrink-0 text-[#2E8BA8]" />
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-bold text-[#23414E]">תצוגה מקדימה</p>
          <p className="truncate text-[11px] text-[#5E7A87]">
            {dirty ? "כולל השינויים שטרם פורסמו" : "כפי שהטופס מפורסם כרגע"}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="סגירת התצוגה המקדימה"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F2F8FB] text-[#23414E] active:scale-90"
        >
          <X size={18} />
        </button>
      </header>

      <div className="safe-bottom flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto w-full max-w-lg">
          <p className="mb-4 rounded-2xl bg-[#DCEEF5] px-3.5 py-2.5 text-center text-[12px] leading-relaxed text-[#1F6E88]">
            כך המועמדים יראו את הטופס. אפשר למלא ולגלול בחופשיות —
            <strong> שום דבר כאן אינו נשלח ואינו נשמר.</strong>
          </p>

          <header className="mb-6 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO_SRC} alt={APP_NAME} className="mx-auto mb-3 w-48 max-w-[65%] object-contain" />
            <p className="text-[14px] font-semibold text-[#1F6E88]">{APP_SUBTITLE}</p>
          </header>

          <FormBody content={content} preview />

          <p className="mt-6 text-center text-[11px] text-[#5E7A87]">
            {APP_NAME} · {APP_SUBTITLE}
          </p>
        </div>
      </div>
    </div>
  );
}
