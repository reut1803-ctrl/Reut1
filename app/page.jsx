import Link from "next/link";
import { Users } from "lucide-react";
import Logo from "../components/Logo";
import PersonIcon from "../components/PersonIcon";
import TrustSection from "../components/TrustSection";

export default function HomePage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center px-4 pb-16">
      {/* הדר עליון דיסקרטי - גישה מהירה לצוות, מעל הכל */}
      <Link
        href="/admin"
        className="fixed left-3 top-3 z-20 inline-flex items-center gap-1.5 rounded-full border border-white/50 bg-white/55 px-3.5 py-1.5 text-xs font-medium text-ink/55 shadow-sm backdrop-blur-md transition-all duration-300 hover:text-roseDark hover:shadow"
      >
        <Users className="h-3.5 w-3.5" strokeWidth={1.75} />
        כניסת צוות
      </Link>

      <div className="w-full max-w-md">
        {/* אזור פתיחה - לוגו בלבד, עם המון אוויר */}
        <div className="flex justify-center pt-24 pb-4">
          <Logo className="w-72 max-w-[85%]" animate />
        </div>

        {/* אזור היכרות (TrustSection) - מיד אחרי הלוגו */}
        <TrustSection />

        {/* כפתורי הפעולה - פרימיום, אליפטיים, אחרי ההיכרות */}
        <div className="mt-20 grid grid-cols-2 gap-4">
          <Link
            href="/form/male"
            className="group flex flex-col items-center gap-2.5 rounded-full border border-rose/15 bg-white/50 py-8 shadow-[0_8px_24px_rgba(167,79,79,0.08)] backdrop-blur-sm transition-all duration-500 ease-out hover:scale-[1.02] hover:border-rose/30 hover:bg-blush/40 hover:shadow-[0_14px_34px_rgba(167,79,79,0.16)] active:scale-[0.99]"
          >
            <PersonIcon className="h-11 w-11 text-rose/80 transition-colors duration-500 group-hover:text-rose" />
            <span className="text-lg font-light tracking-wide text-[#6E4B4B]">בחור</span>
          </Link>
          <Link
            href="/form/female"
            className="group flex flex-col items-center gap-2.5 rounded-full border border-rose/15 bg-white/50 py-8 shadow-[0_8px_24px_rgba(167,79,79,0.08)] backdrop-blur-sm transition-all duration-500 ease-out hover:scale-[1.02] hover:border-rose/30 hover:bg-blush/40 hover:shadow-[0_14px_34px_rgba(167,79,79,0.16)] active:scale-[0.99]"
          >
            <PersonIcon className="h-11 w-11 text-rose/80 transition-colors duration-500 group-hover:text-rose" />
            <span className="text-lg font-light tracking-wide text-[#6E4B4B]">בחורה</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
