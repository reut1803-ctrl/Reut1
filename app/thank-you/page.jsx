"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Logo from "../../components/Logo";
import EventsBoard from "../../components/EventsBoard";
import { THANK_YOU_TEXT } from "../../lib/questions";
import { setStatusTrack } from "../../lib/store";
import { HeartHandshake, Phone, Check, Link2, Copy } from "lucide-react";

const PERSONAL_PRICE = "60 ₪ לכל שיחה";
const BIT_TARGET = "054-308-5242"; // מספר הביט לתשלום המסלול האישי
const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

function ThankYouInner() {
  const id = useSearchParams().get("id");
  const [chosen, setChosen] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const personalLink = id && typeof window !== "undefined"
    ? `${window.location.origin}${BASE}/status?id=${id}`
    : "";

  async function choose(track) {
    setBusy(true);
    try { if (id) await setStatusTrack(id, track); } catch (e) {}
    setBusy(false);
    setChosen(track);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(personalLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (e) {
      alert(personalLink);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-6 flex justify-center">
        <Logo className="h-24 w-auto" />
      </div>

      <div className="card text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-blush">
          <Check className="h-7 w-7 text-rose" strokeWidth={2} />
        </div>
        <p className="whitespace-pre-line text-lg font-medium leading-relaxed text-ink">{THANK_YOU_TEXT}</p>
      </div>

      {/* בחירת מסלול */}
      {!chosen && (
        <div className="mt-6 space-y-3">
          <p className="text-center text-sm font-semibold text-ink/70">איך תרצו להמשיך מכאן?</p>
          <button onClick={() => choose("personal")} disabled={busy} className="card flex w-full items-center gap-4 text-right transition hover:border-rose hover:shadow-lg">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blush text-roseDark"><HeartHandshake className="h-6 w-6" strokeWidth={1.75} /></span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2 font-bold text-ink">מסלול אישי <span className="rounded-full bg-rose/10 px-2 py-0.5 text-xs font-semibold text-roseDark">{PERSONAL_PRICE}</span></span>
              <span className="mt-0.5 block text-sm text-ink/60">ליווי אישי וצמוד. התשלום מתבצע בביט.</span>
            </span>
          </button>
          <button onClick={() => choose("callback")} disabled={busy} className="card flex w-full items-center gap-4 text-right transition hover:border-rose hover:shadow-lg">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blush text-roseDark"><Phone className="h-6 w-6" strokeWidth={1.75} /></span>
            <span className="min-w-0 flex-1">
              <span className="font-bold text-ink">נא לחזור אליי</span>
              <span className="mt-0.5 block text-sm text-ink/60">נחזור אליכם בהקדם לתיאום.</span>
            </span>
          </button>
        </div>
      )}

      {chosen === "personal" && (
        <div className="mt-6 card space-y-2 text-center">
          <p className="font-bold text-roseDark">בחרתם במסלול האישי 💛</p>
          <p className="text-sm text-ink/80">עלות: <b>{PERSONAL_PRICE}</b></p>
          <p className="text-sm text-ink/80">לתשלום בביט (Bit), אל: <b>{BIT_TARGET}</b></p>
          <p className="text-xs text-ink/50">קיבלנו את בחירתכם. ניצור קשר בהקדם 🌸</p>
        </div>
      )}
      {chosen === "callback" && (
        <div className="mt-6 card text-center">
          <p className="font-bold text-roseDark">תודה! 🌸</p>
          <p className="mt-1 text-sm text-ink/80">נחזור אליכם בהקדם לתיאום.</p>
        </div>
      )}

      {/* הקישור האישי - לשמירה ולעדכון סטטוס/מסלול בעתיד */}
      {personalLink && (
        <div className="mt-6 card space-y-2">
          <p className="flex items-center gap-1.5 font-bold text-roseDark"><Link2 className="h-5 w-5" strokeWidth={1.75} /> הקישור האישי שלך</p>
          <p className="text-sm text-ink/70">שמרו את הקישור הזה 🔖 — דרכו תוכלו לעדכן את הסטטוס והמסלול שלכם בכל עת, בלי צורך בהרשמה מחדש.</p>
          <div className="truncate rounded-xl bg-sand/50 px-3 py-2 text-xs text-ink/60" dir="ltr">{personalLink}</div>
          <button className="btn-primary w-full" onClick={copyLink}><Copy className="h-4 w-4" strokeWidth={1.75} /> {copied ? "הקישור הועתק!" : "העתקת הקישור"}</button>
        </div>
      )}

      {/* לוח אירועים */}
      <EventsBoard />
    </div>
  );
}

export default function ThankYouPage() {
  return (
    <main className="flex min-h-screen flex-col items-center px-6 py-12 text-center">
      <Suspense fallback={null}>
        <ThankYouInner />
      </Suspense>
    </main>
  );
}
