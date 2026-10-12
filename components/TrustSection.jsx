"use client";

import { useState, useRef, useEffect } from "react";
import { Quote } from "lucide-react";

// אזור אמון והיכרות בעמוד הבית — עריכה מגזינית ("בוטיק"):
// קונטיינר צר וממורכז, טיפוגרפיה רכה ומאווררת, איור מוטמע ברקע (multiply),
// לינק מערכתי עדין, מניפה חלקה, הקלדה למשפט הפתיחה וחשיפה רכה בגלילה.
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

  const [typed, setTyped] = useState("");
  const [doneTyping, setDoneTyping] = useState(false);

  // חשיפה רכה בגלילה — פעם אחת כשהאזור נכנס לתצוגה
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

  // אפקט הקלדה למשפט הפתיחה
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

  const revealCls = (extra = "") => `reveal${shown ? " is-visible" : ""} ${extra}`;

  return (
    <section ref={sectionRef} className="font-elegant mt-20 space-y-16">
      {/* ---- היכרות: קונטיינר צר, מאוורר, מגזיני ---- */}
      <div className="mx-auto max-w-sm px-2">
        {/* האיור — מוטמע ברקע הפסטל (ללא רקע/מסגרת) באמצעות multiply */}
        <div className={revealCls("mb-9 flex justify-center")} style={{ transitionDelay: "0ms" }}>
          {/* איור עם רקע שקוף — נטמע לחלוטין ברקע הפסטל, ללא מסגרת/קופסה */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${BASE}/assets/rep-illustration.png`}
            alt="רעות פריד"
            className="h-52 w-auto object-contain"
          />
        </div>

        {/* הטקסט — מיושר לימין בתוך הבלוק הצר הממורכז */}
        <div className={revealCls("text-right")} style={{ transitionDelay: "140ms" }}>
          {/* משפט פתיחה בהקלדה — ככותרת משנה רכה */}
          <p className="text-xl leading-relaxed text-[#6E4B4B] sm:text-[1.4rem]">
            {typed}
            {!doneTyping && <span className="tw-caret h-5 align-middle text-rose" aria-hidden="true" />}
          </p>

          {/* גוף הטקסט — קל, אוורירי, "נושם" */}
          {doneTyping && (
            <p className="animate-fadein mt-5 text-base font-light leading-loose text-[#5A4A48]">{REST}</p>
          )}

          {/* מניפה חלקה כחמאה — מעבר גובה רך דרך grid-rows */}
          <div
            className="grid"
            style={{ gridTemplateRows: open ? "1fr" : "0fr", transition: "grid-template-rows 0.55s cubic-bezier(0.4,0,0.2,1)" }}
          >
            <div className="overflow-hidden">
              <p className="mt-5 text-base font-light leading-loose text-[#5A4A48]">{MORE}</p>
            </div>
          </div>

          {/* לינק מערכתי עדין — כהערת שוליים אסתטית */}
          <div className="mt-7 text-center">
            <button
              onClick={() => setOpen((o) => !o)}
              className="text-sm italic text-[#5A4A48]/70 underline-offset-[5px] decoration-[#5A4A48]/40 transition-all duration-300 hover:text-[#5A4A48] hover:underline"
            >
              {open ? "להציג פחות" : "קצת עלינו (קרא עוד)…"}
            </button>
          </div>
        </div>
      </div>

      {/* ---- קרוסלת המלצות — מינימלית, בגווני המותג ---- */}
      <div className={revealCls("mx-auto max-w-sm select-none px-2")} style={{ transitionDelay: "120ms" }}>
        <div className="mb-5 flex items-center justify-center gap-2 text-[#6E4B4B]">
          <Quote className="h-4 w-4 text-rose/70" strokeWidth={1.75} />
          <span className="text-sm font-light tracking-wide">מה מספרים עלינו</span>
          <Quote className="h-4 w-4 text-rose/70" strokeWidth={1.75} />
        </div>

        <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          <div className="mx-auto w-full max-w-[220px]">
            <div className="relative flex aspect-[9/16] flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border border-dashed border-rose/25 bg-white/50 p-5 text-center shadow-[0_10px_30px_rgba(167,79,79,0.08)] transition-all duration-500 ease-out hover:scale-[1.02] hover:shadow-[0_16px_38px_rgba(167,79,79,0.14)]">
              <Quote className="h-7 w-7 text-rose/30" strokeWidth={1.5} />
              <p className="text-sm font-light text-[#6E4B4B]">המלצה {cur + 1}</p>
              <p className="text-xs font-light leading-relaxed text-[#5A4A48]/50">
                כאן תתווסף המלצה אמיתית
                <br />
                מצילום מסך של וואטסאפ
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-center gap-1.5">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              aria-label={`המלצה ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-500 ${i === cur ? "w-5 bg-rose/80" : "w-1.5 bg-rose/25"}`}
            />
          ))}
        </div>
        <p className="mt-3 text-center text-xs font-light tracking-wide text-[#5A4A48]/40">אפשר להחליק ימינה ושמאלה</p>
      </div>
    </section>
  );
}
