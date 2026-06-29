import Image from "next/image";
import { THANK_YOU_TEXT } from "../../lib/questions";

export default function ThankYouPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Image
            src="/logo.png"
            alt="לוגו"
            width={120}
            height={120}
            className="h-28 w-28 rounded-3xl object-contain"
          />
        </div>
        <div className="mb-4 text-5xl">☕</div>
        <p className="text-xl font-medium leading-relaxed text-ink">
          {THANK_YOU_TEXT}
        </p>
      </div>
    </main>
  );
}
