"use client";

import { useState, useRef, useEffect } from "react";
import { Quote } from "lucide-react";

// עמוד הבית — אזור ההיכרות:
// ציר זמן אנכי שהפורטרט הוא "תחנת המוצא" שלו (הקו יוצא מתחתיו וזורם מטה),
// תחנה אחת פעילה בכל רגע (המספר נדלק והכרטיסייה נשלפת מהצד) + קרוסלת המלצות.
const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

const STATIONS = [
  { title: "נעים להכיר", text: `שמי רעות פריד, בת 26 — נשואה לזכריה ואמא למנוחה רחל וחיה מושקא. אנחנו גרים בקהילת חב"ד ביצהר, וברוך השם אני זוכה לעמוד מאחורי 'הקהילה איתך' ולרכז את צוות השגרירים.` },
  { title: "מי שלצידכם", text: `חשוב לנו שמי שמלווה אתכם יכיר באמת את העולם שלכם — שגריר מהיישוב, מהמקום שבו למדתם, או אנחנו מההנהלה. מישהו קרוב, שמקשיב, ושאכפת לו.` },
  { title: "הדרך שלנו", text: `בנינו אותה מתוך הקשבה: מערכת פנימית להתאמות מדויקות, ערבי סיעור מוחות עם הקהילה, שיחות אישיות וסדנאות — כי מאחורי כל התאמה עומד אדם, לא נתון.` },
  { title: "מהשטח, מהלב", text: `עד היום זכיתי לשדך יותר מ-20 זוגות וללוות מאות צעירים וצעירות, וכל מפגש לימד אותי שהקשבה אמיתית עושה את ההבדל.` },
  { title: "מכאן והלאה", text: `הכלים כאן חדשים, אבל הלב נשאר אותו לב: ללוות אתכם באכפתיות, בסבלנות ובהקשבה — עד שתפגשו את מי שמחכה לכם.` },
];

const SLIDES = [0, 1, 2];

function useInView(options) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") { setVis(true); return; }
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { setVis(true); obs.disconnect(); } }),
      options || { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return [ref, vis];
}

function StoryTimeline() {
  const rows = useRef([]);
  const [active, setActive] = useState(0);
  const ticking = useRef(false);

  useEffect(() => {
    function compute() {
      ticking.current = false;
      const line = (window.innerHeight || 700) * 0.42; // קו ה"הפעלה" בתצוגה
      let best = 0, bestDist = Infinity;
      rows.current.forEach((el, i) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        const c = r.top + r.height / 2;
        const d = Math.abs(c - line);
        if (d < bestDist) { bestDist = d; best = i; }
      });
      setActive(best);
    }
    function onScroll() {
      if (ticking.current) return;
      ticking.current = true;
      window.requestAnimationFrame(compute);
    }
    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  function focusRow(i) {
    const el = rows.current[i];
    if (el && el.scrollIntoView) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <div className="relative mx-auto max-w-md">
      {/* קו הציר — יוצא מתחת לפורטרט וזורם מטה דרך התחנות */}
      <div className="absolute bottom-10 right-8 top-12 w-px bg-gradient-to-b from-rose/30 via-rose/25 to-rose/5" aria-hidden="true" />

      {/* תחנת המוצא: הפורטרט + הכותרת — ממנה "נובע" הסיפור */}
      <div className="relative flex items-center gap-5 pb-10">
        <div className="relative z-10 flex w-16 shrink-0 justify-center">
          <div className="h-16 w-16 overflow-hidden rounded-full bg-blush/40 ring-2 ring-rose/20 shadow-[0_8px_22px_rgba(167,79,79,0.16)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${BASE}/assets/rep-illustration.png`} alt="רעות פריד" className="h-full w-full scale-110 object-cover object-top" />
          </div>
        </div>
        <div className="flex-1 text-right">
          <p className="text-2xl font-semibold text-[#6E4B4B]">קצת עליי</p>
          <p className="mt-1 text-xs font-light tracking-wide text-[#5A4A48]/45">גללו כדי לעבור בין התחנות</p>
        </div>
      </div>

      {/* התחנות */}
      {STATIONS.map((s, i) => {
        const on = i === active;
        return (
          <div
            key={i}
            ref={(el) => (rows.current[i] = el)}
            className="relative flex items-start gap-5 pb-10 last:pb-0"
          >
            {/* מספר התחנה — נדלק כשהתחנה פעילה */}
            <div className="relative z-10 flex w-16 shrink-0 justify-center">
              <button
                onClick={() => focusRow(i)}
                aria-label={`תחנה ${i + 1}: ${s.title}`}
                className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold transition-all duration-500 ease-out ${
                  on
                    ? "scale-110 bg-[#7a2e3b] text-white shadow-[0_8px_20px_rgba(122,46,59,0.35)]"
                    : "bg-blush text-roseDark/45"
                }`}
              >
                {String(i + 1).padStart(2, "0")}
              </button>
            </div>

            {/* תוכן: כותרת תמיד גלויה; גוף נשלף מהצד רק בתחנה הפעילה */}
            <div className="min-w-0 flex-1 pt-2.5">
              <p className={`text-base transition-colors duration-500 ${on ? "font-semibold text-[#6E4B4B]" : "font-light text-[#5A4A48]/55"}`}>
                {s.title}
              </p>

              {/* מעבר גובה חלק (grid-rows) + שליפה מהצד */}
              <div
                className="grid"
                style={{ gridTemplateRows: on ? "1fr" : "0fr", transition: "grid-template-rows 0.5s cubic-bezier(0.4,0,0.2,1)" }}
              >
                <div className="overflow-hidden">
                  <div
                    className={`mt-3 rounded-2xl border border-rose/10 bg-white/75 p-5 shadow-[0_10px_28px_rgba(167,79,79,0.10)] backdrop-blur-sm transition-all duration-500 ease-out ${
                      on ? "translate-x-0 opacity-100" : "-translate-x-4 opacity-0"
                    }`}
                  >
                    <p className="text-[15px] font-light leading-loose text-[#5A4A48]">{s.text}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function TrustSection() {
  const [carRef, carVis] = useInView({ threshold: 0.2 });

  const [index, setIndex] = useState(0);
  const touchX = useRef(null);
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

  return (
    <section className="font-elegant mt-12">
      {/* ---- ציר הזמן — הסיפור שלנו ---- */}
      <StoryTimeline />

      {/* ---- קרוסלת המלצות ---- */}
      <div
        ref={carRef}
        className={`mx-auto mt-20 max-w-sm select-none px-2 transition-all duration-700 ease-out ${carVis ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
      >
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
