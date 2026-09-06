import Link from "next/link";
import { APP_NAME, APP_SUBTITLE, LOGO_SRC, REGISTRATION_FORM_URL } from "@/lib/appConfig";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-cream px-5 py-12" dir="rtl">
      <div className="w-full max-w-md text-center">
        {/* הלוגו הרשמי, ממורכז ונקי */}
        <img src={LOGO_SRC} alt={APP_NAME} className="mx-auto w-80 max-w-[88%] object-contain" />

        <p className="mt-5 text-[15px] font-semibold tracking-wide text-roseDark">{APP_SUBTITLE}</p>

        <div className="mt-10 space-y-3">
          {/* הרשמה והזנת פרטים – טופס חיצוני נקי, בדיוק במתכונת שסוכמה.
              כל עוד לא הוזנה כתובת טופס ב-lib/appConfig.js, הכפתור אינו מוצג. */}
          {REGISTRATION_FORM_URL && (
            <a
              href={REGISTRATION_FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary w-full"
            >
              הרשמה למאגר
            </a>
          )}

          <Link href="/crm/" className="btn-soft w-full">
            כניסת צוות השדכניות
          </Link>
        </div>
      </div>
    </main>
  );
}
