"use client";

import { useState, useEffect, useRef } from "react";
import DateField from "./DateField";
import { compressImage } from "../lib/image";
import { PERSONAL_FIELDS, REFERENCES_QUESTION, genderLabel } from "../lib/questions";
import { parseCandidateText, PARSE_FIELD_NAMES } from "../lib/parse";

// טופס להוספה/עריכה של מועמד על ידי נציג או מנהלת.
export default function CandidateEditor({ initial, openQuestions, reps, onSave, onCancel, isAdmin = false }) {
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
      description: "",
      restricted: false,
      hiddenFrom: [],
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

  // ----- לוח חכם: הדבקת טקסט / הכתבה קולית + ניתוח -----
  const [showSmart, setShowSmart] = useState(true);
  const [smartText, setSmartText] = useState("");
  const [listening, setListening] = useState(false);
  const [smartNote, setSmartNote] = useState("");
  const recogRef = useRef(null);

  function analyzeSmart() {
    if (!smartText.trim()) { setSmartNote("אין טקסט לניתוח."); return; }
    const { fields, answers, references, description } = parseCandidateText(smartText, openQuestions);
    setForm((f) => {
      const next = { ...f };
      // שיבוץ נקי לשדות האישיים
      Object.entries(fields).forEach(([k, v]) => { if (v) next[k] = v; });
      // שיבוץ נקי לשאלות הפתוחות (כל תשובה בשאלה שלה)
      if (answers && Object.keys(answers).length) {
        next.answers = { ...(f.answers || {}) };
        Object.entries(answers).forEach(([k, v]) => { if (v) next.answers[k] = v; });
      }
      // אנשי קשר / מספרים לבירורים - ממלאים לשדות אנשי הקשר הקיימים
      if (references && references.length) {
        const cur = Array.isArray(f.references) ? [...f.references] : [];
        references.forEach((r) => {
          const slot = cur.findIndex((x) => !x.name && !x.phone);
          if (slot >= 0) cur[slot] = { ...cur[slot], ...r };
          else cur.push(r);
        });
        next.references = cur;
      }
      // התיאור מכיל אך ורק טקסט שנשאר בלי שדה ייעודי
      next.description = description || f.description || "";
      return next;
    });
    const names = Object.keys(fields).map((k) => PARSE_FIELD_NAMES[k] || k);
    const qCount = answers ? Object.keys(answers).length : 0;
    const rCount = references ? references.length : 0;
    const bits = [];
    if (names.length) bits.push(`שדות: ${names.join(", ")}`);
    if (qCount) bits.push(`${qCount} שאלות פתוחות`);
    if (rCount) bits.push(`${rCount} אנשי קשר`);
    setSmartNote(
      bits.length
        ? `✓ שובצו אוטומטית — ${bits.join(" · ")}. רק מה שאין לו שדה נשמר בתיאור. אפשר לבדוק ולתקן לפני שמירה.`
        : "לא זוהו נתונים מפורשים — הטקסט נשמר בתיאור בלבד."
    );
  }

  function toggleMic() {
    const SR = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SR) { setSmartNote("הכתבה קולית נתמכת בדפדפן Chrome. אפשר להדביק טקסט במקום."); return; }
    if (listening) { try { recogRef.current && recogRef.current.stop(); } catch (e) {} return; }
    try {
      const r = new SR();
      r.lang = "he-IL";
      r.continuous = true;
      r.interimResults = false;
      r.onresult = (e) => {
        let t = "";
        for (let i = e.resultIndex; i < e.results.length; i++) t += e.results[i][0].transcript;
        setSmartText((s) => (s ? s + " " : "") + t.trim());
      };
      r.onend = () => setListening(false);
      r.onerror = () => { setListening(false); setSmartNote("ההקלטה נעצרה. נסי שוב או הדביקי טקסט."); };
      recogRef.current = r;
      r.start();
      setListening(true);
      setSmartNote("🎙️ מקשיב… דברי, והטקסט יתווסף. לחיצה נוספת לעצירה.");
    } catch (e) {
      setSmartNote("לא ניתן להפעיל הכתבה קולית במכשיר הזה. אפשר להדביק טקסט.");
    }
  }

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
      {/* לוח חכם: הדבקת טקסט / הכתבה קולית + ניתוח אוטומטי לשדות */}
      <section className="rounded-2xl border-2 border-rose/30 bg-blush/30 p-3">
        <button
          type="button"
          className="flex w-full items-center justify-between text-right"
          onClick={() => setShowSmart((v) => !v)}
        >
          <span className="text-base font-bold text-roseDark">🧠 לוח חכם — הדבקה / הכתבה קולית</span>
          <span className="text-sm text-ink/50">{showSmart ? "▲" : "▼"}</span>
        </button>
        {showSmart && (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-ink/60">הדביקי טקסט חופשי (וואטסאפ/מייל) או הכתיבי בקול — המערכת תשבץ אוטומטית מה שהיא מזהה בוודאות, והשאר יישמר בתיאור. אין ניחושים.</p>
            <textarea
              className="field-input min-h-[110px]"
              placeholder="הדביקי כאן את הטקסט על המועמד/ת…"
              value={smartText}
              onChange={(e) => setSmartText(e.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-primary" onClick={analyzeSmart}>✨ נתח ומלא שדות</button>
              <button type="button" className={`btn-soft ${listening ? "!bg-rose !text-white" : ""}`} onClick={toggleMic}>
                {listening ? "⏹️ עצור הקלטה" : "🎙️ הכתבה קולית"}
              </button>
              {smartText && <button type="button" className="btn-soft" onClick={() => { setSmartText(""); setSmartNote(""); }}>ניקוי</button>}
            </div>
            {smartNote && <p className="rounded-xl bg-white/70 p-2 text-xs font-medium text-ink/80">{smartNote}</p>}
          </div>
        )}
      </section>

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
          <label className="field-label">📝 תיאור אישי / טקסט מקורי</label>
          <textarea
            className="field-input min-h-[90px]"
            placeholder="תיאור חופשי או הטקסט המקורי שהודבק/הוכתב"
            value={form.description || ""}
            onChange={(e) => set("description", e.target.value)}
          />
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
        <label className="flex items-center gap-3 rounded-2xl bg-blush/40 p-3">
          <input type="checkbox" className="h-5 w-5 accent-rose" checked={!!form.restricted} onChange={(e) => set("restricted", e.target.checked)} />
          <span className="text-sm font-medium text-ink">🔒 כרטיס מוגבל — גלוי רק למנהלת ולנציג המשויך (מוסתר משאר הנציגים)</span>
        </label>

        {/* הסתרה נקודתית מנציגים מסוימים - למנהלת בלבד */}
        {isAdmin && (
          <div className="rounded-2xl bg-amber-50 p-3">
            <p className="mb-1 text-sm font-semibold text-amber-800">🙈 הסתרה מנציגים מסוימים (למנהלת בלבד)</p>
            <p className="mb-2 text-xs text-ink/60">סמני נציגים שמהם כרטיס זה יוסתר (למשל מטעמי רגישות או קרבת משפחה). שאר הנציגים ימשיכו לראות כרגיל.</p>
            <div className="space-y-1">
              {(reps || []).map((r) => {
                const hidden = (form.hiddenFrom || []).includes(r.id);
                return (
                  <label key={r.id} className="flex items-center gap-2 text-sm text-ink/80">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-rose"
                      checked={hidden}
                      onChange={(e) => {
                        const cur = form.hiddenFrom || [];
                        set("hiddenFrom", e.target.checked ? [...cur, r.id] : cur.filter((id) => id !== r.id));
                      }}
                    />
                    {r.name}
                  </label>
                );
              })}
              {(reps || []).length === 0 && <p className="text-xs text-ink/40">אין נציגים.</p>}
            </div>
          </div>
        )}
      </section>

      <div className="flex gap-3">
        <button className="btn-primary flex-1" disabled={saving} onClick={handleSave}>{saving ? "שומר…" : "שמירה"}</button>
        <button className="btn-soft flex-1" onClick={handleCancel}>ביטול</button>
      </div>
    </div>
  );
}
