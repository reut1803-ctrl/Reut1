"use client";

import GoogleSignInButton from "@/components/crm/auth/GoogleSignInButton";

export default function SignInGate() {
  return (
    <div className="flex h-dvh flex-col items-center justify-center bg-[#F6F5F4] px-6 safe-top safe-bottom" dir="rtl">
      <div className="w-full max-w-xs text-center">
        <h1 className="text-3xl font-bold tracking-tight text-[#8C4A55]">חיבורים משמחים</h1>
        <p className="mt-3 text-[14px] leading-relaxed text-[#8A8285]">
          צוות שידוכים – ברוכות הבאות! אנא התחברו כדי להיכנס למאגר ולהתחיל בעבודה.
        </p>
        <div className="mt-7">
          <GoogleSignInButton label="כניסה לצוות דרך Google" />
        </div>
      </div>
    </div>
  );
}
