"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp, Quote } from "lucide-react";

// אזור אמון והיכרות בעמוד הבית — אווירת בוטיק רכה:
// איור סופי במה מחמיאה, טיפוגרפיה אוורירית (Assistant / Oron Tzar),
// אפקט הקלדה למשפט הפתיחה, חשיפה רכה בגלילה, וקרוסלת המלצות הניתנת להחלקה.
const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

const LEAD = `נעים להכיר, אני רעות פריד מקהילת חב"ד יצהר.`;
const REST =
  `אני מרכזת כאן את צוות השגרירים של 'הקהילה איתך'. אז מי אלה בעצם השגרירים? הרעיון שלנו הוא שמי שילווה אותך יהיה מישהו שמכיר את הראש שלך: זה יכול להיות שגריר מהיישוב שלך, מישהו מהמוסד האחרון שלמדת בו שקשור לרב, או צוות ההנהלה אם אתם עדיין מחפשים את הסביבה המדויקת לכם.`;
const MORE =
  `את הדרך לזוגיות שלנו, בעלי ואני עשינו לאור תורתו של הרב יצחק גינזבורג. ההכשרה האמיתית שלי היא מהשטח: זכיתי עד היום לשדך מעל 20 זוגות וללוות מאות חבר'ה בעולם הדייטים. הממשק הדיגיטלי שלנו כאן הוא חדש, אבל כבר זכינו ברוך ה' לעשות דרכו כמה שידוכים טובים. המטרה שלנו היא פשוט לעזור לכם למצוא את החצי השני באכפתיות, במסירות ובלי לחץ.`;

const SLIDES = [0, 1, 2];

function prefersReduced() {
  try {
    return typeof window !== "undefined" && window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e) {
    return false;
  }
}

export default function TrustSection() {
  const sectionRef = useRef(null);
  const [shown, setShown] = useState(false);

  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const touchX = useRef(null);

  // אפקט הקלדה למשפט הפתיחה
  const [typed, setTyped] = useState("");
  const [doneTyping, setDoneTyping] = useState(false);

  // חשיפה בגלילה: מופעל פעם אחת כשהאזור נכנס לשדה הראייה
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") { setShown(true); return; }
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { setShown(true); obs.disconnect(); } }),
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // התחלת ההקלדה ברגע שהאזור מופיע
  useEffect(() => {
    if (!shown) return;
    if (prefersReduced()) { setTyped(LEAD); setDoneTyping(true); return; }
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setTyped(LEAD.slice(0, i));
      if (i >= LEAD.length) { clearInterval(id); setDoneTyping(true); }
    }, 45);
    return () => clearInterval(id);
  }, [shown]);

  const n = SLIDES.length;
  const cur = ((index % n) + n) % n;

  function go(delta) { setIndex((i) => i + delta); }
  function onTouchStart(e) { touchX.current = e.touches[0].clientX; }
  function onTouchEnd(e) {
    if (touchX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    touchX.current = null;
  }

  // מחלקת חשיפה + השהיה מדורגת
  const rv = (delay) => ({
    className: `reveal${shown ? " is-visible" : ""}`,
    style: { transitionDelay: `${delay}ms` },
  });

  return (
    <section ref={sectionRef} className="font-elegant mt-16 space-y-10 text-right">
      {/* ---- היכרות: איור במה + טקסט אוורירי + הקלדה ---- */}
      <div className="card space-y-6 px-6 py-8">
        {/* איור סופי — במה אלגנטית, ללא פילטרים */}
        <div className={`reveal${shown ? " is-visible" : ""} flex justify-center`} style={{ transitionDelay: "0ms" }}>
          <div className="overflow-hidden rounded-[2rem] bg-white p-1.5 shadow-[0_18px_40px_rgba(167,79,79,0.14)] ring-1 ring-rose/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${BASE}/assets/rep-illustration.jpg`}
              alt="רעות פריד"
              className="h-44 w-44 rounded-[1.6rem] object-cover object-top sm:h-52 sm:w-52"
            />
          </div>
        </div>

        {/* משפט פתיחה בהקלדה + המשך הטקסט */}
        <div {...rv(120)}>
          <p className="text-lg font-light leading-loose text-ink/90">
            <span className="font-medium text-roseDark">{typed}</span>
            {!doneTyping && <span className="tw-caret h-5 align-middle text-rose" aria-hidden="true" />}
          </p>
          {doneTyping && (
            <p className="animate-fadein mt-3 text-lg font-light leading-loose text-ink/85">{REST}</p>
          )}
        </div>

        {/* קרא עוד — מניפה עדינה */}
        {open && (
          <p className="animate-fadein whitespace-pre-wrap border-t border-sand/70 pt-5 text-lg font-light leading-loose text-ink/85">
            {MORE}
          </p>
        )}

        <div {...rv(220)}>
          <button
            onClick={() => setOpen((o) => !o)}
            className="inline-flex items-center gap-1 text-base font-medium text-roseDark underline decoration-rose/40 underline-offset-4 transition-all duration-500 hover:decoration-rose hover:opacity-80"
          >
            {open ? (
              <>פחות <ChevronUp className="h-4 w-4" strokeWidth={2} /></>
            ) : (
              <>קצת עלינו (קרא עוד)... <ChevronDown className="h-4 w-4" strokeWidth={2} /></>
            )}
          </button>
        </div>
      </div>

      {/* ---- קרוסלת המלצות (החלקה) בגווני המותג ---- */}
      <div className={`reveal${shown ? " is-visible" : ""} select-none rounded-3xl border border-rose/15 bg-blush/40 p-5`} style={{ transitionDelay: "120ms" }}>
        <div className="mb-4 flex items-center justify-end gap-2">
          <span className="text-base font-semibold text-roseDark">מה מספרים עלינו</span>
          <Quote className="h-5 w-5 text-rose" strokeWidth={1.75} />
        </div>

        <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          <div className="mx-auto w-full max-w-[230px]">
            <div className="relative flex aspect-[9/16] flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border border-dashed border-rose/30 bg-white/70 p-5 text-center shadow-sm transition-all duration-500 ease-out hover:scale-[1.02] hover:shadow-[0_14px_34px_rgba(167,79,79,0.16)]">
              <Quote className="h-8 w-8 text-rose/40" strokeWidth={1.5} />
              <p className="text-sm font-semibold text-roseDark">המלצה {cur + 1}</p>
              <p className="text-xs font-light leading-relaxed text-ink/50">
                כאן תתווסף המלצה אמיתית
                <br />
                מצילום מסך של וואטסאפ
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-1.5">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              aria-label={`המלצה ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all duration-500 ${i === cur ? "w-5 bg-rose" : "w-2 bg-rose/30"}`}
            />
          ))}
        </div>
        <p className="mt-2 text-center text-xs font-light text-ink/40">אפשר להחליק ימינה ושמאלה</p>
      </div>
    </section>
  );
}
