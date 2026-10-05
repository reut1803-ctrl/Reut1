"use client";

import { useRef, useState } from "react";
import { ArrowRight, X } from "lucide-react";
import {
  buildAgreementSections,
  PRIVACY_SECTIONS,
  AGREEMENT_TITLE,
  AGREEMENT_SUBTITLE,
  PRIVACY_TITLE,
  PRIVACY_SUBTITLE,
} from "@/lib/crm/agreement";

// חלון הסכם ההתקשרות ומדיניות הפרטיות, בטופס ההרשמה החיצוני.
//
// שני מסכים ולא גלילה אחת ארוכה: החלון נפתח תמיד על ההסכם (נספח 1) בלבד.
// הקישור שבסעיף "המידע שאתם מוסרים" מחליף את התצוגה למדיניות הפרטיות
// (נספח 2), וממנה יש כפתור חזרה ברור - למעלה ולמטה - חזרה להסכם.
// כך אין עומס, ואף אחד לא מגלגל טקסט שלא ביקש לקרוא.
//
// התוכן נבנה לפי המסלול שנבחר בטופס: הערך מגיע כ-tag מהטופס עצמו
// (form.tag), ו-buildAgreementSections מחליטה לפיו אילו סעיפים להציג
// ואיזה סכום דמי הצלחה להזריק. במסלול חב"ד סעיף "המסלול האישי" אינו
// מרונדר כלל, ודמי ההצלחה הם 4,000 ₪; בכל שאר המסלולים הוא מוצג
// ודמי ההצלחה הם 2,500 ₪ - בדיוק כמו בחלונית הסיכום שבטופס.
export default function AgreementModal({ tag, onClose }) {
  const [view, setView] = useState("agreement");
  const scrollRef = useRef(null);

  const sections = buildAgreementSections(tag);
  const onPrivacy = view === "privacy";

  // מעבר בין המסכים מחזיר את הגלילה להתחלה, אחרת המסך החדש נפתח באמצע
  const goTo = (next) => {
    setView(next);
    scrollRef.current?.scrollTo({ top: 0 });
  };

  const backButton = (
    <button
      type="button"
      onClick={() => goTo("agreement")}
      className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-[#8C4A55] bg-white py-2.5 text-[13px] font-semibold text-[#8C4A55] transition active:scale-[0.98]"
    >
      <ArrowRight size={15} /> חזרה להסכם ההתקשרות
    </button>
  );

  return (
    <div className="fixed inset-0 z-[300] flex items-end justify-center sm:items-center" dir="rtl">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative flex max-h-[88dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#EAE5E3] px-5 py-4">
          <div className="flex min-w-0 items-center gap-2">
            {onPrivacy && (
              <button
                type="button"
                onClick={() => goTo("agreement")}
                aria-label="חזרה להסכם ההתקשרות"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F6E4E6] text-[#8C4A55] transition active:scale-90"
              >
                <ArrowRight size={16} />
              </button>
            )}
            <div className="min-w-0">
              <p className="truncate text-[15px] font-bold text-[#3A3335]">
                {onPrivacy ? "מדיניות הפרטיות" : "הסכם ההתקשרות"}
              </p>
              <p className="mt-0.5 truncate text-[12px] text-[#8A8285]">
                {onPrivacy ? PRIVACY_SUBTITLE : AGREEMENT_SUBTITLE}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="סגירה"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F6F5F4] text-[#8A8285] transition active:scale-90"
          >
            <X size={18} />
          </button>
        </div>

        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">
          {onPrivacy ? (
            /* ---------- מסך נספח 2 ---------- */
            <>
              <div className="mb-4">{backButton}</div>

              <h2 className="text-[16px] font-bold text-[#8C4A55]">{PRIVACY_TITLE}</h2>
              <p className="mt-0.5 text-[12px] text-[#8A8285]">{PRIVACY_SUBTITLE}</p>

              <ol className="mt-4 space-y-4">
                {PRIVACY_SECTIONS.map((s, i) => (
                  <li key={s.id}>
                    <h3 className="text-[14px] font-bold text-[#3A3335]">
                      {i + 1}. {s.title}
                    </h3>
                    <p className="mt-1 text-[13px] leading-relaxed text-[#5C5457]">{s.body}</p>
                  </li>
                ))}
              </ol>

              <div className="mt-6">{backButton}</div>
            </>
          ) : (
            /* ---------- מסך נספח 1 ---------- */
            <>
              <h2 className="text-[16px] font-bold text-[#8C4A55]">{AGREEMENT_TITLE}</h2>
              <p className="mt-0.5 text-[12px] text-[#8A8285]">{AGREEMENT_SUBTITLE}</p>

              <ol className="mt-4 space-y-4">
                {sections.map((s, i) => (
                  <li key={s.id}>
                    <h3 className="text-[14px] font-bold text-[#3A3335]">
                      {i + 1}. {s.title}
                    </h3>
                    <p className="mt-1 text-[13px] leading-relaxed text-[#5C5457]">
                      {s.body}
                      {s.linkToPrivacy && (
                        <>
                          <button
                            type="button"
                            onClick={() => goTo("privacy")}
                            className="font-semibold text-[#8C4A55] underline underline-offset-2"
                          >
                            {PRIVACY_TITLE}
                          </button>
                          {s.bodyAfterLink}
                        </>
                      )}
                    </p>
                  </li>
                ))}
              </ol>
            </>
          )}
        </div>

        <div className="shrink-0 border-t border-[#EAE5E3] px-5 py-3">
          {onPrivacy ? (
            backButton
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-2xl bg-[#8C4A55] py-3 text-[14px] font-semibold text-white transition active:scale-[0.98]"
            >
              סגירה
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
