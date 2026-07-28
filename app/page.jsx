import Link from "next/link";
import Wordmark from "../components/Wordmark";

// מסך הפתיחה של המערכת. הכניסה הראשית היא למאגר השידוכים (הצוות),
// ומתחתיה נשארים הקישורים לשאלון ההיכרות עבור מועמדים ומועמדות.
export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md text-center">
        <div className="mb-10 flex justify-center">
          <Wordmark size="lg" />
        </div>

        <Link href="/crm" className="btn-primary w-full">
          כניסה למאגר השידוכים
        </Link>

        <p className="mt-10 mb-3 text-sm text-ink/50">מילוי שאלון היכרות</p>
        <div className="grid grid-cols-2 gap-4">
          <Link
            href="/form/male"
            className="card flex items-center justify-center py-4 transition hover:border-rose hover:shadow-lg"
          >
            <span className="font-semibold text-roseDark">בחור</span>
          </Link>
          <Link
            href="/form/female"
            className="card flex items-center justify-center py-4 transition hover:border-rose hover:shadow-lg"
          >
            <span className="font-semibold text-roseDark">בחורה</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
