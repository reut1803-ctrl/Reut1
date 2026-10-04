"use client";

import { useRef } from "react";
import { X } from "lucide-react";
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
// שני הנספחים יושבים באותו חלון וגוללים יחד, ולכן הקישור "נספח 2 — מדיניות
// הפרטיות" שבסעיף המידע הוא קישור פנימי: הוא גולל את החלון עצמו אל חלק
// הפרטיות, בלי לצאת מהטופס ובלי לאבד את מה שכבר מולא.
//
// התוכן נבנה לפי המסלול שנבחר בטופס (chabad / כללי) דרך buildAgreementSections,
// ולכן דמי ההצלחה והסעיפים תמיד תואמים למה שמוצג בחלונית הסיכום.
export default function AgreementModal({ tag, onClose }) {
  const scrollRef = useRef(null);
  const privacyRef = useRef(null);

  const sections = buildAgreementSections(tag);

  const scrollToPrivacy = () => {
    const box = scrollRef.current;
    const target = privacyRef.current;
    if (!box || !target) return;
    box.scrollTo({ top: target.offsetTop - box.offsetTop - 8, behavior: "smooth" });
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-end justify-center sm:items-center" dir="rtl">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative flex max-h-[88dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#EAE5E3] px-5 py-4">
          <div>
            <p className="text-[15px] font-bold text-[#3A3335]">הסכם ההתקשרות</p>
            <p className="mt-0.5 text-[12px] text-[#8A8285]">חיבורים משמחים · רעות פריד והצוות</p>
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
          {/* ---------- נספח 1 ---------- */}
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
                        onClick={scrollToPrivacy}
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

          {/* ---------- נספח 2 ---------- */}
          <div ref={privacyRef} className="mt-8 border-t border-[#EAE5E3] pt-6">
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
          </div>
        </div>

        <div className="shrink-0 border-t border-[#EAE5E3] px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-2xl bg-[#8C4A55] py-3 text-[14px] font-semibold text-white transition active:scale-[0.98]"
          >
            סגירה
          </button>
        </div>
      </div>
    </div>
  );
}
