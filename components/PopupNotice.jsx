"use client";

import { useEffect, useState } from "react";

// חלונית הודעה מהמנהלת - קופצת פעם אחת ביום לנציגים, עם אפשרות סגירה.
export default function PopupNotice({ popup, role }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!popup || !popup.enabled) return;
    if (role === "admin") return; // המנהלת עורכת את ההודעה, לא צריך להקפיץ לה
    const hasContent =
      (popup.message && popup.message.trim()) || (popup.tips && popup.tips.length > 0);
    if (!hasContent) return;
    const today = new Date().toISOString().slice(0, 10);
    try {
      if (localStorage.getItem("popup_seen_" + today)) return; // כבר נראה היום
    } catch (e) {}
    setShow(true);
  }, [popup, role]);

  function close() {
    const today = new Date().toISOString().slice(0, 10);
    try {
      localStorage.setItem("popup_seen_" + today, "1");
    } catch (e) {}
    setShow(false);
  }

  if (!show) return null;

  const tips = (popup.tips || []).filter((t) => t && t.trim());
  const tip = tips.length ? tips[Math.floor(Date.now() / 86400000) % tips.length] : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={close}>
      <div className="w-full max-w-md rounded-3xl bg-cream p-6 shadow-soft" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-bold text-roseDark">📢 עדכון מהמערכת</h2>
          <button onClick={close} className="text-2xl leading-none text-ink/50 hover:text-ink">×</button>
        </div>

        {popup.message && popup.message.trim() && (
          <p className="mb-4 whitespace-pre-wrap text-base leading-relaxed text-ink">{popup.message}</p>
        )}

        {tip && (
          <div className="rounded-2xl bg-blush/60 p-4">
            <p className="mb-1 text-sm font-bold text-roseDark">💡 טיפ שדכנות</p>
            <p className="whitespace-pre-wrap text-base text-ink/90">{tip}</p>
          </div>
        )}

        <button className="btn-primary mt-5 w-full" onClick={close}>הבנתי, תודה</button>
      </div>
    </div>
  );
}
