"use client";

import { useEffect, useRef } from "react";
import INK from "./inkBlessingPaths";

// ברכת הרב — "נכתבת בדיו" לפי הגלילה (GSAP + ScrollTrigger).
// כל אות היא נתיב SVG: קודם מצויר קו המתאר (stroke-dashoffset), ואז הדיו "נספג" (fill).
// הגלילה שולטת בהתקדמות (scrub), והאזור ננעל במקום (pin) עד שהחתימה מושלמת.
const INK_COLOR = "#5c1f2b"; // בורדו-יין עמוק

export default function InkBlessing() {
  const sectionRef = useRef(null);
  const svgRef = useRef(null);
  const hintRef = useRef(null);

  useEffect(() => {
    let ctx;
    let cancelled = false;
    (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);

      const glyphs = Array.from(svgRef.current.querySelectorAll("path.ink-glyph"));
      const flourish = svgRef.current.querySelector("path.ink-flourish");
      const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      ctx = gsap.context(() => {
        // הכנה: כל נתיב מוסתר כקו מקווקו באורך המלא שלו
        [...glyphs, flourish].forEach((p) => {
          const len = Math.ceil(p.getTotalLength()) + 2;
          gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
        });
        gsap.set(glyphs, { fillOpacity: 0 });

        if (reduce) {
          // נגישות: בלי תנועה — מציגים את הברכה מוכנה
          gsap.set([...glyphs, flourish], { strokeDashoffset: 0 });
          gsap.set(glyphs, { fillOpacity: 1 });
          return;
        }

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: () => "+=" + Math.round(window.innerHeight * 2.8),
            pin: true,
            scrub: 1, // סנכרון מלא לגלילה, עם החלקה עדינה של שנייה
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        tl.to(hintRef.current, { autoAlpha: 0, duration: 0.6 }, 0);
        const STEP = 0.22;
        glyphs.forEach((p, i) => {
          const sig = p.dataset.sig === "1";
          const t = 0.3 + i * STEP + (sig ? 0.8 : 0); // הפסקה קטנה לפני החתימה
          tl.to(p, { strokeDashoffset: 0, duration: sig ? 0.8 : 0.6 }, t);
          tl.to(p, { fillOpacity: 1, duration: 0.5, ease: "power1.out" }, t + 0.4);
        });
        tl.to(flourish, { strokeDashoffset: 0, duration: 1.4, ease: "power2.inOut" }, ">-0.2");
        tl.to({}, { duration: 0.8 }); // רגע להתבונן בחתימה המושלמת לפני השחרור
      }, sectionRef);
    })();

    return () => {
      cancelled = true;
      if (ctx) ctx.revert();
    };
  }, []);

  return (
    <section ref={sectionRef} className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="relative w-full max-w-xl rounded-[28px] border border-[#CBB089]/40 bg-gradient-to-b from-[#FFFDF8] to-[#F8F0E3] px-6 pb-8 pt-10 shadow-[0_24px_60px_-24px_rgba(92,31,43,0.35)]">
        <p className="mb-6 text-center text-[11px] font-semibold tracking-[0.45em] text-[#B08D57]">ברכת הרב</p>
        <svg ref={svgRef} viewBox={INK.viewBox} className="block h-auto w-full" role="img" aria-label='"ברכה להצלחה רבה במיזם השידוכים על טהרת הקדש. שירבו בתים נאמנים בישראל! ברכת כוח"ט לשנה טובה ומתוקה!" — הרב יצחק גינזבורג'>
          {INK.lines.flat().map((d, i) => (
            <path key={`l${i}`} className="ink-glyph" d={d} fill={INK_COLOR} stroke={INK_COLOR} strokeWidth="1.1" strokeLinejoin="round" />
          ))}
          {INK.signature.map((d, i) => (
            <path key={`s${i}`} className="ink-glyph" data-sig="1" d={d} fill={INK_COLOR} stroke={INK_COLOR} strokeWidth="1.3" strokeLinejoin="round" />
          ))}
          <path className="ink-flourish" d={INK.flourish} fill="none" stroke={INK_COLOR} strokeWidth="3" strokeLinecap="round" />
        </svg>
        <p ref={hintRef} className="absolute inset-x-0 bottom-3 text-center text-xs text-ink/40">גללו מטה — והברכה תיכתב ✒️</p>
      </div>
    </section>
  );
}
