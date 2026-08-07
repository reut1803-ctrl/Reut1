"use client";

import { useEffect, useMemo, useState } from "react";

const COLORS = ["#E8A0BF", "#A84F4F", "#F6C90E", "#7ED957", "#5AA9E6", "#C77DFF", "#FF9F45"];
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// פופ-אפ חגיגי "מזל טוב" לזוג שהשתדך - עם נצנצים.
// מופיע לכל מי שנכנס; אם סגר (X) - לא יופיע שוב שבוע (או עד שהמנהלת מאפסת/מזינה זוג חדש).
export default function MazalTovPopup({ mazalTov }) {
  const [show, setShow] = useState(false);
  const mt = mazalTov || {};
  const id = mt.id || "default";
  const hasContent = mt.enabled && (mt.coupleA || mt.coupleB);

  useEffect(() => {
    if (!hasContent) { setShow(false); return; }
    const key = `mazaltov_seen_${id}`;
    let seenAt = 0;
    try { seenAt = parseInt(localStorage.getItem(key) || "0", 10) || 0; } catch (e) {}
    if (!seenAt || Date.now() - seenAt > WEEK_MS) setShow(true);
    else setShow(false);
  }, [id, hasContent]);

  // חתיכות נצנצים (נוצרות פעם אחת)
  const pieces = useMemo(
    () =>
      Array.from({ length: 70 }).map((_, i) => ({
        left: Math.random() * 100,
        color: COLORS[i % COLORS.length],
        delay: Math.random() * 3,
        duration: 3 + Math.random() * 3,
        size: 7 + Math.random() * 8,
      })),
    []
  );

  function close() {
    try { localStorage.setItem(`mazaltov_seen_${id}`, String(Date.now())); } catch (e) {}
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onClick={close}>
      {/* נצנצים */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {pieces.map((p, i) => (
          <span
            key={i}
            className="confetti-piece"
            style={{
              left: `${p.left}%`,
              background: p.color,
              width: `${p.size}px`,
              height: `${p.size * 1.4}px`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
            }}
          />
        ))}
      </div>

      <div className="relative w-full max-w-md rounded-3xl bg-cream p-7 text-center shadow-soft" onClick={(e) => e.stopPropagation()}>
        <button onClick={close} className="absolute left-4 top-3 text-2xl leading-none text-ink/40 hover:text-ink">×</button>
        <div className="mb-2 text-5xl">🎉💍🎉</div>
        <h2 className="mb-3 text-3xl font-extrabold text-roseDark">מזל טוב!</h2>
        <p className="text-2xl font-bold text-ink">
          {mt.coupleA || "—"} <span className="text-rose">💞</span> {mt.coupleB || "—"}
        </p>
        <p className="mt-3 text-lg text-ink/80">{mt.message || "בשעה טובה ומוצלחת! 🥂"}</p>
        {mt.matchmakers && (
          <p className="mt-3 rounded-2xl bg-blush/60 px-4 py-2 text-base font-semibold text-roseDark">
            שידוך בזכות: {mt.matchmakers}
          </p>
        )}
        <button className="btn-primary mt-6 w-full" onClick={close}>שנשמע בשורות טובות 🎊</button>
      </div>
    </div>
  );
}
