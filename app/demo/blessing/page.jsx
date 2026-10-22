import Logo from "../../../components/Logo";
import InkBlessing from "../../../components/InkBlessing";

// עמוד דמו בלבד (לא מקושר מאף מקום באתר) — חוויית "ברכה שנכתבת בדיו" בגלילה.
export const metadata = { title: "דמו — ברכה בדיו", robots: { index: false } };

export default function InkBlessingDemo() {
  return (
    <main className="min-h-screen">
      <section className="flex min-h-[90vh] flex-col items-center justify-center gap-6 px-6 text-center">
        <Logo className="w-60 max-w-[75%]" />
        <p className="text-lg font-light text-[#6E4B4B]">ברוכים הבאים למערכת ההרשמה</p>
        <p className="animate-pulse text-sm text-ink/40">גללו מטה ↓</p>
      </section>

      <InkBlessing />

      <section className="flex min-h-[80vh] items-center justify-center px-6 text-center">
        <p className="text-base text-ink/50">כאן ממשיך שאר העמוד…</p>
      </section>
    </main>
  );
}
