"use client";

// קופסת טיפ קבועה בראש עמוד המועמדים - מציגה את "טיפ היום" מתוך הטיפים שהמנהלת מגדירה בניהול.
export default function TipBanner({ popup }) {
  // הקופסה מופיעה בכל פעם שיש טיפ - ללא תלות בחלונית הקופצת (enabled).
  if (!popup) return null;
  const tips = (popup.tips || []).filter((t) => t && t.trim());
  if (!tips.length) return null;
  // טיפ יומי מתחלף - אותו טיפ שמופיע גם בחלונית ההודעה.
  const tip = tips[Math.floor(Date.now() / 86400000) % tips.length];

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <div className="mb-1.5 flex items-center justify-end gap-2">
        <span className="text-sm font-bold text-amber-700">טיפ בשידוכים</span>
        <span className="text-lg">💡</span>
      </div>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink/90">{tip}</p>
    </div>
  );
}
