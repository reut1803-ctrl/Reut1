"use client";

// ניהול הטופס והתכנים — מסך למנהלת בלבד.
//
// כל מה שנערך כאן נשמר במסד הנתונים ומשתקף מיד בטופס הציבורי,
// בנספחים ובמסכי התשלום. אין צורך בפריסת קוד מחדש.
//
// לב המסך הוא רשימת השאלות: כל שאלה בטופס מופיעה כאן, מובנית או
// מוספת, עם מתג הדלקה/כיבוי, נוסח מלא לעריכה, סימון חובה, שיוך לשלב
// וחיצי סדר. חמש שאלות בלבד נעולות — שם, טלפון, תאריך לידה, תמונה
// ואישורים — כי בלעדיהן אין כרטיס תקין ואין דרך ליצור קשר.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Settings2, Link2, CreditCard, FileText, ListChecks, Lock, Check, Loader2,
  Trash2, ChevronUp, ChevronDown, Plus, ExternalLink, AlertTriangle, Pencil, EyeOff, Tag, Eye,
  History, RotateCcw, Undo2,
} from "lucide-react";
import { useCrmStore } from "@/lib/crm/store";
import { QUESTION_TYPES, newQuestion, mergeContent } from "@/lib/crm/publicContent";
import {
  resolveItems, movedOrder, orderWithInserted, BUILTIN_BY_ID, CHOICE_WIDGETS, choiceItems, optionsOf,
} from "@/lib/crm/formSchema";
import { describeScale } from "@/lib/crm/registerForm";
import { resolveTags, newTag, TAG_COLORS } from "@/lib/crm/tags";
import Button from "@/components/crm/ui/Button";
import ConfirmDialog from "@/components/crm/ui/ConfirmDialog";
import FormPreviewSheet from "@/components/crm/settings/FormPreviewSheet";
import { describeVersion, summarizeChange } from "@/lib/crm/contentHistory";

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

// מתג הדלקה/כיבוי. גדול מספיק ללחיצה עם האגודל, ומצבו ניכר במבט אחד
// גם בלי לקרוא טקסט.
function Switch({ on, onChange, disabled, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition ${
        disabled ? "cursor-not-allowed bg-[#DCEEF5] opacity-60" : on ? "bg-[#2E8BA8]" : "bg-[#C9D9E1]"
      }`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
          on ? "right-1" : "right-6"
        }`}
      />
    </button>
  );
}

export default function FormSettingsPage() {
  const role = useCrmStore((s) => s.role);
  const saved = useCrmStore((s) => s.publicContent);
  const loaded = useCrmStore((s) => s.publicContentLoaded);
  const savePublicContent = useCrmStore((s) => s.savePublicContent);
  const loadContentVersions = useCrmStore((s) => s.loadContentVersions);
  const showToast = useCrmStore((s) => s.showToast);

  const [draft, setDraft] = useState(null);
  const [openId, setOpenId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [pendingTagDelete, setPendingTagDelete] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [versions, setVersions] = useState(null);
  const [versionsError, setVersionsError] = useState("");
  const [pendingRestore, setPendingRestore] = useState(null);
  const [restoredFrom, setRestoredFrom] = useState("");

  // הטיוטה נטענת פעם אחת מהשמור, כדי שהקלדה לא תידרס בכל עדכון מהשרת
  useEffect(() => {
    if (loaded && draft === null) setDraft(mergeContent(saved));
  }, [loaded, saved, draft]);

  const dirty = useMemo(
    () => draft !== null && JSON.stringify(draft) !== JSON.stringify(mergeContent(saved)),
    [draft, saved]
  );

  // רשימת הגרסאות נטענת פעם אחת בכניסה למסך, ומתרעננת אחרי כל שמירה
  const refreshVersions = useCallback(async () => {
    try {
      setVersions(await loadContentVersions());
      setVersionsError("");
    } catch {
      setVersions([]);
      setVersionsError("לא הצלחנו לטעון את רשימת הגרסאות כרגע.");
    }
  }, [loadContentVersions]);

  useEffect(() => {
    if (loaded) refreshVersions();
  }, [loaded, refreshVersions]);

  const items = useMemo(() => (draft ? resolveItems(draft) : []), [draft]);

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
      // הסדר נשמר תמיד במלואו, ולכן הוא נשאר יציב גם אחרי הוספה או מחיקה
      await savePublicContent({ ...draft, order: items.map((it) => it.id) });
      setRestoredFrom("");
      showToast("התוכן עודכן והוא כבר באוויר");
      refreshVersions();
    } catch {
      setError("השמירה לא הצליחה. אפשר לנסות שוב בעוד רגע.");
    } finally {
      setSaving(false);
    }
  };

  // ----- עריכת שאלה, מובנית או מוספת -----
  // הערך הגולמי, לפני נפילה לברירת המחדל. תיבת העריכה חייבת להציג
  // אותו ולא את המוצג בפועל, אחרת מחיקת הנוסח הייתה קופצת מיד חזרה
  // לברירת המחדל ולא היה אפשר לכתוב נוסח חדש מאפס.
  const rawOf = (item) => {
    if (item.kind === "custom") {
      const q = draft.questions.find((x) => x.id === item.id) || {};
      return { label: q.label ?? "", hint: q.hint ?? "" };
    }
    const o = draft.items[item.id] || {};
    return { label: o.label ?? "", hint: o.hint ?? "" };
  };

  const patchItem = (item, patch) => {
    if (item.kind === "custom") {
      set({ questions: draft.questions.map((q) => (q.id === item.id ? { ...q, ...patch } : q)) });
      return;
    }
    const current = draft.items[item.id] || {};
    const next = { ...current, ...patch };
    // שינוי שחזר בדיוק לברירת המחדל נמחק, כדי שלא יצטברו רשומות ריקות
    const base = BUILTIN_BY_ID.get(item.id) || {};
    if (next.label === base.label) delete next.label;
    if (next.hint === (base.hint || "") ) delete next.hint;
    const nextItems = { ...draft.items };
    if (Object.keys(next).length === 0) delete nextItems[item.id];
    else nextItems[item.id] = next;
    set({ items: nextItems });
  };

  const move = (item, dir) => set({ order: movedOrder(draft, item.id, dir) });

  const addQuestion = (step) => {
    const q = newQuestion(step);
    const next = { ...draft, questions: [...draft.questions, q] };
    set({ questions: next.questions, order: orderWithInserted(next, q.id, step) });
    setOpenId(q.id);
  };

  // ----- תוויות הסינון המהיר -----
  const tags = resolveTags(draft);
  const setTags = (next) => set({ tags: next });
  const patchTag = (id, patch) => setTags(tags.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  const addTag = () => setTags([...tags, newTag()]);
  const removeTag = (id) => setTags(tags.filter((t) => t.id !== id));
  const moveTag = (id, dir) => {
    const list = [...tags];
    const i = list.findIndex((t) => t.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    setTags(list);
  };
  const choices = choiceItems(draft);

  const removeQuestion = (id) =>
    set({ questions: draft.questions.filter((q) => q.id !== id), order: draft.order.filter((x) => x !== id) });

  const activeCount = items.filter((it) => it.enabled).length;
  const offCount = items.length - activeCount;

  return (
    <div className="px-4 py-6 pb-28">
      <h1 className="flex items-center gap-2 text-xl font-bold text-[#23414E]">
        <Settings2 size={22} /> ניהול הטופס והתכנים
      </h1>
      <p className="mt-1 text-[13px] leading-relaxed text-[#5E7A87]">
        כל שינוי כאן משתקף מיד בטופס הציבורי ובנספחים, בלי צורך בעדכון תוכנה.
      </p>

      {restoredFrom && (
        <p className="mt-3 flex items-start gap-1.5 rounded-2xl bg-[#FDF3E7] px-3.5 py-3 text-[12.5px] leading-relaxed text-[#8A6320]">
          <History size={15} className="mt-0.5 shrink-0" />
          <span>
            נטענה הגרסה מ<strong>{restoredFrom}</strong>. אפשר לבדוק אותה בתצוגה המקדימה.
            היא תיכנס לאוויר רק אחרי לחיצה על <strong>שמירה ופרסום</strong>.
          </span>
        </p>
      )}

      {/* ---------- השאלות ---------- */}
      <Section
        icon={ListChecks}
        title="השאלות בטופס"
        hint={`${activeCount} שאלות מוצגות${offCount ? ` · ${offCount} כבויות` : ""}. מתג כחול = השאלה מופיעה בטופס. לחיצה על שאלה פותחת אותה לעריכת הנוסח.`}
      >
        {draft.externalFormUrl && (
          <p className="flex items-start gap-1.5 rounded-2xl bg-[#FDF3E7] px-3 py-2.5 text-[12px] leading-relaxed text-[#8A6320]">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            כרגע מוגדר קישור לטופס חיצוני, ולכן השאלות שכאן אינן בשימוש. כדי להפעיל אותן — רוקני את
            שדה הקישור החיצוני שבהמשך העמוד.
          </p>
        )}

        {draft.stepTitles.map((title, step) => {
          const group = items.filter((it) => it.step === step);
          return (
            <div key={step} className="rounded-2xl bg-[#F7FBFD] p-2.5">
              <p className="mb-2 px-1 text-[12.5px] font-bold text-[#1F6E88]">
                שלב {step + 1} · {title}
              </p>

              {/* ההערה הכחולה שמופיעה בראש השלב בטופס. ריקון התיבה מוחק
                  אותה מהטופס לגמרי. */}
              <label className="mb-2 block px-1">
                <span className="mb-1 block text-[11px] font-semibold text-[#5E7A87]">
                  הערה בראש השלב (ריק = לא מוצגת)
                </span>
                <textarea
                  rows={2}
                  className={`${INPUT} bg-white text-[12.5px]`}
                  placeholder="אפשר להשאיר ריק"
                  value={draft.stepNotes[step]}
                  onChange={(e) => {
                    const next = [...draft.stepNotes];
                    next[step] = e.target.value;
                    set({ stepNotes: next });
                  }}
                />
              </label>

              <div className="space-y-2">
                {group.map((item) => (
                  <QuestionRow
                    key={item.id}
                    item={item}
                    raw={rawOf(item)}
                    base={BUILTIN_BY_ID.get(item.id)}
                    open={openId === item.id}
                    onToggleOpen={() => setOpenId(openId === item.id ? "" : item.id)}
                    onPatch={(patch) => patchItem(item, patch)}
                    onMove={(dir) => move(item, dir)}
                    onDelete={() => setPendingDelete(item.id)}
                    stepTitles={draft.stepTitles}
                  />
                ))}
                {group.length === 0 && (
                  <p className="px-1 py-2 text-center text-[12px] text-[#5E7A87]">אין שאלות בשלב הזה.</p>
                )}
              </div>

              <button
                type="button"
                onClick={() => addQuestion(step)}
                className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-[#CFE3EC] bg-white py-2.5 text-[12.5px] font-bold text-[#2E8BA8] transition active:scale-[0.99]"
              >
                <Plus size={14} /> הוספת שאלה לשלב הזה
              </button>
            </div>
          );
        })}
      </Section>

      {/* ---------- תוויות הסינון ---------- */}
      <Section
        icon={Tag}
        title="תוויות הסינון המהיר"
        hint="התוויות שמופיעות מעל רשימת המועמדים. אפשר לשייך כל תווית לשאלה בשאלון ולסמן אילו תשובות שייכות אליה — וכך התווית תתאים מאליה למה שהמועמדים ענו, בלי לסמן כרטיס-כרטיס ביד."
      >
        {tags.map((tag, i) => {
          const q = choices.find((c) => c.id === tag.questionId) || null;
          return (
            <div key={tag.id} className="rounded-2xl border border-[#CFE3EC] bg-white p-3">
              <div className="mb-2 flex items-center gap-1.5">
                <div className="flex flex-col">
                  <button type="button" onClick={() => moveTag(tag.id, -1)} aria-label="הזזה למעלה" className="px-1 text-[#8AA6B3] active:text-[#1F6E88]">
                    <ChevronUp size={15} />
                  </button>
                  <button type="button" onClick={() => moveTag(tag.id, 1)} aria-label="הזזה למטה" className="px-1 text-[#8AA6B3] active:text-[#1F6E88]">
                    <ChevronDown size={15} />
                  </button>
                </div>
                <span
                  className="shrink-0 rounded-full px-3 py-1 text-[12px] font-bold"
                  style={{ backgroundColor: tag.color, color: tag.textColor }}
                >
                  {tag.name || "תווית חדשה"}
                </span>
                <span className="flex-1" />
                <button
                  type="button"
                  onClick={() => setPendingTagDelete(tag.id)}
                  aria-label="מחיקת התווית"
                  className="rounded-lg p-1 text-[#C4584C] active:bg-red-50"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <input
                className={INPUT}
                placeholder="שם התווית"
                value={tag.name}
                onChange={(e) => patchTag(tag.id, { name: e.target.value })}
              />

              <div className="mt-2 flex flex-wrap gap-1.5">
                {TAG_COLORS.map((c) => (
                  <button
                    key={c.color}
                    type="button"
                    aria-label={`צבע ${c.color}`}
                    onClick={() => patchTag(tag.id, { color: c.color, textColor: c.textColor })}
                    className={`h-7 w-7 rounded-full border-2 transition ${
                      tag.color === c.color ? "border-[#23414E] scale-110" : "border-transparent"
                    }`}
                    style={{ backgroundColor: c.color }}
                  />
                ))}
              </div>

              <label className="mt-2.5 block">
                <span className="mb-1 block text-[11.5px] font-semibold text-[#5E7A87]">
                  שיוך לשאלה בשאלון
                </span>
                <select
                  className={INPUT}
                  value={tag.questionId}
                  onChange={(e) => patchTag(tag.id, { questionId: e.target.value, values: [] })}
                >
                  <option value="">בלי שיוך — סימון ידני בכרטיס בלבד</option>
                  {choices.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                      {c.enabled ? "" : " (כבויה)"}
                    </option>
                  ))}
                </select>
              </label>

              {q && (
                <div className="mt-2">
                  <span className="mb-1.5 block text-[11.5px] font-semibold text-[#5E7A87]">
                    אילו תשובות שייכות לתווית הזו
                  </span>
                  {q.options.length === 0 ? (
                    <p className="rounded-xl bg-[#F2F8FB] px-2.5 py-2 text-[11.5px] text-[#5E7A87]">
                      לשאלה הזו אין עדיין רשימת תשובות. אפשר להוסיף לה אפשרויות במקטע השאלות שלמעלה.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {q.options.map((opt) => {
                        const on = tag.values.includes(opt);
                        return (
                          <button
                            key={opt}
                            type="button"
                            aria-pressed={on}
                            onClick={() =>
                              patchTag(tag.id, {
                                values: on ? tag.values.filter((v) => v !== opt) : [...tag.values, opt],
                              })
                            }
                            className={`rounded-full border px-2.5 py-1.5 text-[12px] font-semibold transition ${
                              on
                                ? "border-[#2E8BA8] bg-[#2E8BA8] text-white"
                                : "border-[#CFE3EC] bg-white text-[#23414E]"
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <p className="mt-2 text-[11px] leading-relaxed text-[#5E7A87]">
                {tag.questionId && tag.values.length > 0
                  ? `כל מי שענה/תה ${tag.values.join(" או ")} יקבל/תקבל את התווית אוטומטית.`
                  : "בלי שיוך, התווית תופיע רק על כרטיסים שסומנו בה ידנית."}
              </p>
            </div>
          );
        })}

        <button
          type="button"
          onClick={addTag}
          className="flex w-full items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-[#CFE3EC] py-3 text-[13px] font-bold text-[#2E8BA8] transition active:scale-[0.99]"
        >
          <Plus size={15} /> הוספת תווית
        </button>
      </Section>

      {/* ---------- טקסטים ---------- */}
      <Section icon={FileText} title="הטקסטים בטופס">
        <Field label="כותרת הפתיחה" hint="מוצגת בדיוק כפי שנכתבת. ריק = לא מוצגת כלל.">
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

        <Field
          label="האישורים המשפטיים בסוף הטופס"
          hint="הכיתוב שליד כל תיבת סימון. {{fee}} יוחלף אוטומטית בדמי ההצלחה."
        >
          <div className="space-y-2">
            <textarea
              rows={3}
              className={`${INPUT} text-[13px]`}
              value={draft.texts.consentTerms}
              onChange={(e) => setIn("texts", { consentTerms: e.target.value })}
            />
            <textarea
              rows={2}
              className={`${INPUT} text-[13px]`}
              value={draft.texts.consentPrivacy}
              onChange={(e) => setIn("texts", { consentPrivacy: e.target.value })}
            />
          </div>
        </Field>

        <Field
          label="קופסת העלויות בתחתית הטופס"
          hint="כל שורה חדשה = סעיף נוסף. ריקון הכותרת והשורות מסתיר את הקופסה כולה."
        >
          <div className="space-y-2">
            <input
              className={INPUT}
              placeholder="כותרת (ריק = מוסתרת)"
              value={draft.texts.costsTitle}
              onChange={(e) => setIn("texts", { costsTitle: e.target.value })}
            />
            <textarea
              rows={4}
              className={`${INPUT} text-[13px]`}
              placeholder="שורה לכל סעיף"
              value={draft.texts.costsLines}
              onChange={(e) => setIn("texts", { costsLines: e.target.value })}
            />
          </div>
        </Field>

        <Field
          label="כיתובים קטנים בתוך שאלות"
          hint="ריקון של אחד מהם מסתיר את השדה הקטן שהוא מלווה."
        >
          <div className="space-y-2">
            <input
              className={INPUT}
              placeholder="כיתוב שדה הגיל החלופי (בשאלת תאריך הלידה)"
              value={draft.texts.ageFallbackLabel}
              onChange={(e) => setIn("texts", { ageFallbackLabel: e.target.value })}
            />
            <input
              className={INPUT}
              placeholder="שאלת ההמשך של שאלת היסודות"
              value={draft.texts.elementWhyLabel}
              onChange={(e) => setIn("texts", { elementWhyLabel: e.target.value })}
            />
          </div>
        </Field>

        <Field label="כותרת מסך התודה">
          <input className={INPUT} value={draft.thankYou.title} onChange={(e) => setIn("thankYou", { title: e.target.value })} />
        </Field>
        <Field label="הודעת מסך התודה">
          <textarea rows={3} className={INPUT} value={draft.thankYou.body} onChange={(e) => setIn("thankYou", { body: e.target.value })} />
        </Field>
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
            שמוגדרות למעלה אינן בשימוש. הן ינוהלו במערכת החיצונית.
          </p>
        ) : (
          <Link
            href="/register/"
            target="_blank"
            className="flex items-center justify-center gap-1.5 rounded-2xl border border-[#CFE3EC] py-2.5 text-[13px] font-semibold text-[#2E8BA8]"
          >
            <ExternalLink size={14} /> פתיחת הטופס לצפייה
          </Link>
        )}
      </Section>

      {/* ---------- גיבוי ושחזור ---------- */}
      <Section
        icon={History}
        title="גיבוי ושחזור"
        hint="לפני כל פרסום, הגרסה הקודמת נשמרת כאן אוטומטית. אפשר לחזור לכל אחת מהן — ושום שחזור אינו מפרסם דבר עד שלוחצים 'שמירה ופרסום'."
      >
        {dirty && (
          <button
            type="button"
            onClick={() => {
              setDraft(mergeContent(saved));
              setRestoredFrom("");
              setOpenId("");
            }}
            className="flex w-full items-center justify-center gap-1.5 rounded-2xl border-2 border-[#CFE3EC] bg-white py-3 text-[13px] font-bold text-[#23414E] transition active:scale-[0.99]"
          >
            <Undo2 size={15} /> ביטול השינויים שטרם פורסמו
          </button>
        )}

        {versionsError && (
          <p className="rounded-2xl bg-[#FDECEA] px-3 py-2.5 text-[12px] text-[#C4584C]">{versionsError}</p>
        )}

        {versions === null && !versionsError && (
          <p className="py-2 text-center text-[12.5px] text-[#5E7A87]">טוען גרסאות...</p>
        )}

        {versions !== null && versions.length === 0 && !versionsError && (
          <p className="rounded-2xl bg-[#F2F8FB] px-3 py-3 text-center text-[12.5px] leading-relaxed text-[#5E7A87]">
            עדיין אין גרסאות שמורות. מהפרסום הבא והלאה, כל גרסה קודמת תישמר כאן אוטומטית.
          </p>
        )}

        {(versions || []).map((v, i) => {
          const change = summarizeChange(v.content, i === 0 ? mergeContent(saved) : versions[i - 1].content);
          return (
            <div key={v.id} className="rounded-2xl border border-[#CFE3EC] bg-white p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold text-[#23414E]">{describeVersion(v.savedAt)}</p>
                  <p className="mt-0.5 text-[11.5px] leading-relaxed text-[#5E7A87]">
                    {v.savedByName || v.savedBy || "לא ידוע"}
                    {change ? ` · אחריה ${change}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPendingRestore(v)}
                  className="flex shrink-0 items-center gap-1 rounded-xl border border-[#CFE3EC] px-2.5 py-1.5 text-[12px] font-bold text-[#2E8BA8] active:scale-95"
                >
                  <RotateCcw size={13} /> שחזור
                </button>
              </div>
            </div>
          );
        })}
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

      {/* סרגל צף: תצוגה מקדימה ושמירה, תמיד בהישג יד */}
      <div className="safe-bottom fixed inset-x-0 bottom-16 z-30 mx-auto flex max-w-md gap-2 px-4">
        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          className="flex shrink-0 items-center justify-center gap-1.5 rounded-2xl border-2 border-[#2E8BA8] bg-white px-4 py-3 text-[13.5px] font-bold text-[#1F6E88] shadow-lg transition active:scale-95"
        >
          <Eye size={16} /> תצוגה מקדימה
        </button>
        <Button variant="primary" className="flex-1 shadow-lg" disabled={!dirty || saving} onClick={handleSave}>
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          {saving ? "שומרת..." : dirty ? "שמירה ופרסום" : "הכל שמור"}
        </Button>
      </div>

      {/* הטיוטה עצמה מוצגת, ולא הגרסה השמורה - כדי לראות שינוי לפני פרסום */}
      {previewOpen && (
        <FormPreviewSheet content={draft} dirty={dirty} onClose={() => setPreviewOpen(false)} />
      )}

      {pendingRestore && (
        <ConfirmDialog
          message={`לטעון את הגרסה מ${describeVersion(pendingRestore.savedAt)}? השינויים שלא פורסמו יוחלפו בה. שום דבר לא יפורסם עד שתלחצי "שמירה ופרסום".`}
          onConfirm={() => {
            setDraft(mergeContent(pendingRestore.content));
            setRestoredFrom(describeVersion(pendingRestore.savedAt));
            setOpenId("");
            setPendingRestore(null);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          onCancel={() => setPendingRestore(null)}
          confirmLabel="טעינת הגרסה"
          tone="neutral"
        />
      )}

      {pendingTagDelete && (
        <ConfirmDialog
          message="למחוק את התווית? כרטיסים שסומנו בה ידנית ישמרו על הסימון, אבל התווית לא תופיע יותר ברצועת הסינון."
          onConfirm={() => {
            removeTag(pendingTagDelete);
            setPendingTagDelete(null);
          }}
          onCancel={() => setPendingTagDelete(null)}
        />
      )}

      {pendingDelete && (
        <ConfirmDialog
          message="למחוק את השאלה הזו מהטופס? תשובות שכבר נשמרו בכרטיסים קיימים לא ייפגעו. אם רק רוצים להסתיר אותה זמנית — עדיף לכבות את המתג."
          onConfirm={() => {
            removeQuestion(pendingDelete);
            setPendingDelete(null);
          }}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}

// ===================================================================
//  שורת שאלה
// ===================================================================
// סגורה כברירת מחדל, כדי שרשימה של שלושים שאלות תישאר נסקרת במסך
// טלפון. לחיצה על השורה פותחת את עריכת הנוסח המלא.
function QuestionRow({ item, raw, base, open, onToggleOpen, onPatch, onMove, onDelete, stepTitles }) {
  const off = !item.enabled;
  const isChoice = CHOICE_WIDGETS.has(item.widget);
  const isScale = item.widget === "scale";
  return (
    <div
      className={`rounded-2xl border bg-white transition ${
        off ? "border-[#E2E9ED] opacity-70" : "border-[#CFE3EC]"
      }`}
    >
      <div className="flex items-center gap-1.5 p-2.5">
        <div className="flex flex-col">
          <button type="button" onClick={() => onMove(-1)} aria-label="הזזה למעלה" className="rounded-md px-1 text-[#8AA6B3] active:text-[#1F6E88]">
            <ChevronUp size={15} />
          </button>
          <button type="button" onClick={() => onMove(1)} aria-label="הזזה למטה" className="rounded-md px-1 text-[#8AA6B3] active:text-[#1F6E88]">
            <ChevronDown size={15} />
          </button>
        </div>

        <button type="button" onClick={onToggleOpen} className="flex min-w-0 flex-1 items-center gap-1.5 text-right">
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1 truncate text-[13px] font-semibold text-[#23414E]">
              {item.locked && <Lock size={11} className="shrink-0 text-[#8AA6B3]" />}
              {off && <EyeOff size={11} className="shrink-0 text-[#8AA6B3]" />}
              {item.label}
            </span>
            <span className="mt-0.5 flex items-center gap-1.5 text-[10.5px] text-[#5E7A87]">
              {item.required && <span className="font-bold text-[#C4584C]">חובה</span>}
              {item.kind === "custom" && <span className="text-[#2E8BA8]">שאלה שהוספת</span>}
              {off && <span>כבויה — לא מופיעה בטופס</span>}
            </span>
          </span>
          <Pencil size={13} className="shrink-0 text-[#8AA6B3]" />
        </button>

        <Switch
          on={item.enabled}
          disabled={item.locked}
          label={`הצגת השאלה ${item.label}`}
          onChange={(v) => onPatch({ enabled: v })}
        />
      </div>

      {open && (
        <div className="space-y-2 border-t border-[#E7F0F5] p-2.5">
          {item.locked && (
            <p className="rounded-xl bg-[#EDF4F8] px-2.5 py-2 text-[11px] leading-relaxed text-[#5E7A87]">
              שאלה זו תמיד מוצגת ותמיד חובה — בלעדיה אין כרטיס תקין. את הנוסח וההסבר אפשר לשנות בחופשיות.
            </p>
          )}

          <label className="block">
            <span className="mb-1 block text-[11.5px] font-semibold text-[#5E7A87]">נוסח השאלה</span>
            <textarea
              rows={2}
              className={`${INPUT} font-semibold`}
              placeholder={base?.label || "איך השאלה תופיע בטופס"}
              value={raw.label}
              onChange={(e) => onPatch({ label: e.target.value })}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-[11.5px] font-semibold text-[#5E7A87]">הסבר קטן מתחת לשאלה</span>
            <textarea
              rows={2}
              className={`${INPUT} text-[13px]`}
              placeholder={base?.hint || "לא חובה"}
              value={raw.hint}
              onChange={(e) => onPatch({ hint: e.target.value })}
            />
          </label>

          {item.kind === "custom" && (
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="mb-1 block text-[11.5px] font-semibold text-[#5E7A87]">סוג התשובה</span>
                <select className={INPUT} value={item.type} onChange={(e) => onPatch({ type: e.target.value })}>
                  {QUESTION_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-[11.5px] font-semibold text-[#5E7A87]">שלב</span>
                <select className={INPUT} value={item.step} onChange={(e) => onPatch({ step: Number(e.target.value) })}>
                  {stepTitles.map((t, si) => (
                    <option key={si} value={si}>{`${si + 1}. ${t}`}</option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {item.kind === "builtin" && !item.locked && (
            <label className="block">
              <span className="mb-1 block text-[11.5px] font-semibold text-[#5E7A87]">שלב</span>
              <select className={INPUT} value={item.step} onChange={(e) => onPatch({ step: Number(e.target.value) })}>
                {stepTitles.map((t, si) => (
                  <option key={si} value={si}>{`${si + 1}. ${t}`}</option>
                ))}
              </select>
            </label>
          )}

          {isScale && (
            <ScaleEditor low={item.low} high={item.high} label={item.label} onPatch={onPatch} />
          )}

          {isChoice && (
            // optionsOf ולא item.options: בשאלה מובנית שלא נערכה, השדה
            // מחזיק את שם הרשימה ולא את הרשימה עצמה. העברה ישירה שלו
            // הפילה את המסך ברגע שנפתחה שאלת בחירה.
            <OptionsInput options={optionsOf(item)} onPatch={onPatch} builtin={item.kind === "builtin"} />
          )}

          <div className="flex items-center justify-between pt-0.5">
            <div className="flex items-center gap-2 text-[12.5px] font-semibold text-[#23414E]">
              <Switch
                on={item.required}
                disabled={item.locked}
                label="שאלת חובה"
                onChange={(v) => onPatch({ required: v })}
              />
              שאלת חובה
            </div>

            {item.kind === "custom" && (
              <button
                type="button"
                onClick={onDelete}
                className="flex items-center gap-1 rounded-xl px-2 py-1.5 text-[12px] font-semibold text-[#C4584C] active:bg-red-50"
              >
                <Trash2 size={13} /> מחיקה
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// שדה האפשרויות של שאלת בחירה.
//
// הבאג שהיה כאן: הטקסט נחתך לרשימה ומורכב מחדש בכל הקשה, ולכן פסיק
// או רווח בסוף נעלמו ברגע שהוקלדו ולא היה אפשר לכתוב אפשרות שנייה.
// עכשיו מה שמוקלד נשמר כפי שהוא בזמן ההקלדה, והפיצול לרשימה נעשה
// ברקע. אפשר להקליד רווחים, פסיקים וסימני פיסוק בחופשיות מלאה.
function OptionsInput({ options, onPatch, builtin = false }) {
  const list = Array.isArray(options) ? options : [];
  const joined = list.join(", ");
  const [text, setText] = useState(joined);
  const lastParsed = useRef(joined);

  // ערך שהשתנה מבחוץ (טעינה מחדש, ביטול) מתעדכן כאן. שינוי שמקורו
  // בהקלדה שלנו אינו דורס את מה שמוקלד ברגע זה.
  useEffect(() => {
    if (joined !== lastParsed.current) {
      lastParsed.current = joined;
      setText(joined);
    }
  }, [joined]);

  const handle = (raw) => {
    setText(raw);
    const parsed = raw.split(",").map((o) => o.trim()).filter(Boolean);
    lastParsed.current = parsed.join(", ");
    onPatch({ options: parsed });
  };

  return (
    <label className="block">
      <span className="mb-1 block text-[11.5px] font-semibold text-[#5E7A87]">
        האפשרויות לבחירה{builtin ? " (אפשר להוסיף או להסיר)" : ""}
      </span>
      <input
        className={`${INPUT} text-[13px]`}
        placeholder="למשל: כן, לא, לא משנה — מופרד בפסיקים"
        value={text}
        onChange={(e) => handle(e.target.value)}
      />
      <span className="mt-1 block text-[11px] text-[#5E7A87]">
        {list.length > 0 ? `${list.length} אפשרויות: ${list.join(" · ")}` : "מפרידים בין האפשרויות בפסיק."}
      </span>
    </label>
  );
}

// ===================================================================
//  עורך סולם דירוג
// ===================================================================
// שני הקטבים, ומיד מתחתיהם תצוגה מקדימה של חמשת הניסוחים שייכתבו
// בכרטיס. זו הנקודה שבה הסולם מפסיק להיות "1 עד 10" ומתחיל לדבר:
// מה שנכתב כאן הוא מה שיופיע למועמד/ת מעל הפס, ומה שייכנס לתיאור
// האישי במילים - בלי שום נגיעה בקוד.
function ScaleEditor({ low, high, label, onPatch }) {
  const ready = Boolean(String(low || "").trim() && String(high || "").trim());
  const scale = { label, low, high };

  return (
    <div className="rounded-xl bg-[#F7FBFD] p-2.5">
      <span className="mb-1.5 block text-[11.5px] font-semibold text-[#5E7A87]">
        שני צדי הסולם
      </span>
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="mb-1 block text-[10.5px] text-[#5E7A87]">הצד הימני (הכי נמוך)</span>
          <input
            className={`${INPUT} text-[13px]`}
            placeholder="למשל: מעשי"
            value={low || ""}
            onChange={(e) => onPatch({ low: e.target.value })}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[10.5px] text-[#5E7A87]">הצד השמאלי (הכי גבוה)</span>
          <input
            className={`${INPUT} text-[13px]`}
            placeholder="למשל: עיוני"
            value={high || ""}
            onChange={(e) => onPatch({ high: e.target.value })}
          />
        </label>
      </div>

      {ready ? (
        <div className="mt-2 rounded-xl bg-white p-2.5">
          <span className="mb-1 block text-[10.5px] font-semibold text-[#5E7A87]">
            ככה זה ייכתב בכרטיס, לפי מה שייבחר:
          </span>
          <ul className="space-y-0.5 text-[11.5px] leading-relaxed text-[#23414E]">
            {[1, 3, 5, 8, 10].map((n) => (
              <li key={n}>· {describeScale(scale, n)}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-2 text-[11px] leading-relaxed text-[#5E7A87]">
          כל עוד שני הצדדים ריקים, הסולם יציג מספר בלבד. ברגע שתמלאי אותם הוא יתחיל
          לדבר במילים — בדיוק כמו שאר שאלות האופי.
        </p>
      )}
    </div>
  );
}
