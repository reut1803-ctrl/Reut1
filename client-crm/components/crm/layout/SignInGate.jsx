"use client";

import GoogleSignInButton from "@/components/crm/auth/GoogleSignInButton";
import { APP_NAME, APP_SUBTITLE, LOGO_SRC, isFirebaseConfigured } from "@/lib/appConfig";

export default function SignInGate() {
  return (
    <div className="flex h-dvh flex-col items-center justify-center bg-cream px-6 safe-top safe-bottom" dir="rtl">
      <div className="w-full max-w-xs text-center">
        {/* הלוגו הרשמי – שער האור של המיזם */}
        <img
          src={LOGO_SRC}
          alt={APP_NAME}
          className="mx-auto mb-5 w-60 max-w-[82%] object-contain"
        />
        <p className="text-[14px] font-semibold tracking-wide text-roseDark">{APP_SUBTITLE}</p>

        <p className="mt-4 text-[14px] leading-relaxed text-ink/70">
          ברוכות הבאות! אנא התחברו כדי להיכנס למאגר ולהתחיל בעבודה.
        </p>

        {!isFirebaseConfigured && (
          <p className="mt-5 rounded-2xl bg-blush px-4 py-3 text-[13px] leading-relaxed text-roseDark">
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
