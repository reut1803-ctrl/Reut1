"use client";

// ניהול הטופס והתכנים — מסך למנהלת בלבד.
//
// כל מה שנערך כאן נשמר במסד הנתונים ומשתקף מיד בטופס הציבורי,
// בנספחים ובמסכי התשלום. אין צורך בפריסת קוד מחדש.
//
// שדות הליבה נעולים במכוון: מבנה כרטיס המועמד נשען עליהם, ומחיקה או
// שינוי מזהה שלהם היו שוברים את המאגר. מה שכן פתוח בהם — הכיתוב.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Settings2, Link2, CreditCard, FileText, ListPlus, Lock, Check, Loader2,
  Trash2, ChevronUp, ChevronDown, Plus, ExternalLink, AlertTriangle,
} from "lucide-react";
import { useCrmStore } from "@/lib/crm/store";
import {
  CORE_FIELDS, QUESTION_TYPES, newQuestion, mergeContent, isCoreRequired,
} from "@/lib/crm/publicContent";
import Button from "@/components/crm/ui/Button";
import ConfirmDialog from "@/components/crm/ui/ConfirmDialog";

const INPUT =
  "w-full rounded-2xl border border-[#CFE3EC] bg-white px-3.5 py-2.5 text-[14px] text-[#23414E] outline-none transition focus:border-[#2E8BA8] focus:ring-2 focus:ring-[#2E8BA8]/20";

function Section({ icon: Icon, title, hint, children }) {
  return (
    <section className="mt-5 rounded-3xl border border-[#CFE3EC] bg-white p-4 shadow-[0_4px_18px_rgba(31,110,136,0.06)]">
      <h2 className="flex items-center gap-1.5 text-[15px] font-bold text-[#1F6E88]">
        <Icon size={17} /> {title}
      </h2>
      {hint && <p className="mt-1 text-[12px] leading-relaxed text-[#5E7A87]">{hint}</p>}
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12.5px] font-semibold text-[#23414E]">{label}</span>
      {hint && <span className="mb-1 block text-[11.5px] text-[#5E7A87]">{hint}</span>}
      {children}
    </label>
  );
}

export default function FormSettingsPage() {
  const role = useCrmStore((s) => s.role);
  const saved = useCrmStore((s) => s.publicContent);
  const loaded = useCrmStore((s) => s.publicContentLoaded);
  const savePublicContent = useCrmStore((s) => s.savePublicContent);
  const showToast = useCrmStore((s) => s.showToast);

  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);

  // הטיוטה נטענת פעם אחת מהשמור, כדי שהקלדה לא תידרס בכל עדכון מהשרת
  useEffect(() => {
    if (loaded && draft === null) setDraft(mergeContent(saved));
  }, [loaded, saved, draft]);

  const dirty = useMemo(
    () => draft !== null && JSON.stringify(draft) !== JSON.stringify(mergeContent(saved)),
    [draft, saved]
  );

  if (role !== "admin") {
    return <p className="px-4 py-10 text-center text-sm text-[#5E7A87]">אזור זה זמין למנהלת בלבד</p>;
  }
  if (!draft) return <p className="px-4 py-10 text-center text-sm text-[#5E7A87]">טוען...</p>;

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const setIn = (key, patch) => set({ [key]: { ...draft[key], ...patch } });

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await savePublicContent(draft);
      showToast("התוכן עודכן והוא כבר באוויר");
    } catch {
      setError("השמירה לא הצליחה. אפשר לנסות שוב בעוד רגע.");
    } finally {
      setSaving(false);
    }
  };

  // --- שאלות דינמיות ---
  const updateQ = (id, patch) =>
    set({ questions: draft.questions.map((q) => (q.id === id ? { ...q, ...patch } : q)) });
  const addQ = (step) => set({ questions: [...draft.questions, newQuestion(step)] });
  const removeQ = (id) => set({ questions: draft.questions.filter((q) => q.id !== id) });
  const moveQ = (id, dir) => {
    const list = [...draft.questions];
    const i = list.findIndex((q) => q.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    set({ questions: list });
  };

  return (
    <div className="px-4 py-6 pb-28">
      <h1 className="flex items-center gap-2 text-xl font-bold text-[#23414E]">
        <Settings2 size={22} /> ניהול הטופס והתכנים
      </h1>
      <p className="mt-1 text-[13px] leading-relaxed text-[#5E7A87]">
        כל שינוי כאן משתקף מיד בטופס הציבורי ובנספחים, בלי צורך בעדכון תוכנה.
      </p>

      {/* ---------- קישור חיצוני ---------- */}
      <Section
        icon={Link2}
        title="קישור לטופס חיצוני"
        hint="כשהשדה ריק, פועל הטופס הפנימי של המערכת — זו ברירת המחדל. אם תזיני כאן כתובת של טופס חיצוני, כל כפתורי ההרשמה באתר יפנו אליו במקום."
      >
        <Field label="כתובת הטופס החיצוני (לא חובה)">
          <input
            className={INPUT}
            dir="ltr"
            placeholder="https://forms.gle/..."
            value={draft.externalFormUrl}
            onChange={(e) => set({ externalFormUrl: e.target.value })}
          />
        </Field>
        {draft.externalFormUrl ? (
          <p className="flex items-start gap-1.5 rounded-2xl bg-[#EAF5FA] px-3 py-2.5 text-[12px] leading-relaxed text-[#1F6E88]">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            שימי לב: כשקישור חיצוני פעיל, פניות אינן נכנסות לתיבת הפניות שבלוח הבקרה, והשאלות
            שמוגדרות למטה אינן בשימוש. הן ינוהלו במערכת החיצונית.
          </p>
        ) : (
          <Link
            href="/register/"
            target="_blank"
            className="flex items-center justify-center gap-1.5 rounded-2xl border border-[#CFE3EC] py-2.5 text-[13px] font-semibold text-[#2E8BA8]"
          >
            <ExternalLink size={14} /> פתיחת הטופס הפנימי לצפייה
          </Link>
        )}
      </Section>

      {/* ---------- תשלום ---------- */}
      <Section
        icon={CreditCard}
        title="קישורי תשלום"
        hint="מתעדכן מיד במסך שאחרי השליחה ובאזור האישי של המועמדים."
      >
        <Field label="קישור PayBox">
          <input
            className={INPUT}
            dir="ltr"
            placeholder="https://payboxapp.page.link/..."
            value={draft.payment.payboxUrl}
            onChange={(e) => setIn("payment", { payboxUrl: e.target.value })}
          />
        </Field>
        <Field label="מספר טלפון לביט">
          <input
            className={INPUT}
            dir="ltr"
            placeholder="050-1234567"
            value={draft.payment.bitPhone}
            onChange={(e) => setIn("payment", { bitPhone: e.target.value })}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="מחיר המסלול האישי (₪)">
            <input
              type="number"
              className={INPUT}
              value={draft.payment.personalTrackPrice}
              onChange={(e) => setIn("payment", { personalTrackPrice: Number(e.target.value) || 0 })}
            />
          </Field>
          <Field label="דמי הצלחה (₪)">
            <input
              type="number"
              className={INPUT}
              value={draft.payment.successFee}
              onChange={(e) => setIn("payment", { successFee: Number(e.target.value) || 0 })}
            />
          </Field>
        </div>
      </Section>

      {/* ---------- טקסטים ---------- */}
      <Section icon={FileText} title="הטקסטים בטופס">
        <Field label="כותרת הפתיחה">
          <input className={INPUT} value={draft.intro.title} onChange={(e) => setIn("intro", { title: e.target.value })} />
        </Field>
        <Field label="הודעת הפתיחה">
          <textarea rows={3} className={INPUT} value={draft.intro.body} onChange={(e) => setIn("intro", { body: e.target.value })} />
        </Field>
        <Field label="ההערה המודגשת בפתיחה">
          <input className={INPUT} value={draft.intro.note} onChange={(e) => setIn("intro", { note: e.target.value })} />
        </Field>
        <Field label="שמות ארבעת השלבים">
          <div className="space-y-2">
            {draft.stepTitles.map((t, i) => (
              <input
                key={i}
                className={INPUT}
                value={t}
                onChange={(e) => {
                  const next = [...draft.stepTitles];
                  next[i] = e.target.value;
                  set({ stepTitles: next });
                }}
              />
            ))}
          </div>
        </Field>
        <Field label="כותרת מסך התודה">
          <input className={INPUT} value={draft.thankYou.title} onChange={(e) => setIn("thankYou", { title: e.target.value })} />
        </Field>
        <Field label="הודעת מסך התודה">
          <textarea rows={3} className={INPUT} value={draft.thankYou.body} onChange={(e) => setIn("thankYou", { body: e.target.value })} />
        </Field>
      </Section>

      {/* ---------- שדות הליבה ---------- */}
      <Section
        icon={Lock}
        title="שדות הליבה"
        hint="השדות שמבנה כרטיס המועמד נשען עליהם. אפשר לשנות את הכיתוב שמוצג, ובחלקם גם אם הם חובה. אי אפשר למחוק אותם — זו ההגנה שמונעת שבירה של המאגר."
      >
        {CORE_FIELDS.map((f) => (
          <div key={f.id} className="rounded-2xl border border-[#CFE3EC] p-3">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1 text-[12px] font-bold text-[#1F6E88]">
                {f.locked && <Lock size={11} />} {f.label}
              </span>
              {f.locked ? (
                <span className="rounded-full bg-[#EDF4F8] px-2 py-0.5 text-[10px] font-bold text-[#5E7A87]">חובה קבועה</span>
              ) : (
                <label className="flex items-center gap-1.5 text-[11.5px] font-semibold text-[#23414E]">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[#2E8BA8]"
                    checked={isCoreRequired(draft, f.id)}
                    onChange={(e) =>
                      set({ coreOptional: { ...draft.coreOptional, [f.id]: !e.target.checked } })
                    }
                  />
                  חובה
                </label>
              )}
            </div>
            <input
              className={INPUT}
              placeholder={f.label}
              value={draft.coreLabels[f.id] ?? ""}
              onChange={(e) => set({ coreLabels: { ...draft.coreLabels, [f.id]: e.target.value } })}
            />
            <input
              className={`${INPUT} mt-1.5 text-[12px]`}
              placeholder="הסבר קצר מתחת לשדה (לא חובה)"
              value={draft.coreHints[f.id] ?? ""}
              onChange={(e) => set({ coreHints: { ...draft.coreHints, [f.id]: e.target.value } })}
            />
          </div>
        ))}
      </Section>

      {/* ---------- שאלות דינמיות ---------- */}
      <Section
        icon={ListPlus}
        title="שאלות נוספות"
        hint="שאלות שאת מוסיפה בעצמך. התשובות נכנסות אוטומטית לתיאור האישי של הכרטיס, ולכן הן אינן פותחות עמודות חדשות ואינן משנות את מבנה המאגר."
      >
        {draft.questions.length === 0 && (
          <p className="rounded-2xl bg-[#F2F8FB] px-3 py-3 text-center text-[12.5px] text-[#5E7A87]">
            עדיין לא הוספת שאלות. השאלות שבקוד ממשיכות לעבוד כרגיל.
          </p>
        )}

        {draft.questions.map((q, i) => (
          <div key={q.id} className="rounded-2xl border-2 border-[#CFE3EC] p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11.5px] font-bold text-[#5E7A87]">שאלה {i + 1}</span>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => moveQ(q.id, -1)} aria-label="הזזה למעלה" className="rounded-lg p-1 text-[#5E7A87] hover:bg-[#F2F8FB]">
                  <ChevronUp size={15} />
                </button>
                <button type="button" onClick={() => moveQ(q.id, 1)} aria-label="הזזה למטה" className="rounded-lg p-1 text-[#5E7A87] hover:bg-[#F2F8FB]">
                  <ChevronDown size={15} />
                </button>
                <button type="button" onClick={() => setPendingDelete(q.id)} aria-label="מחיקת השאלה" className="rounded-lg p-1 text-[#C4584C] hover:bg-red-50">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            <input className={INPUT} placeholder="נוסח השאלה" value={q.label} onChange={(e) => updateQ(q.id, { label: e.target.value })} />
            <input
              className={`${INPUT} mt-1.5 text-[12px]`}
              placeholder="הסבר קצר (לא חובה)"
              value={q.hint || ""}
              onChange={(e) => updateQ(q.id, { hint: e.target.value })}
            />

            <div className="mt-2 grid grid-cols-2 gap-2">
              <select className={INPUT} value={q.type} onChange={(e) => updateQ(q.id, { type: e.target.value })}>
                {QUESTION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <select className={INPUT} value={q.step} onChange={(e) => updateQ(q.id, { step: Number(e.target.value) })}>
                {draft.stepTitles.map((t, si) => (
                  <option key={si} value={si}>{`שלב ${si + 1}: ${t}`}</option>
                ))}
              </select>
            </div>

            {q.type === "chips" && (
              <input
                className={`${INPUT} mt-1.5 text-[12px]`}
                placeholder="האפשרויות, מופרדות בפסיק"
                value={(q.options || []).join(", ")}
                onChange={(e) => updateQ(q.id, { options: e.target.value.split(",").map((o) => o.trim()).filter(Boolean) })}
              />
            )}

            <div className="mt-2 flex items-center gap-4">
              <label className="flex items-center gap-1.5 text-[12px] font-semibold text-[#23414E]">
                <input type="checkbox" className="h-4 w-4 accent-[#2E8BA8]" checked={!!q.required} onChange={(e) => updateQ(q.id, { required: e.target.checked })} />
                שאלת חובה
              </label>
              <label className="flex items-center gap-1.5 text-[12px] font-semibold text-[#23414E]">
                <input type="checkbox" className="h-4 w-4 accent-[#2E8BA8]" checked={q.enabled !== false} onChange={(e) => updateQ(q.id, { enabled: e.target.checked })} />
                מוצגת בטופס
              </label>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => addQ(2)}
          className="flex w-full items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-[#CFE3EC] py-3 text-[13px] font-bold text-[#2E8BA8] transition hover:bg-[#F2F8FB]"
        >
          <Plus size={15} /> הוספת שאלה
        </button>
      </Section>

      {/* ---------- נספחים ---------- */}
      <Section
        icon={FileText}
        title="הנספחים המשפטיים"
        hint="השאירי ריק כדי להשתמש בנוסח שכתוב בקוד. כל טקסט שתזיני כאן מחליף אותו מיד באתר."
      >
        <Field label="נספח 1 — הסכם ההתקשרות" hint="שורה ריקה מפרידה בין פסקאות. שורה שמתחילה ב-## הופכת לכותרת.">
          <textarea
            rows={10}
            className={`${INPUT} leading-relaxed`}
            placeholder="ריק = הנוסח המקורי"
            value={draft.legal.terms}
            onChange={(e) => setIn("legal", { terms: e.target.value })}
          />
        </Field>
        <Field label="נספח 2 — מדיניות הפרטיות">
          <textarea
            rows={10}
            className={`${INPUT} leading-relaxed`}
            placeholder="ריק = הנוסח המקורי"
            value={draft.legal.privacy}
            onChange={(e) => setIn("legal", { privacy: e.target.value })}
          />
        </Field>
        <div className="flex gap-2">
          <Link href="/terms/" target="_blank" className="flex flex-1 items-center justify-center gap-1 rounded-2xl border border-[#CFE3EC] py-2.5 text-[12.5px] font-semibold text-[#2E8BA8]">
            <ExternalLink size={13} /> נספח 1
          </Link>
          <Link href="/privacy/" target="_blank" className="flex flex-1 items-center justify-center gap-1 rounded-2xl border border-[#CFE3EC] py-2.5 text-[12.5px] font-semibold text-[#2E8BA8]">
            <ExternalLink size={13} /> נספח 2
          </Link>
        </div>
      </Section>

      {error && (
        <p className="mt-4 rounded-2xl bg-[#FDECEA] px-3.5 py-3 text-[13px] text-[#C4584C]">{error}</p>
      )}

      {/* סרגל שמירה צף: תמיד בהישג יד, גם באמצע מסך ארוך */}
      <div className="safe-bottom fixed inset-x-0 bottom-16 z-30 mx-auto max-w-md px-4">
        <Button variant="primary" className="w-full shadow-lg" disabled={!dirty || saving} onClick={handleSave}>
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          {saving ? "שומרת..." : dirty ? "שמירה ופרסום" : "הכל שמור"}
        </Button>
      </div>

      {pendingDelete && (
        <ConfirmDialog
          message="למחוק את השאלה הזו מהטופס? תשובות שכבר נשמרו בכרטיסים קיימים לא ייפגעו."
          onConfirm={() => {
            removeQ(pendingDelete);
            setPendingDelete(null);
          }}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}
