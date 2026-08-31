"use client";

// כרטיס הקישור לטופס ההרשמה החיצוני, ובתוכו גם מצב מפתח החיפוש.
//
// מפתח החיפוש (nameIndex) הוא מה שמאפשר למי שכבר במאגר למצוא את עצמו/ה
// בטופס ולעדכן סטטוס. הוא נבנה אוטומטית בכניסת המנהלת, ואם כללי האבטחה
// טרם פורסמו - הבנייה נחסמת. חוק "כישלון גלוי": במקרה כזה מוצגת כאן
// הודעה אדומה מפורשת, ולא כישלון שקט.

import { useEffect, useState } from "react";
import { Link2, Copy, Check, ExternalLink, AlertTriangle } from "lucide-react";
import { useCrmStore } from "@/lib/crm/store";
import { writeToClipboard } from "@/components/crm/ui/CopyStaffButton";

export default function RegisterLinkCard() {
  const candidatesLoaded = useCrmStore((s) => s.candidatesLoaded);
  const backfillNameIndex = useCrmStore((s) => s.backfillNameIndex);
  const nameIndexState = useCrmStore((s) => s.nameIndexState);
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
    setUrl(`${window.location.origin}${base}/register/`);
  }, []);

  // בנייה חד-פעמית של מפתח החיפוש, אחרי שהמאגר נטען
  useEffect(() => {
    if (candidatesLoaded) backfillNameIndex();
  }, [candidatesLoaded, backfillNameIndex]);

  const handleCopy = async () => {
    if (!url) return;
    const ok = await writeToClipboard(url);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      <h2 className="mt-8 mb-3 flex items-center gap-1.5 text-[15px] font-bold text-[#3A2E26]">
        <Link2 size={17} /> טופס הרשמה למועמדים
      </h2>

      <div className="rounded-3xl border border-[#CCBDAB] bg-white p-4 shadow-[0_4px_18px_rgba(58,51,53,0.06)]">
        <p className="text-[13px] leading-relaxed text-[#7C6E60]">
          עמוד פתוח, בלי צורך בהתחברות. מי שכבר במאגר יכול לעדכן משם את סטטוס הפניות שלו,
          ומי שאינו במאגר ממלא טופס הרשמה שמגיע לתיבה שלמעלה.
        </p>

        <p
          dir="ltr"
          className="mt-3 truncate rounded-2xl bg-[#F5EFE6] px-3 py-2.5 text-left text-[12px] text-[#3A2E26]"
        >
          {url || "..."}
        </p>

        <div className="mt-2 flex gap-2">
          <button
            onClick={handleCopy}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-[#844442] px-3 py-2.5 text-[13px] font-semibold text-white transition active:scale-95"
          >
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {copied ? "הועתק" : "העתקת הקישור"}
          </button>
          <a
            href={url || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-[#CCBDAB] bg-white px-3 py-2.5 text-[13px] font-semibold text-[#3A2E26] transition active:scale-95"
          >
            <ExternalLink size={15} /> פתיחה
          </a>
        </div>

        {/* מצב מפתח החיפוש - כישלון גלוי */}
        {nameIndexState === "denied" ? (
          <div className="mt-3 flex items-start gap-2 rounded-2xl border-2 border-[#C24545] bg-red-50 px-3 py-2.5">
            <AlertTriangle size={15} className="mt-0.5 shrink-0 text-[#C24545]" />
            <p className="text-[12px] leading-relaxed font-semibold text-[#C24545]">
              החיפוש לפי שם אינו פעיל. כללי האבטחה של הטופס טרם פורסמו ב-Firebase, ולכן מי שכבר
              במאגר לא יימצא בטופס ויופנה בטעות להרשמה חדשה. יש להדביק את הכללים בקונסולה.
            </p>
          </div>
        ) : nameIndexState === "done" ? (
          <p className="mt-3 rounded-2xl bg-[#DDE6DF] px-3 py-2.5 text-[12px] font-semibold leading-relaxed text-[#4A6552]">
            הבדיקה לפי שם פעילה. מי שכבר במאגר יימצא בטופס ויוכל לעדכן את הסטטוס שלו.
          </p>
        ) : nameIndexState === "running" ? (
          <p className="mt-3 rounded-2xl bg-[#E8DCCB] px-3 py-2.5 text-[12px] text-[#7C6E60]">
            מכינים את החיפוש לפי שם...
          </p>
        ) : null}
      </div>
    </>
  );
}
