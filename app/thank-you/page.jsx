import Logo from "../../components/Logo";
import UpcomingEvents from "../../components/UpcomingEvents";
import { THANK_YOU_TEXT } from "../../lib/questions";

export default function ThankYouPage() {
  return (
    <main className="flex min-h-screen flex-col items-center px-6 py-12 text-center">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Logo className="h-28 w-auto" />
        </div>
        <div className="mb-4 text-5xl">☕</div>
        <p className="text-xl font-medium leading-relaxed text-ink">{THANK_YOU_TEXT}</p>
        <p className="mt-3 rounded-2xl bg-blush/50 px-4 py-3 text-sm leading-relaxed text-ink/70">
          הפרטים התקבלו ונשמרו בהצלחה 🌸 ההרשמה תיבדק ותאושר על ידי ההנהלה, וניצור איתכם קשר בהמשך.
        </p>

        <UpcomingEvents />
      </div>
    </main>
  );
}
