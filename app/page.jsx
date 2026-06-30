import Link from "next/link";
import Logo from "../components/Logo";
import { OPENING_TITLE } from "../lib/questions";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md text-center">
        {/* לוגו נקי וללא רקע, ממורכז בראש העמוד */}
        <div className="mb-6 flex justify-center">
          <Logo className="w-72 max-w-[85%]" />
        </div>

        <h1 className="mb-8 text-lg font-medium leading-relaxed text-ink">
          {OPENING_TITLE}
        </h1>

        {/* בחירת מסלול: בחור | בחורה */}
        <div className="grid grid-cols-2 gap-4">
          <Link
            href="/form/male"
            className="card flex flex-col items-center gap-2 py-8 transition hover:border-rose hover:shadow-lg"
          >
            <span className="text-4xl">👤</span>
            <span className="text-xl font-semibold text-roseDark">בחור</span>
          </Link>
          <Link
            href="/form/female"
            className="card flex flex-col items-center gap-2 py-8 transition hover:border-rose hover:shadow-lg"
          >
            <span className="text-4xl">👤</span>
            <span className="text-xl font-semibold text-roseDark">בחורה</span>
          </Link>
        </div>

        <div className="mt-8">
          <Link
            href="/admin"
            className="text-sm text-ink/50 underline-offset-4 hover:underline"
          >
            כניסת צוות ניהול
          </Link>
        </div>
      </div>
    </main>
  );
}
