import Link from "next/link";
import { Users } from "lucide-react";
import Logo from "../components/Logo";
import InkBlessing from "../components/InkBlessing";
import VisionBoard from "../components/VisionBoard";
import TrustSection from "../components/TrustSection";
import LandingJoinBar from "../components/LandingJoinBar";

export default function HomePage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center px-4 pb-[calc(7rem+env(safe-area-inset-bottom))]">
      {/* הדר עליון דיסקרטי - גישה מהירה לצוות, מעל הכל */}
      <Link
        href="/admin"
        className="fixed left-3 top-3 z-20 inline-flex items-center gap-1.5 rounded-full border border-white/50 bg-white/55 px-3.5 py-1.5 text-xs font-medium text-ink/55 shadow-sm backdrop-blur-md transition-all duration-300 hover:text-roseDark hover:shadow"
      >
        <Users className="h-3.5 w-3.5" strokeWidth={1.75} />
        כניסת צוות
      </Link>

      <div className="w-full max-w-lg">
        {/* אזור פתיחה - לוגו בלבד, עם המון אוויר */}
        <div className="flex justify-center pb-2 pt-20">
          <Logo className="w-72 max-w-[85%]" animate />
        </div>

        {/* ברכת הרב יצחק גינזבורג — נכתבת בדיו לפי הגלילה (GSAP + ScrollTrigger) */}
        <InkBlessing />

        {/* לוח חזון — משבצות אווירה ומשפטי השראה */}
        <VisionBoard />

        {/* המלצות (צילומי מסך מלוח הבקרה) */}
        <TrustSection />
      </div>

      {/* סרגל הצטרפות דביק — כפתור "להצטרפות למאגר" שחוצה את הגבול העליון */}
      <LandingJoinBar />
    </main>
  );
}
