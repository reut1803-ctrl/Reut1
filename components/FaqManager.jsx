"use client";

import { useState } from "react";
import { addFaq, updateFaq, deleteFaq } from "../lib/store";
import { Plus, Trash2, HelpCircle } from "lucide-react";

// ניהול שאלות ותשובות (FAQ) למרכז ההכשרה של השגרירים — הרשאת מנהלת.
// מבנה פשוט: כותרת (שאלה) + תוכן (תשובה). נשמר דינמית ב-Firestore.
export default function FaqManager({ data }) {
  const [q, setQ] = useState("");
  const [a, setA] = useState("");
  const faq = data.faq || [];

  function add() {
    if (!q.trim() || !a.trim()) return;
    addFaq({ question: q.trim(), answer: a.trim() });
    setQ("");
    setA("");
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-ink/60">
        השאלות והתשובות שמופיעות לשגרירים במסך "המועמדים שלי" (מרכז ההכשרה). כל שינוי כאן מתעדכן אצלם מיד.
      </p>

      {/* הוספת שאלה חדשה */}
      <div className="card space-y-2 border-2 border-rose/30">
        <p className="flex items-center gap-1.5 text-base font-bold text-roseDark"><Plus className="h-4 w-4" strokeWidth={2} /> הוספת שאלה חדשה</p>
        <input className="field-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="כותרת — השאלה (למשל: כל כמה זמן ליצור קשר?)" />
        <textarea className="field-input min-h-[80px]" value={a} onChange={(e) => setA(e.target.value)} placeholder="תוכן — התשובה" />
        <button className="btn-primary w-full" disabled={!q.trim() || !a.trim()} onClick={add}>הוספת שאלה</button>
      </div>

      {/* שאלות קיימות */}
      <p className="pt-1 text-sm font-semibold text-ink/70">שאלות קיימות ({faq.length}):</p>
      {faq.length === 0 && (
        <p className="rounded-2xl bg-blush/30 p-4 text-sm text-ink/50">
          עדיין לא הוגדרו שאלות. עד שתוסיפי — יוצגו לשגרירים 3 שאלות ברירת מחדל.
        </p>
      )}
      {faq.map((f) => (
        <div key={f.id} className="card space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-roseDark"><HelpCircle className="h-4 w-4" strokeWidth={1.75} /> שאלה</div>
          <input className="field-input" value={f.question || ""} onChange={(e) => updateFaq(f.id, { question: e.target.value })} placeholder="השאלה" />
          <div className="text-xs font-semibold text-ink/50">תשובה</div>
          <textarea className="field-input min-h-[72px]" value={f.answer || ""} onChange={(e) => updateFaq(f.id, { answer: e.target.value })} placeholder="התשובה" />
          <button className="btn-soft text-roseDark" onClick={() => { if (confirm(`למחוק את השאלה "${f.question}"?`)) deleteFaq(f.id); }}><Trash2 className="h-4 w-4" strokeWidth={1.75} /> מחיקה</button>
        </div>
      ))}
    </div>
  );
}
