"use client";

import { useState } from "react";
import { updateMazalTov } from "../lib/store";

// ניהול פופ-אפ "מזל טוב" - הרשאת מנהלת בלבד.
export default function MazalTovEditor({ data }) {
  const mt = data.mazalTov || {};
  const [coupleA, setCoupleA] = useState(mt.coupleA || "");
  const [coupleB, setCoupleB] = useState(mt.coupleB || "");
  const [matchmakers, setMatchmakers] = useState(mt.matchmakers || "");
  const [message, setMessage] = useState(mt.message || "");
  const [saved, setSaved] = useState("");

  function publish() {
    if (!coupleA.trim() && !coupleB.trim()) { setSaved("יש להזין לפחות שם אחד."); return; }
    updateMazalTov({
      enabled: true,
      coupleA: coupleA.trim(),
      coupleB: coupleB.trim(),
      matchmakers: matchmakers.trim(),
      message: message.trim(),
      id: Date.now().toString(), // מזהה חדש - הפופ-אפ יקפוץ לכולם מחדש
    });
    setSaved("🎉 פורסם! הפופ-אפ יופיע לכל מי שנכנס.");
    setTimeout(() => setSaved(""), 2500);
  }

  function clearAll() {
    if (!confirm("להסיר את פופ-אפ המזל טוב לגמרי?")) return;
    updateMazalTov({ enabled: false, coupleA: "", coupleB: "", matchmakers: "", message: "", id: "" });
    setCoupleA(""); setCoupleB(""); setMatchmakers(""); setMessage("");
    setSaved("הפופ-אפ הוסר.");
    setTimeout(() => setSaved(""), 2500);
  }

  return (
    <div className="card space-y-2">
      <h2 className="text-lg font-bold text-roseDark">🎉 פופ-אפ מזל טוב</h2>
      <p className="text-xs text-ink/60">הזיני זוג שהשתדך — יופיע פופ-אפ חגיגי עם נצנצים לכל מי שנכנס לאתר.</p>

      {mt.enabled && (
        <div className="rounded-2xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
          פעיל כעת: {mt.coupleA} 💞 {mt.coupleB}
        </div>
      )}

      <input className="field-input" value={coupleA} onChange={(e) => setCoupleA(e.target.value)} placeholder="שם החתן / הבן" />
      <input className="field-input" value={coupleB} onChange={(e) => setCoupleB(e.target.value)} placeholder="שם הכלה / הבת" />
      <input className="field-input" value={matchmakers} onChange={(e) => setMatchmakers(e.target.value)} placeholder="שמות השדכנים (למשל: דבורה ואוריאל)" />
      <input className="field-input" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="ברכה (לא חובה) — למשל: בשעה טובה ומוצלחת!" />

      <div className="flex flex-wrap gap-2">
        <button className="btn-primary" onClick={publish}>🎉 פרסום מזל טוב</button>
        <button className="btn-soft text-roseDark" onClick={clearAll}>הסרה / איפוס</button>
      </div>
      {saved && <p className="text-sm font-medium text-roseDark">{saved}</p>}
    </div>
  );
}
