"use client";

import { useState, useRef, useEffect } from "react";
import { Quote } from "lucide-react";
import { useData } from "../lib/useData";

// עמוד הבית — קרוסלת ההמלצות (צילומי מסך שהועלו בלוח הבקרה).
// ציר ההיכרות האישית ("נעים להכיר") הוסר מעמוד השער והוחלף ב"לוח חזון".

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

export default function TrustSection() {
  const data = useData();

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
