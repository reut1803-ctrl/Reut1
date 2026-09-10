"use client";

import { Field, TextInput, TextArea, ChipGroup } from "@/components/crm/register/FormBits";

// שאלות שהמנהלת הוסיפה בעצמה דרך ממשק הניהול.
//
// התשובות אינן נשמרות כעמודות חדשות במסד הנתונים אלא מתמזגות לתיאור
// האישי, ולכן אפשר להוסיף ולהסיר שאלות בלי לגעת במבנה כרטיס המועמד
// ובלי לשבור כרטיסים שכבר קיימים.
export default function CustomQuestions({ questions = [], answers = {}, onChange }) {
  if (questions.length === 0) return null;

  const set = (id, value) => onChange({ ...answers, [id]: value });

  return (
    <div className="mt-4 space-y-4">
      {questions.map((q) => {
        const value = answers[q.id] ?? (q.type === "scale" ? 5 : q.type === "chips" ? "" : "");
        return (
          <Field key={q.id} label={q.label || "שאלה"} hint={q.hint} required={q.required}>
            {q.type === "textarea" && (
              <TextArea value={value} onChange={(e) => set(q.id, e.target.value)} rows={4} />
            )}
            {q.type === "text" && <TextInput value={value} onChange={(e) => set(q.id, e.target.value)} />}
            {q.type === "chips" && (
              <ChipGroup options={q.options || []} value={value} onChange={(v) => set(q.id, v)} />
            )}
            {q.type === "scale" && (
              <div className="rounded-2xl border border-[#CFE3EC] bg-white p-3.5">
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={Number(value) || 5}
                  onChange={(e) => set(q.id, Number(e.target.value))}
                  aria-label={q.label}
                  className="w-full accent-[#2E8BA8]"
                />
                <p className="mt-1 text-center text-[12px] font-semibold text-[#1F6E88]">
                  {Number(value) || 5} מתוך 10
                </p>
              </div>
            )}
          </Field>
        );
      })}
    </div>
  );
}
