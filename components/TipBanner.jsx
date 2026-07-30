"use client";

import { useState, useRef } from "react";

// קופסת טיפ בראש עמוד המועמדים - קרוסלה הניתנת להחלקה בין כל הטיפים הפעילים.
export default function TipBanner({ popup }) {
  const tips = ((popup && popup.tips) || []).filter((t) => t && t.trim());

  // טיפ פתיחה - "טיפ היום" המתחלף; משם אפשר להחליק לשאר.
  const startIndex = tips.length ? Math.floor(Date.now() / 86400000) % tips.length : 0;
  const [index, setIndex] = useState(startIndex);
  const touchX = useRef(null);

  if (!tips.length) return null;

  const n = tips.length;
  const cur = ((index % n) + n) % n; // אינדקס בטוח (עם גלישה מעגלית)

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
    <div
      data-tour="tip"
      className="select-none rounded-2xl border border-amber-200 bg-amber-50 p-4"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="mb-1.5 flex items-center justify-end gap-2">
        <span className="text-sm font-bold text-amber-700">טיפ בשידוכים</span>
        <span className="text-lg">💡</span>
      </div>

      <p className="min-h-[2.5rem] whitespace-pre-wrap text-sm leading-relaxed text-ink/90">{tips[cur]}</p>

      {/* נקודות ניווט - מופיעות רק כשיש יותר מטיפ אחד */}
      {n > 1 && (
        <div className="mt-3 flex items-center justify-center gap-1.5">
          {tips.map((_, i) => (
            <button
              key={i}
              aria-label={`טיפ ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all ${i === cur ? "w-4 bg-amber-600" : "w-2 bg-amber-300"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
