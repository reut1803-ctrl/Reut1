import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { APP_NAME, APP_SUBTITLE, LOGO_SRC } from "@/lib/appConfig";

// מעטפת אחידה לשני הנספחים, כדי ששניהם ייראו וייקראו אותו דבר.
export default function LegalPage({ title, subtitle, children }) {
  return (
    <main className="min-h-screen bg-[#F2F8FB] px-4 py-8" dir="rtl">
      <div className="mx-auto w-full max-w-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={LOGO_SRC} alt={APP_NAME} className="mx-auto mb-3 w-40 max-w-[55%] object-contain" />
        <p className="mb-6 text-center text-[13px] font-semibold text-[#1F6E88]">{APP_SUBTITLE}</p>

        <article className="rounded-3xl border border-[#CFE3EC] bg-white p-6 shadow-[0_4px_18px_rgba(31,110,136,0.06)]">
          <h1 className="text-[19px] font-bold text-[#1F6E88]">{title}</h1>
          <p className="mt-1 text-[13px] text-[#5E7A87]">{subtitle}</p>
          <div className="mt-5 space-y-5 text-[14px] leading-relaxed text-[#23414E]">{children}</div>
        </article>

        <Link
          href="/register/"
          className="mt-5 flex items-center justify-center gap-1 rounded-2xl border border-[#CFE3EC] bg-white py-3 text-[14px] font-semibold text-[#2E8BA8]"
        >
          <ChevronRight size={16} /> חזרה לטופס ההרשמה
        </Link>
      </div>
    </main>
  );
}

export function Section({ heading, children }) {
  return (
    <section>
      <h2 className="mb-1.5 text-[15px] font-bold text-[#1F6E88]">{heading}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
