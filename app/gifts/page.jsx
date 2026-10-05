import Link from "next/link";
import { Gift, Heart } from "lucide-react";

export const metadata = {
  title: "מתנות לנרשמים · חיבורים משמחים",
  description: "הטבות ומתנות למי שנרשם/ה למאגר השידוכים",
};

// עמוד המתנות. מגיעים לכאן אוטומטית מיד אחרי שליחת טופס ההרשמה.
//
// העמוד פותח באישור שהפנייה התקבלה - אותו מסר שהופיע קודם בסוף הטופס -
// כדי שאיש לא יישאר בלי תשובה אחרי ששלח את פרטיו. מתחתיו שלד האזור
// שבו ייכנסו ההטבות עצמן.
export default function GiftsPage() {
  return (
    <div className="min-h-dvh bg-[#F6F5F4] text-[#3A3335]" dir="rtl">
      <header className="border-b border-[#EAE5E3] bg-white/90 px-5 py-4 backdrop-blur safe-top">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/hands.jpg" alt="" className="h-11 w-11 shrink-0 rounded-2xl object-cover" />
          <div>
            <p className="text-[15px] font-bold leading-tight">חיבורים משמחים</p>
            <p className="text-[12px] text-[#8A8285]">מתנות והטבות לנרשמים</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-5 pb-16 pt-6 safe-bottom">
        {/* אישור קבלת הפנייה */}
        <div className="rounded-3xl border border-[#EAE5E3] bg-white p-7 text-center shadow-[0_4px_18px_rgba(58,51,53,0.06)]">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#F6E4E6]">
            <Heart size={28} className="fill-[#8C4A55] text-[#8C4A55]" />
          </div>
          <h1 className="text-[21px] font-bold">קיבלנו את הפרטים</h1>
          <p className="mt-3 text-[14px] leading-relaxed text-[#8A8285]">
            תודה שסיפרתם לנו עליכם. הפרטים הגיעו לצוות המשרד, ואנחנו נעבור עליהם באופן אישי.
            <br />
            ניצור אתכם קשר בהקדם.
          </p>
          <p className="mt-5 rounded-2xl bg-[#F6F5F4] px-4 py-3 text-[12px] leading-relaxed text-[#8A8285]">
            הפרטים שמסרתם שמורים אצלנו בדיסקרטיות מלאה ואינם נחשפים לאף גורם מחוץ לצוות.
          </p>
        </div>

        {/* שלד אזור המתנות. התוכן עצמו ייכנס לכאן בהמשך. */}
        <section className="mt-6 rounded-3xl border border-[#EAE5E3] bg-white p-6">
          <div className="flex items-center gap-2">
            <Gift size={18} className="text-[#8C4A55]" />
            <h2 className="text-[16px] font-bold text-[#8C4A55]">מתנה קטנה בשבילכם</h2>
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-[#8A8285]">
            אנחנו מכינים כאן הטבות ומתנות למי שנרשם/ה למאגר. בקרוב יופיעו כאן.
          </p>

          <div className="mt-4 space-y-2.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-2xl border border-dashed border-[#EAE5E3] bg-[#FBFAFA] px-4 py-5">
                <p className="text-[12.5px] text-[#B5AEB0]">מקום להטבה</p>
              </div>
            ))}
          </div>
        </section>

        <Link
          href="/register"
          className="mt-6 flex w-full items-center justify-center rounded-2xl border border-[#EAE5E3] bg-white py-3 text-[13px] font-semibold text-[#8C4A55]"
        >
          חזרה לטופס ההרשמה
        </Link>
      </main>
    </div>
  );
}
