"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Header from "../../components/Header";
import { useData } from "../../lib/useData";
import { setStatusAvailability, setStatusTrack } from "../../lib/store";
import { HeartHandshake, Phone, Check } from "lucide-react";

const AVAILABILITY = ["פנוי/ה להצעות", "בקשר / בתהליך", "לא פנוי/ה כרגע"];

function StatusInner() {
  const id = useSearchParams().get("id");
  const data = useData();
  const [savedMsg, setSavedMsg] = useState("");

  if (!id) {
    return <p className="text-center text-sm text-ink/60">קישור חסר. ודאו שהעתקתם אותו במלואו.</p>;
  }
  if (!data) {
    return <p className="text-center text-sm text-ink/40">טוען…</p>;
  }

  const me = (data.candidateStatus || []).find((c) => c.id === id);
  if (!me) {
    return <p className="text-center text-sm text-ink/60">הקישור לא נמצא. ייתכן שההרשמה עדיין נטענת — נסו לרענן בעוד רגע.</p>;
  }

  function flash(t) {
    setSavedMsg(t);
    setTimeout(() => setSavedMsg(""), 2200);
  }
  function pickAvailability(s) {
    setStatusAvailability(id, s);
    flash("הסטטוס עודכן, תודה!");
  }
  function pickTrack(t) {
    setStatusTrack(id, t);
    flash("המסלול עודכן, תודה!");
  }

  const firstName = (me.name || "").split(" ")[0];

  return (
    <div className="w-full max-w-sm space-y-5">
      <div className="card text-center">
        <p className="text-sm text-ink/60">שלום {firstName},</p>
        <h1 className="mt-1 text-xl font-bold text-roseDark">האזור האישי שלך</h1>
        <p className="mt-1 text-[13px] text-ink/50">כאן אפשר לעדכן את הסטטוס והמסלול בכל עת. הפרטים האישיים שלך אינם נחשפים כאן.</p>
      </div>

      {/* סטטוס זמינות */}
      <div className="card space-y-2.5">
        <p className="font-bold text-ink">מה הסטטוס שלך כרגע?</p>
        {AVAILABILITY.map((s) => {
          const active = me.availabilityStatus === s;
          return (
            <button
              key={s}
              onClick={() => pickAvailability(s)}
              className={`flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-base font-bold transition ${active ? "bg-rose text-white" : "border border-sand bg-white text-ink"}`}
            >
              {active && <Check className="h-5 w-5" strokeWidth={2} />} {s}
            </button>
          );
        })}
      </div>

      {/* בחירת מסלול */}
      <div className="card space-y-2.5">
        <p className="font-bold text-ink">המסלול שלך</p>
        <button
          onClick={() => pickTrack("personal")}
          className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-right transition ${me.personalTrack === "personal" ? "bg-rose text-white" : "border border-sand bg-white"}`}
        >
          <HeartHandshake className="h-5 w-5 shrink-0" strokeWidth={1.75} />
          <span className="font-bold">מסלול אישי</span>
        </button>
        <button
          onClick={() => pickTrack("callback")}
          className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-right transition ${me.personalTrack === "callback" ? "bg-rose text-white" : "border border-sand bg-white"}`}
        >
          <Phone className="h-5 w-5 shrink-0" strokeWidth={1.75} />
          <span className="font-bold">נא לחזור אליי</span>
        </button>
      </div>

      {savedMsg && <p className="text-center text-sm font-semibold text-green-600">{savedMsg}</p>}
    </div>
  );
}

export default function StatusPage() {
  return (
    <div>
      <Header />
      <main className="flex min-h-screen flex-col items-center px-5 py-8">
        <Suspense fallback={null}>
          <StatusInner />
        </Suspense>
      </main>
    </div>
  );
}
