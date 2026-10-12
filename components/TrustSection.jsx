"use client";

import { useState, useRef } from "react";
import { ChevronDown, ChevronUp, Quote } from "lucide-react";

// אזור אמון והיכרות בעמוד הבית: טקסט היכרות עם "קרא עוד", אווטאר צנוע,
// וקרוסלת המלצות הניתנת להחלקה (שקפי Placeholder עד שיועלו צילומי המסך האמיתיים).
const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

const INTRO_VISIBLE =
  `נעים להכיר, אני רעות פריד מקהילת חב"ד יצהר. אני מרכזת כאן את צוות השגרירים של 'הקהילה איתך'. אז מי אלה בעצם השגרירים? הרעיון שלנו הוא שמי שילווה אותך יהיה מישהו שמכיר את הראש שלך: זה יכול להיות שגריר מהיישוב או אזור המגורים שלך, או מישהו מהמוסד האחרון שלמדת בו שקשור לרב. ואם אתם חוזרים בתשובה או שעדיין אין לכם קהילה ספציפית – אתם משויכים ישירות אליי ולהנהלה.`;

const INTRO_MORE =
  `את הדרך לזוגיות שלנו, בעלי ואני עשינו לאור תורתו של הרב יצחק גינזבורג. ההכשרה האמיתית שלי היא מהשטח: זכיתי עד היום לשדך מעל 20 זוגות וללוות מאות חבר'ה בעולם הדייטים. הממשק הדיגיטלי שלנו כאן הוא חדש, אבל כבר זכינו ברוך ה' לעשות דרכו כמה שידוכים טובים. המטרה שלנו היא פשוט לעזור לכם למצוא את החצי השני באכפתיות, במסירות ובלי לחץ.`;

// שלושה שקפי Placeholder להמלצות. יוחלפו בצילומי מסך אמיתיים בהמשך.
const SLIDES = [0, 1, 2];

export default function TrustSection() {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const touchX = useRef(null);

  const n = SLIDES.length;
  const cur = ((index % n) + n) % n; // אינדקס בטוח עם גלישה מעגלית

  function go(delta) {
    setIndex((i) => i + delta);
  }
  function onTouchStart(e) {
    touchX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e) {
    if (touchX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1); // החלקה שמאלה = הבא, ימינה = הקודם
    touchX.current = null;
  }

  return (
    <section className="mt-12 space-y-8 text-right">
      {/* ---- היכרות: אווטאר צנוע + טקסט בגובה העיניים + קרא עוד ---- */}
      <div className="card space-y-4">
        <div className="flex items-start gap-4">
          {/* אווטאר מרומז: גווני המותג, שוליים נמסים ברקע השמנת */}
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-cream ring-1 ring-rose/15">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${BASE}/assets/rep-avatar.jpg`}
              alt="רעות פריד"
              className="h-full w-full object-cover object-top opacity-55 grayscale contrast-[1.35] mix-blend-multiply [mask-image:radial-gradient(circle,#000_36%,transparent_72%)]"
            />
            {/* גוון המותג על הצללית - הופך את הצילום ל"חותמת" עדינה בצבעי האתר */}
            <span className="pointer-events-none absolute inset-0 bg-roseDark/55 mix-blend-color" aria-hidden="true" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="whitespace-pre-wrap text-base leading-relaxed text-ink/90">{INTRO_VISIBLE}</p>
          </div>
        </div>

        {/* קרא עוד - מניפה עדינה */}
        {open && (
          <p className="animate-fadein whitespace-pre-wrap border-t border-sand pt-4 text-base leading-relaxed text-ink/90">
            {INTRO_MORE}
          </p>
        )}

        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1 text-sm font-semibold text-roseDark underline decoration-rose/40 underline-offset-4 transition hover:decoration-rose"
        >
          {open ? (
            <>פחות <ChevronUp className="h-4 w-4" strokeWidth={2} /></>
          ) : (
            <>קצת עליי (קרא עוד)... <ChevronDown className="h-4 w-4" strokeWidth={2} /></>
          )}
        </button>
      </div>

      {/* ---- קרוסלת המלצות (החלקה) בשפה של "טיפ בשידוכים", בגווני המותג ---- */}
      <div className="select-none rounded-2xl border border-rose/20 bg-blush/40 p-4">
        <div className="mb-3 flex items-center justify-end gap-2">
          <span className="text-sm font-bold text-roseDark">מה מספרים עלינו</span>
          <Quote className="h-5 w-5 text-rose" strokeWidth={1.75} />
        </div>

        <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          <div className="mx-auto w-full max-w-[230px]">
            <div className="relative flex aspect-[9/16] flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border border-dashed border-rose/30 bg-white/70 p-5 text-center shadow-sm">
              <Quote className="h-8 w-8 text-rose/40" strokeWidth={1.5} />
              <p className="text-sm font-semibold text-roseDark">המלצה {cur + 1}</p>
              <p className="text-xs leading-relaxed text-ink/50">
                כאן תתווסף המלצה אמיתית
                <br />
                מצילום מסך של וואטסאפ
              </p>
            </div>
          </div>
        </div>

        {/* נקודות ניווט + הנחיה עדינה להחלקה */}
        <div className="mt-3 flex items-center justify-center gap-1.5">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              aria-label={`המלצה ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all ${i === cur ? "w-4 bg-rose" : "w-2 bg-rose/30"}`}
            />
          ))}
        </div>
        <p className="mt-2 text-center text-xs text-ink/40">אפשר להחליק ימינה ושמאלה</p>
      </div>
    </section>
  );
}
