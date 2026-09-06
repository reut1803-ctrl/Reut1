"use client";

import { useEffect, useState } from "react";

// קווים עדינים שמחברים בין כרטיסיות שמדברות על אותו כיוון.
// המיקומים נמדדים מהמסך עצמו אחרי שהכרטיסיות נפרסו, ומתעדכנים בשינוי גודל
// או בגלילה פנימית - כך שהקווים תמיד יושבים בדיוק על הכרטיסיות.
export default function MindMapLines({ containerRef, pairs }) {
  const [lines, setLines] = useState([]);
  const [box, setBox] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const measure = () => {
      const base = container.getBoundingClientRect();
      setBox({ width: base.width, height: base.height });

      const center = (id) => {
        const el = container.querySelector(`[data-note-id="${id}"]`);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: r.left - base.left + r.width / 2, y: r.top - base.top + r.height / 2 };
      };

      const next = [];
      pairs.forEach((pair) => {
        const a = center(pair.from);
        const b = center(pair.to);
        if (!a || !b) return;
        next.push({ id: `${pair.from}-${pair.to}`, a, b, strength: pair.shared.length });
      });
      setLines(next);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    window.addEventListener("resize", measure);
    // מדידה נוספת אחרי שהגופנים והתמונות התייצבו, אחרת הקווים נופלים במקום שגוי
    const t = setTimeout(measure, 350);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
      clearTimeout(t);
    };
  }, [containerRef, pairs]);

  if (lines.length === 0 || box.width === 0) return null;

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-0"
      width={box.width}
      height={box.height}
      aria-hidden="true"
    >
      {lines.map((line) => {
        // עקומה רכה שיוצאת הצידה, כדי שהקו לא יעבור ישר מתחת לכרטיסיות
        const midY = (line.a.y + line.b.y) / 2;
        const bend = Math.min(70, 24 + Math.abs(line.b.y - line.a.y) * 0.16);
        const side = line.a.x <= box.width / 2 ? -1 : 1;
        const cx = (line.a.x + line.b.x) / 2 + bend * side;
        return (
          <path
            key={line.id}
            d={`M ${line.a.x} ${line.a.y} Q ${cx} ${midY} ${line.b.x} ${line.b.y}`}
            fill="none"
            stroke="#E2A396"
            strokeWidth={Math.min(2.2, 1 + line.strength * 0.4)}
            strokeOpacity={0.32}
            strokeDasharray="5 6"
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}
