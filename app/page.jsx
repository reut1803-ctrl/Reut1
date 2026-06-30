import Link from "next/link";
import Logo from "../components/Logo";
import PersonIcon from "../components/PersonIcon";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md text-center">
        {/* לוגו נקי וללא רקע, ממורכז בראש העמוד */}
        <div className="mb-10 flex justify-center">
          <Logo className="w-72 max-w-[85%]" />
        </div>

        {/* בחירת מסלול: בחור | בחורה - באייקון בצבע הלוגו */}
        <div className="grid grid-cols-2 gap-4">
          <Link
            href="/form/male"
            className="card flex flex-col items-center gap-2 py-8 transition hover:border-rose hover:shadow-lg"
          >
            <PersonIcon className="h-12 w-12 text-rose" />
            <span className="text-xl font-semibold text-roseDark">בחור</span>
          </Link>
          <Link
            href="/form/female"
            className="card flex flex-col items-center gap-2 py-8 transition hover:border-rose hover:shadow-lg"
          >
            <PersonIcon className="h-12 w-12 text-rose" />
            <span className="text-xl font-semibold text-roseDark">בחורה</span>
          </Link>
        </div>

        <div className="mt-8">
          <Link
            href="/admin"
            className="text-sm text-ink/50 underline-offset-4 hover:underline"
          >
            כניסת צוות
          </Link>
        </div>
      </div>
    </main>
  );
}
