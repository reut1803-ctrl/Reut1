"use client";

import { useState } from "react";
import { updateOpenQuestions, updateIntro } from "../lib/store";

// עריכת ההקדמה והשאלות הפתוחות עם ניסוח נפרד לזכר ולנקבה - הרשאת מנהלת בלבד.
export default function QuestionsEditor({ data }) {
  const [questions, setQuestions] = useState(data.openQuestions || []);
  const [intro, setIntroState] = useState(data.intro || { male: "", female: "" });
  const [saved, setSaved] = useState(false);
  const [introSaved, setIntroSaved] = useState(false);

  function setText(i, field, value) {
    setQuestions((q) => q.map((item, idx) => (idx === i ? { ...item, [field]: value } : item)));
  }

  function save() {
    updateOpenQuestions(questions);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  function saveIntro() {
    updateIntro(intro);
    setIntroSaved(true);
    setTimeout(() => setIntroSaved(false), 1500);
  }

  return (
    <div className="space-y-4">
      {/* עריכת ההקדמה לשאלון */}
      <div className="card space-y-3">
        <h2 className="text-lg font-bold text-roseDark">☕ עריכת ההקדמה לשאלון</h2>
        <p className="text-sm text-ink/60">הטקסט שמופיע למעלה בשאלון, אחרי בחירת המסלול.</p>
        <div>
          <label className="field-label">הקדמה לבחור 👤</label>
          <textarea className="field-input min-h-[80px]" value={intro.male || ""} onChange={(e) => setIntroState({ ...intro, male: e.target.value })} />
        </div>
        <div>
          <label className="field-label">הקדמה לבחורה 👤</label>
          <textarea className="field-input min-h-[80px]" value={intro.female || ""} onChange={(e) => setIntroState({ ...intro, female: e.target.value })} />
        </div>
        <button className="btn-primary" onClick={saveIntro}>{introSaved ? "נשמר!" : "שמירת הקדמה"}</button>
      </div>

      <h2 className="text-lg font-bold text-roseDark">⚙️ עריכת שאלות השאלון</h2>
      <p className="text-sm text-ink/60">לכל שאלה אפשר לכתוב ניסוח לבחור ולבחורה בנפרד.</p>
      {questions.map((q, i) => (
        <div key={q.key} className="card space-y-3">
          <p className="text-sm font-semibold text-ink">שאלה {i + 1}</p>
          <div>
            <label className="field-label">ניסוח לבחור 👤</label>
            <textarea className="field-input min-h-[70px]" value={q.male || ""} onChange={(e) => setText(i, "male", e.target.value)} />
          </div>
          <div>
            <label className="field-label">ניסוח לבחורה 👤</label>
            <textarea className="field-input min-h-[70px]" value={q.female || ""} onChange={(e) => setText(i, "female", e.target.value)} />
          </div>
        </div>
      ))}
      <button className="btn-primary" onClick={save}>{saved ? "נשמר!" : "שמירת שאלות"}</button>
    </div>
  );
}
