"use client";

import { useState, useEffect } from "react";
import DateField from "./DateField";
import { compressImage } from "../lib/image";
import { PERSONAL_FIELDS, REFERENCES_QUESTION, genderLabel } from "../lib/questions";

// טופס להוספה/עריכה של מועמד על ידי נציג או מנהלת.
export default function CandidateEditor({ initial, openQuestions, reps, onSave, onCancel }) {
  // טיוטה אוטומטית - גם למועמד חדש וגם בעריכת מועמד קיים (לכל מועמד מפתח נפרד)
  const isNew = !initial || !initial.id;
  const DRAFT_KEY = isNew ? "shidduch_draft_admin_new" : `shidduch_draft_edit_${initial.id}`;

  const [form, setForm] = useState(() => {
    const base = {
      gender: "male",
      fullName: "",
      location: "",
      age: "",
      birthDate: "",
      height: "",
      community: "",
      work: "",
      degree: "",
      parentsWork: "",
      phone: "",
      photo: "",
      answers: {},
      references: [
        { name: "", relation: "", phone: "" },
        { name: "", relation: "", phone: "" },
      ],
      assignedRep: "",
      sensitiveInfo: "",
      ...initial,
    };
    if (typeof window !== "undefined") {
      try {
        const r = localStorage.getItem(DRAFT_KEY);
        if (r) return { ...base, ...JSON.parse(r) };
      } catch (e) {}
    }
    return base;
  });

  const [saving, setSaving] = useState(false);

  // שמירת טיוטה אוטומטית בכל שינוי
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    } catch (e) {}
  }, [form, DRAFT_KEY]);

  function clearDraft() {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch (e) {}
  }

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(form);
      clearDraft(); // נמחק רק אחרי שמירה מוצלחת
    } catch (e) {
      alert("השמירה נכשלה. בדקי חיבור לאינטרנט ונסי שוב — המידע שהקלדת נשמר ולא אבד.");
      setSaving(false);
    }
  }

  function handleCancel() {
    clearDraft();
    onCancel();
  }

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }
  function setAnswer(key, value) {
    setForm((f) => ({ ...f, answers: { ...f.answers, [key]: value } }));
  }
  function setRef(i, key, value) {
    setForm((f) => ({
      ...f,
      references: f.references.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)),
    }));
  }
  async function onPhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      set("photo", await compressImage(file));
    } catch (err) {
      /* תמונה לא תקינה - מתעלמים */
    }
  }

  return (
    <div className="space-y-5">
      <section className="space-y-4">
        <div>
          <label className="field-label">מסלול</label>
          <select className="field-input" value={form.gender} onChange={(e) => set("gender", e.target.value)}>
            <option value="male">בחור</option>
            <option value="female">בחורה</option>
          </select>
        </div>
        {PERSONAL_FIELDS.map((f) => (
          <div key={f.key}>
            <label className="field-label">{genderLabel(f, form.gender)}</label>
            {f.type === "date" ? (
              <DateField value={form[f.key]} onChange={(v) => set(f.key, v)} />
            ) : (
              <input
                className="field-input"
                type={f.type}
                value={form[f.key] || ""}
                onChange={(e) => set(f.key, e.target.value)}
              />
            )}
          </div>
        ))}
        <div>
          <label className="field-label">📷 תמונה</label>
          <input className="field-input" type="file" accept="image/*" onChange={onPhoto} />
          {form.photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.photo} alt="תמונה" className="mt-3 h-24 w-24 rounded-2xl object-cover" />
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-semibold text-ink">💬 שאלות</h3>
        {(openQuestions || []).map((q) => (
          <div key={q.key}>
            <label className="field-label">{genderLabel(q, form.gender)}</label>
            <textarea
              className="field-input min-h-[80px]"
              value={form.answers?.[q.key] || ""}
              onChange={(e) => setAnswer(q.key, e.target.value)}
            />
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <h3 className="font-semibold text-ink">🌈 אנשי קשר</h3>
        <p className="text-xs text-ink/60">{REFERENCES_QUESTION}</p>
        {form.references.map((r, i) => (
          <div key={i} className="space-y-2 rounded-2xl bg-blush/40 p-3">
            <input className="field-input" placeholder="שם" value={r.name} onChange={(e) => setRef(i, "name", e.target.value)} />
            <input className="field-input" placeholder="מה הם בשבילך" value={r.relation} onChange={(e) => setRef(i, "relation", e.target.value)} />
            <input className="field-input" placeholder="טלפון" value={r.phone} onChange={(e) => setRef(i, "phone", e.target.value)} />
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <div>
          <label className="field-label">שיוך נציג</label>
          <select className="field-input" value={form.assignedRep || ""} onChange={(e) => set("assignedRep", e.target.value)}>
            <option value="">ללא שיוך</option>
            {(reps || []).map((r) => (
              <option key={r.id} value={r.id}>{r.name} ({r.institution})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label">🔒 מידע רגיש (גלוי רק לנציג ולמנהלת)</label>
          <textarea
            className="field-input min-h-[80px]"
            placeholder="מסקנות אישיות ומספרי טלפון לבירורים"
            value={form.sensitiveInfo || ""}
            onChange={(e) => set("sensitiveInfo", e.target.value)}
          />
        </div>
      </section>

      <div className="flex gap-3">
        <button className="btn-primary flex-1" disabled={saving} onClick={handleSave}>{saving ? "שומר…" : "שמירה"}</button>
        <button className="btn-soft flex-1" onClick={handleCancel}>ביטול</button>
      </div>
    </div>
  );
}
