"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

const STRIPS = 28;

// דגל מתנופף: הציור נחתך ל-28 רצועות אנכיות, וכל רצועה זזה בגל סינוס
// עם הצללה עדינה — כך נוצרת תחושה של בד אמיתי ברוח.
export default function WavingFlag({
  art,
  label,
  phase = 0,
}: {
  art: { id: string; w: number; h: number };
  label: string;
  phase?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const strips = Array.from(root.querySelectorAll<HTMLDivElement>(".flag-strip"));
    const shades = strips.map((s) => s.querySelector<HTMLDivElement>(".flag-shade")!);
    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(root);
    const tick = (time: number) => {
      if (!visible) return;
      const t = time * 2.6 + phase;
      for (let i = 0; i < STRIPS; i++) {
        const k = i / (STRIPS - 1);
        const a = t - i * 0.34;
        const y = Math.sin(a) * 5.5 * Math.pow(k, 0.85);
        strips[i].style.transform = `translate3d(0, ${y.toFixed(2)}%, 0)`;
        const slope = Math.cos(a) * Math.pow(k, 0.7);
        shades[i].style.background =
          slope > 0
            ? `rgba(20, 20, 40, ${(slope * 0.2).toFixed(3)})`
            : `rgba(255, 255, 255, ${(-slope * 0.22).toFixed(3)})`;
      }
    };
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      io.disconnect();
    };
  }, [phase]);

  const sw = art.w / STRIPS;
  return (
    <div
      ref={ref}
      className="flag"
      style={{ aspectRatio: `${art.w} / ${art.h}` }}
      role="img"
      aria-label={label}
    >
      {Array.from({ length: STRIPS }, (_, i) => (
        <div
          key={i}
          className="flag-strip"
          style={{ left: `${(i * 100) / STRIPS}%`, width: `calc(${100 / STRIPS}% + 0.6px)` }}
        >
          <svg viewBox={`${(i * sw).toFixed(3)} 0 ${sw.toFixed(3)} ${art.h}`} preserveAspectRatio="none">
            <use href={`#${art.id}`} width={art.w} height={art.h} />
          </svg>
          <div className="flag-shade" />
        </div>
      ))}
    </div>
  );
}
