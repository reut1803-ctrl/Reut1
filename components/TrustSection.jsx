"use client";

import { useState, useRef, useEffect } from "react";
import { Quote } from "lucide-react";
import { useData } from "../lib/useData";
import { DEFAULT_HOME_STORY } from "../lib/store";

// עמוד הבית — אזור ההיכרות. הטקסטים נמשכים דינמית מההגדרות (ניתן לעריכה
// מלוח הבקרה), עם נפילה חלקה לברירת מחדל. ציר הזמן נפתח תחנה-אחר-תחנה
// בעדינות כשכל צומת מגיע למרכז המסך (IntersectionObserver יציב).

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

// תחנה בודדת: הכרטיס תמיד בגובהו הטבעי (ללא שינוי גובה בגלילה -> אין קפיצות).
// חשיפה רכה (fade + עלייה) פעם אחת כשנכנסת לתצוגה; המספר נדלק כשהתחנה פעילה.
function Station({ i, num, title, text, active, setNodeRef, onFocus }) {
  const [cardRef, shown] = useInView({ threshold: 0.18 });
  const on = i === active;
  return (
    <div className="relative flex items-start gap-4 pb-12 last:pb-0">
      <div className="relative z-10 flex w-14 shrink-0 justify-center">
        <button
          ref={setNodeRef}
          data-idx={i}
          onClick={onFocus}
          aria-label={`תחנה ${i + 1}: ${title || ""}`}
          className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold transition-all duration-500 ease-out ${
            on
              ? "scale-110 bg-[#7a2e3b] text-white shadow-[0_8px_20px_rgba(122,46,59,0.35)]"
              : "bg-blush text-roseDark/45"
          }`}
        >
          {num}
        </button>
      </div>

      <div className="min-w-0 flex-1 pt-2.5">
        <p className={`text-lg transition-colors duration-500 ${on ? "font-semibold text-[#6E4B4B]" : "font-medium text-[#6E4B4B]/80"}`}>
          {title}
        </p>
        <div
          ref={cardRef}
          className={`mt-3 rounded-2xl border border-rose/10 bg-white/75 p-6 shadow-[0_10px_28px_rgba(167,79,79,0.10)] backdrop-blur-sm transition-all duration-700 ease-out ${
            shown ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <p className="whitespace-pre-wrap text-lg font-light leading-loose text-[#5A4A48]">{text}</p>
        </div>
      </div>
    </div>
  );
}

function StoryTimeline({ stations }) {
  const nodeRefs = useRef([]);
  const [active, setActive] = useState(0);
  const ticking = useRef(false);

  // תחנה פעילה = הצומת האחרון שכבר חצה את קו האמצע של המסך.
  // מונוטוני וחלק: הגובה של הכרטיסים קבוע (לא משתנה בגלילה), ולכן אין
  // קפיצות, אין "אזורים מתים" ואין דילוג לתחנה 5.
  useEffect(() => {
    function compute() {
      ticking.current = false;
      const line = (window.innerHeight || 700) * 0.5;
      let idx = 0;
      for (let i = 0; i < nodeRefs.current.length; i++) {
        const el = nodeRefs.current[i];
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (r.top + r.height / 2 <= line) idx = i;
      }
      setActive(idx);
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
  }, [stations.length]);

  function focusNode(i) {
    const el = nodeRefs.current[i];
    if (el && el.scrollIntoView) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <div className="relative mx-auto max-w-lg pt-8">
      {/* קו הציר — זורם מטה דרך התחנות, מתחיל במרכז הצומת הראשון */}
      <div className="absolute bottom-10 right-7 top-14 w-px bg-gradient-to-b from-rose/30 via-rose/25 to-rose/5" aria-hidden="true" />

      {/* התחנות */}
      {stations.map((s, i) => (
        <Station
          key={i}
          i={i}
          num={String(i + 1).padStart(2, "0")}
          title={s.title}
          text={s.text}
          active={active}
          setNodeRef={(el) => (nodeRefs.current[i] = el)}
          onFocus={() => focusNode(i)}
        />
      ))}
    </div>
  );
}

export default function TrustSection() {
  const data = useData();
  const story = (data && data.homeStory) || DEFAULT_HOME_STORY;
  const stations = (Array.isArray(story.stations) && story.stations.length) ? story.stations : DEFAULT_HOME_STORY.stations;

  const [carRef, carVis] = useInView({ threshold: 0.2 });

  // המלצות דינמיות מלוח הבקרה (צילומי מסך). אם ריק — הקרוסלה כלל לא מוצגת.
  const testimonials = (data && Array.isArray(data.testimonials) ? data.testimonials : [])
    .slice()
    .sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));
  const m = testimonials.length;

  const [index, setIndex] = useState(0);
  const touchX = useRef(null);
  const cur = m > 0 ? (((index % m) + m) % m) : 0;
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
      {/* ---- ציר הזמן — הסיפור שלי ---- */}
      <StoryTimeline stations={stations} />

      {/* ---- קרוסלת המלצות (דינמית; מוצגת רק אם הועלו צילומי מסך) ---- */}
      {m > 0 && (
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
            <div className="mx-auto w-full max-w-[300px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={testimonials[cur].image}
                alt={`המלצה ${cur + 1}`}
                loading="lazy"
                decoding="async"
                className="mx-auto block w-full max-h-[72vh] rounded-3xl bg-white object-contain p-2 shadow-[0_14px_34px_rgba(167,79,79,0.16)]"
              />
            </div>
          </div>

          {m > 1 && (
            <>
              <div className="mt-5 flex items-center justify-center gap-1.5">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    aria-label={`המלצה ${i + 1}`}
                    onClick={() => setIndex(i)}
                    className={`h-1.5 rounded-full transition-all duration-500 ${i === cur ? "w-5 bg-rose/80" : "w-1.5 bg-rose/25"}`}
                  />
                ))}
              </div>
              <p className="mt-3 text-center text-xs font-light tracking-wide text-[#5A4A48]/40">אפשר להחליק ימינה ושמאלה</p>
            </>
          )}
        </div>
      )}
    </section>
  );
}
