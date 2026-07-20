"use client";

import Link from "next/link";
import { ShieldCheck, Sparkles, ChevronLeft } from "lucide-react";
import SuccessCarousel from "@/components/landing/SuccessCarousel";

export default function LandingPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-6 pb-10 pt-12">
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-bordeaux-500 text-xl font-extrabold text-white shadow-soft">
          מש
        </div>
        <h1 className="text-xl font-extrabold leading-snug text-ink">
          מאגר כרטיסיות בחורים
          <br />
          לנשים בלבד
        </h1>
        <p className="mt-2 text-sm text-muted">מרחב מכובד, פרטי ומלווה אישית לכל אורך הדרך</p>
      </div>

      <div className="mb-8 flex flex-col gap-3">
        <Link href="/profiles" className="btn-pink w-full py-3.5 text-base">
          הרשמה לאתר
        </Link>
        <Link href="/profiles" className="btn-outline w-full py-3.5 text-base">
          כבר יש לי חשבון
        </Link>
        <button className="flex w-full items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white py-3.5 text-sm font-semibold text-ink transition active:scale-95">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] font-bold text-blue-500 shadow">
            G
          </span>
          כניסה עם גוגל
        </button>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3">
        <InfoBox icon={ShieldCheck} title="פרסום מסודר" text="כל כרטיסייה נבדקת ומאושרת לפני עלייה למאגר" />
        <InfoBox icon={Sparkles} title="בהזמנה בלבד" text="גישה מלאה לאחר אימות ואישור הצטרפות" />
      </div>

      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-ink">סיפורי הצלחה</h2>
          <span className="text-xs text-muted">מדברים מהלב</span>
        </div>
        <SuccessCarousel />
      </div>

      <Link
        href="/profiles"
        className="mt-auto flex items-center justify-center gap-1.5 pt-4 text-xs font-medium text-muted"
      >
        כניסת צוות ניהול
        <ChevronLeft size={14} />
      </Link>
    </div>
  );
}

function InfoBox({ icon: Icon, title, text }) {
  return (
    <div className="card p-4">
      <Icon size={20} className="mb-2 text-bordeaux-500" />
      <p className="mb-1 text-sm font-bold text-ink">{title}</p>
      <p className="text-xs leading-relaxed text-muted">{text}</p>
    </div>
  );
}
