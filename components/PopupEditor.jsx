"use client";

import { useState } from "react";
import { updatePopup } from "../lib/store";

// עריכת חלונית ההודעות והטיפים - הרשאת מנהלת בלבד.
export default function PopupEditor({ data }) {
  const p = data.popup || { enabled: false, message: "", tips: [] };
  const [enabled, setEnabled] = useState(!!p.enabled);
  const [message, setMessage] = useState(p.message || "");
  const [tips, setTips] = useState(p.tips && p.tips.length ? p.tips : [""]);
  const [saved, setSaved] = useState(false);

  function setTip(i, v) {
    setTips((t) => t.map((x, idx) => (idx === i ? v : x)));
  }
  function addTip() {
    setTips((t) => [...t, ""]);
  }
  function removeTip(i) {
    setTips((t) => t.filter((_, idx) => idx !== i));
  }

  function save() {
    updatePopup({
      enabled,
      message: message.trim(),
      tips: tips.map((t) => t.trim()).filter(Boolean),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-roseDark">📢 חלונית הודעות וטיפים</h2>
      <p className="text-xs text-ink/60">חלונית שקופצת לנציגים פעם אחת ביום. אפשר להפעיל/לכבות, לערוך את ההודעה ולהוסיף טיפים שיתחלפו.</p>

      <div className="card space-y-3">
        {/* מתג הפעלה/כיבוי */}
        <label className="flex items-center gap-3">
          <input type="checkbox" className="h-5 w-5 accent-rose" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          <span className="font-semibold text-ink">{enabled ? "החלונית מופעלת ✅" : "החלונית כבויה"}</span>
        </label>

        <div>
          <label className="field-label">הודעת עדכון (מוצגת למעלה בחלונית)</label>
          <textarea className="field-input min-h-[80px]" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="למשל: יש מועמדים חדשים בערוץ, כדאי לעבור עליהם 🙂" />
        </div>

        <div>
          <label className="field-label">טיפים מקצועיים (מתחלפים מיום ליום)</label>
          {tips.map((t, i) => (
            <div key={i} className="mb-2 flex items-start gap-2">
              <textarea className="field-input min-h-[56px]" value={t} onChange={(e) => setTip(i, e.target.value)} placeholder={`טיפ ${i + 1}`} />
              <button className="btn-soft !px-3 text-roseDark" onClick={() => removeTip(i)}>🗑️</button>
            </div>
          ))}
          <button className="btn-soft" onClick={addTip}>➕ הוספת טיפ</button>
        </div>

        <button className="btn-primary" onClick={save}>{saved ? "נשמר!" : "שמירה"}</button>
      </div>
    </div>
  );
}
