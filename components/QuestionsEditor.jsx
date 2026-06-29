"use client";

import { useState } from "react";
import { updateOpenQuestions } from "../lib/store";

// עריכת השאלות הפתוחות - הרשאת מנהלת בלבד.
export default function QuestionsEditor({ data }) {
  const [questions, setQuestions] = useState(data.openQuestions || []);
  const [saved, setSaved] = useState(false);

  function setLabel(i, value) {
    setQuestions((q) => q.map((item, idx) => (idx === i ? { ...item, label: value } : item)));
  }

  function save() {
    updateOpenQuestions(questions);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-roseDark">⚙️ עריכת שאלות השאלון</h2>
      {questions.map((q, i) => (
        <div key={q.key}>
          <label className="field-label">שאלה {i + 1}</label>
          <textarea className="field-input min-h-[70px]" value={q.label} onChange={(e) => setLabel(i, e.target.value)} />
        </div>
      ))}
      <button className="btn-primary" onClick={save}>{saved ? "נשמר!" : "שמירת שאלות"}</button>
    </div>
  );
}
