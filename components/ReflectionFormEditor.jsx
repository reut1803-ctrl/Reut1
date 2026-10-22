"use client";

import { useEffect, useState } from "react";
import { updateReflectionForm, DEFAULT_REFLECTION_FORM } from "../lib/store";
import { Plus, Trash2, ArrowUp, ArrowDown, Check } from "lucide-react";

// עריכת טופס "איך עבר החודש?" — פתיח + שאלות (נוסח השאלה + הכוונה קטנה בתוך התיבה).
// נשמר ב-meta/config, והשגרירים רואים את הנוסח המעודכן מיד.
export default function ReflectionFormEditor({ data }) {
  const current = data.reflectionForm || DEFAULT_REFLECTION_FORM;
  const [form, setForm] = useState(current);
  const [state, setState] = useState("idle"); // idle | saving | saved | error
  const dirty = JSON.stringify(form) !== JSON.stringify(current);

  // אם ההגדרות נטענו/השתנו מהשרת ואין עריכה פתוחה — לסנכרן
  useEffect(() => {
    if (!dirty) setForm(current);
  }, [JSON.stringify(current)]); // eslint-disable-line react-hooks/exhaustive-deps

  const setQ = (i, patch) => setForm((f) => ({ ...f, questions: f.questions.map((q, j) => (j === i ? { ...q, ...patch } : q)) }));
  const move = (i, d) => setForm((f) => {
    const qs = [...f.questions]; const j = i + d;
    if (j < 0 || j >= qs.length) return f;
    [qs[i], qs[j]] = [qs[j], qs[i]];
    return { ...f, questions: qs };
  });
  const add = () => setForm((f) => ({ ...f, questions: [...f.questions, { id: `q${Date.now().toString(36)}`, label: "", hint: "" }] }));
  const remove = (i) => setForm((f) => ({ ...f, questions: f.questions.filter((_, j) => j !== i) }));

  const valid = form.questions.length > 0 && form.questions.every((q) => q.label.trim());
  async function save() {
    if (!valid) return;
    setState("saving");
    try {
      await updateReflectionForm({
        intro: (form.intro || "").trim(),
        questions: form.questions.map((q) => ({ id: q.id, label: q.label.trim(), hint: (q.hint || "").trim() })),
      });
      setState("saved");
      setTimeout(() => setState("idle"), 1600);
    } catch (e) {
      setState("error");
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-ink/60">הנוסח שהשגרירים רואים בטופס "איך עבר החודש?". השינוי חל על סיכומים חדשים; סיכומים שכבר מולאו נשמרים עם השאלות שנשאלו אז.</p>

      <div className="card space-y-2">
        <label className="field-label">פתיח (מוצג מעל השאלות)</label>
        <textarea className="field-input min-h-[70px]" value={form.intro || ""} onChange={(e) => setForm((f) => ({ ...f, intro: e.target.value }))} />
      </div>

      {form.questions.map((q, i) => (
        <div key={q.id} className="card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-roseDark">שאלה {i + 1}</span>
            <span className="flex items-center gap-1">
              <button className="rounded-lg p-1.5 text-ink/50 hover:bg-blush disabled:opacity-30" disabled={i === 0} onClick={() => move(i, -1)} aria-label="הזזה למעלה"><ArrowUp className="h-4 w-4" /></button>
              <button className="rounded-lg p-1.5 text-ink/50 hover:bg-blush disabled:opacity-30" disabled={i === form.questions.length - 1} onClick={() => move(i, 1)} aria-label="הזזה למטה"><ArrowDown className="h-4 w-4" /></button>
              <button className="rounded-lg p-1.5 text-roseDark hover:bg-blush disabled:opacity-30" disabled={form.questions.length <= 1} onClick={() => remove(i)} aria-label="מחיקה"><Trash2 className="h-4 w-4" /></button>
            </span>
          </div>
          <input className="field-input" value={q.label} onChange={(e) => setQ(i, { label: e.target.value })} placeholder="נוסח השאלה" />
          <input className="field-input text-sm" value={q.hint || ""} onChange={(e) => setQ(i, { hint: e.target.value })} placeholder="הכוונה קטנה בתוך התיבה (לא חובה)" />
        </div>
      ))}

      <button className="btn-soft w-full" onClick={add}><Plus className="h-4 w-4" strokeWidth={2} /> הוספת שאלה</button>

      <div className="flex gap-2">
        <button className="btn-primary flex-1" disabled={!valid || !dirty || state === "saving"} onClick={save}>
          {state === "saving" ? "שומר…" : state === "saved" ? (<><Check className="h-4 w-4" strokeWidth={2.25} /> נשמר</>) : "שמירת הטופס"}
        </button>
        {dirty && <button className="btn-soft" onClick={() => setForm(current)}>ביטול שינויים</button>}
      </div>
      {!valid && <p className="text-xs text-roseDark">לכל שאלה צריך נוסח, ולפחות שאלה אחת בטופס.</p>}
      {state === "error" && <p className="text-xs text-roseDark">השמירה נכשלה — בדקי חיבור ונסי שוב.</p>}
    </div>
  );
}
