"use client";

import { daysBetween, heShort, caNow } from "@/lib/time";

// פס ימים נגלל לבחירת יום בטיול
export default function DayStrip({ start, end, value, onChange }: { start?: string | null; end?: string | null; value: string; onChange: (d: string) => void }) {
  const today = caNow().date;
  const days = start && end && start <= end ? daysBetween(start, end) : [value];
  return (
    <div className="daystrip" role="tablist" aria-label="ימי הטיול">
      {days.map((d, i) => (
        <button
          key={d}
          type="button"
          role="tab"
          aria-selected={d === value}
          className={`day ${d === value ? "day--on" : ""} ${d === today ? "day--today" : ""}`}
          onClick={() => onChange(d)}
        >
          <span className="day-n">יום {i + 1}</span>
          <span className="day-d">{heShort(d)}</span>
        </button>
      ))}
    </div>
  );
}
