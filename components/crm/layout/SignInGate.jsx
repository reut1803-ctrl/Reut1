"use client";

import GoogleSignInButton from "@/components/crm/auth/GoogleSignInButton";
import { APP_NAME, APP_SUBTITLE, isFirebaseConfigured } from "@/lib/appConfig";

export default function SignInGate() {
  return (
    <div className="flex h-dvh flex-col items-center justify-center bg-[#F6F5F4] px-6 safe-top safe-bottom" dir="rtl">
      <div className="w-full max-w-xs text-center">
        <h1 className="text-3xl font-bold tracking-tight text-[#8C4A55]">{APP_NAME}</h1>
        <p className="mt-2 text-[13px] font-medium tracking-wide text-[#8A8285]">{APP_SUBTITLE}</p>
        <p className="mt-4 text-[14px] leading-relaxed text-[#8A8285]">
          ברוכות הבאות! אנא התחברו כדי להיכנס למאגר ולהתחיל בעבודה.
        </p>
        {!isFirebaseConfigured && (
          <p className="mt-5 rounded-2xl bg-[#FDF3E7] px-4 py-3 text-[13px] leading-relaxed text-[#946200]">
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
