"use client";

import GoogleSignInButton from "@/components/crm/auth/GoogleSignInButton";
import { APP_NAME, APP_SUBTITLE, isFirebaseConfigured } from "@/lib/appConfig";

export default function SignInGate() {
  return (
    <div className="flex h-dvh flex-col items-center justify-center bg-[#FAF6EE] px-6 safe-top safe-bottom" dir="rtl">
      <div className="w-full max-w-xs text-center">
        <h1 className="text-3xl font-bold tracking-tight text-[#6F4A2E]">{APP_NAME}</h1>
        <p className="mt-2 text-[13px] font-medium tracking-wide text-[#8B8175]">{APP_SUBTITLE}</p>
        <p className="mt-4 text-[14px] leading-relaxed text-[#8B8175]">
          ברוכות הבאות! אנא התחברו כדי להיכנס למאגר ולהתחיל בעבודה.
        </p>
        {!isFirebaseConfigured && (
          <p className="mt-5 rounded-2xl bg-[#FDF6E3] px-4 py-3 text-[13px] leading-relaxed text-[#8A6A12]">
            מסד הנתונים של המערכת עדיין לא חובר, ולכן הכניסה לא תעבוד בשלב זה.
            כל שאר המערכת מוכנה וממתינה.
          </p>
        )}
        <div className="mt-7">
          <GoogleSignInButton label="כניסה לצוות דרך Google" />
        </div>
      </div>
    </div>
  );
}
