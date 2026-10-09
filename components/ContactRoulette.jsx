"use client";

import { useEffect, useState } from "react";
import {
  loadRoulette,
  saveRoulette,
  clearRoulette,
  buildDraw,
  DRAW_SIZE_MAX,
  randomEmpower,
  puzzleInsight,
} from "../lib/roulette";

// רולטת אנשי קשר / אתגר יומי — ווידג'ט מתקפל בראש הדאשבורד.
// מבודד לחלוטין: שומר אך ורק ב-LocalStorage של המכשיר תחת ownerId, עם תפוגת 24ש'.
export default function ContactRoulette({ ownerId }) {
  const [openPanel, setOpenPanel] = useState(false);
  const [state, setState] = useState(null); // { date, contacts: [...] } | null
  const [manual, setManual] = useState(false);
  const [manualText, setManualText] = useState("");
  const [analyzingId, setAnalyzingId] = useState(null);

  // טעינת מצב היום מהמכשיר (אם פג תוקף/עבר יום — נתחיל נקי).
  useEffect(() => {
    setState(loadRoulette(ownerId));
  }, [ownerId]);

  // בדיקת תמיכה בבוחר אנשי הקשר של המערכת (כרום אנדרואיד). אחרת — Fallback להקלדה.
  const pickerSupported =
    typeof navigator !== "undefined" && "contacts" in navigator && typeof window !== "undefined" && "ContactsManager" in window;

  function persist(next) {
    setState(next);
    saveRoulette(ownerId, next);
  }

  function setContact(id, patch) {
    if (!state) return;
    const contacts = state.contacts.map((c) => (c.id === id ? { ...c, ...patch } : c));
    persist({ ...state, contacts });
  }

  function startFromNames(names) {
    const draw = buildDraw(names);
    if (draw.contacts.length === 0) {
      alert("לא נמצאו שמות. נסי לבחור שוב או להקליד ידנית.");
      return;
    }
    persist(draw);
    setManual(false);
    setManualText("");
  }

  async function pickFromPhone() {
    try {
      const selected = await navigator.contacts.select(["name"], { multiple: true });
      const names = (selected || [])
        .map((c) => (c.name && c.name[0]) || "")
        .filter(Boolean);
      if (names.length === 0) {
        alert("לא נבחרו אנשי קשר.");
        return;
      }
      startFromNames(names);
    } catch (e) {
      // המשתמשת ביטלה / הדפדפן חסם — ניפול בעדינות להקלדה ידנית.
      setManual(true);
    }
  }

  function submitManual() {
    const names = manualText.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
    if (names.length === 0) {
      alert("נא להקליד לפחות שם אחד.");
      return;
    }
    startFromNames(names);
  }

  function resetDraw() {
    if (!confirm("להתחיל אתגר חדש? הרשימה הנוכחית תימחק מהמכשיר.")) return;
    clearRoulette(ownerId);
    setState(null);
    setManual(false);
    setManualText("");
  }

  function saveCouple(c) {
    const style = (c.networking?.style || "").trim();
    const consult = (c.networking?.consult || "").trim();
    if (!style && !consult) {
      alert("נא למלא לפחות שדה אחד לפני השמירה.");
      return;
    }
    setContact(c.id, { done: true, message: randomEmpower() });
  }

  function analyzeSingle(c) {
    const trait = (c.trait || "").trim();
    if (!trait) {
      alert("נא לכתוב את התכונה שאת הכי מעריכה לפני הניתוח.");
      return;
    }
    setAnalyzingId(c.id);
    // אנימציית טעינה קצרה ואז הדפסת התובנה (מנוע מקומי — מיידי).
    setTimeout(() => {
      setContact(c.id, { done: true, insight: puzzleInsight(trait) });
      setAnalyzingId(null);
    }, 1300);
  }

  const contacts = state?.contacts || [];
  const handled = contacts.filter((c) => c.done).length;
  const progressPct = contacts.length ? Math.round((handled / contacts.length) * 100) : 0;

  return (
    <div className="card border-rose/40">
      {/* כותרת מתקפלת */}
      <button
        onClick={() => setOpenPanel((v) => !v)}
        className="flex w-full items-center justify-between gap-2 text-right"
      >
        <span className="flex items-center gap-2 text-lg font-bold text-roseDark">
          🎯 רולטת אנשי קשר — האתגר היומי
        </span>
        <span className="flex items-center gap-2">
          {state && (
            <span className="rounded-full bg-blush px-2.5 py-0.5 text-sm font-bold text-roseDark">
              {handled}/{contacts.length}
            </span>
          )}
          <span className="text-ink/40">{openPanel ? "▲" : "▼"}</span>
        </span>
      </button>

      {openPanel && (
        <div className="mt-4 space-y-4">
          {/* מסך פתיחה — אין עדיין הגרלה להיום */}
          {!state && (
            <div className="space-y-3">
              <p className="text-sm leading-relaxed text-ink/70">
                כל יום נגריל <b>{DRAW_SIZE_MAX} אנשי קשר</b> מהטלפון שלך, ונהפוך כל אחד להזדמנות שידוכית —
                בין אם לרישות (Networking) ובין אם לתובנה על בן/בת הזוג המשלים. 💡
                <br />
                <span className="text-xs text-ink/50">🔒 אנשי הקשר נשמרים רק במכשיר שלך ונמחקים אוטומטית אחרי 24 שעות. שום דבר לא נשמר בשרת.</span>
              </p>

              {!manual && (
                <div className="flex flex-wrap gap-2">
                  {pickerSupported && (
                    <button className="btn-primary" onClick={pickFromPhone}>📇 בחירה מאנשי הקשר</button>
                  )}
                  <button className="btn-soft" onClick={() => setManual(true)}>✍️ הקלדת שמות ידנית</button>
                </div>
              )}

              {manual && (
                <div className="space-y-2">
                  <label className="field-label">הקלידי שמות (כל שם בשורה, או מופרדים בפסיק)</label>
                  <textarea
                    className="field-input min-h-[96px]"
                    placeholder={"למשל:\nרבקה כהן\nשרה לוי\nמרים פרידמן"}
                    value={manualText}
                    onChange={(e) => setManualText(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button className="btn-primary" onClick={submitManual}>המשך לאתגר ✨</button>
                    <button className="btn-soft" onClick={() => setManual(false)}>ביטול</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* מסך האתגר — יש הגרלה להיום */}
          {state && (
            <div className="space-y-4">
              {/* סרגל התקדמות */}
              <div>
                <div className="mb-1 flex items-center justify-between text-sm font-semibold text-ink/70">
                  <span>התקדמות היום</span>
                  <span>{handled}/{contacts.length}</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-sand">
                  <div
                    className="h-full rounded-full bg-rose transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                {handled === contacts.length && contacts.length > 0 && (
                  <p className="mt-2 text-center text-sm font-bold text-roseDark">🎉 כל הכבוד! סיימת את האתגר היומי</p>
                )}
              </div>

              {/* הקלפים */}
              <div className="space-y-3">
                {contacts.map((c) => (
                  <ContactCardItem
                    key={c.id}
                    c={c}
                    analyzing={analyzingId === c.id}
                    onPickStatus={(status) => setContact(c.id, { status })}
                    onChange={(patch) => setContact(c.id, patch)}
                    onSaveCouple={() => saveCouple(c)}
                    onAnalyze={() => analyzeSingle(c)}
                    onFollowUp={() => setContact(c.id, { followUp: !c.followUp })}
                  />
                ))}
              </div>

              <button className="btn-soft w-full text-sm" onClick={resetDraw}>🔄 אתגר חדש</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// קלף בודד
function ContactCardItem({ c, analyzing, onPickStatus, onChange, onSaveCouple, onAnalyze, onFollowUp }) {
  return (
    <div className={`rounded-2xl border p-4 transition ${c.done ? "border-rose/30 bg-blush/30" : "border-sand bg-white"}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-lg font-bold text-ink">{c.name}</p>
        {c.followUp && <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">👀 במעקב</span>}
        {c.done && !c.followUp && <span className="text-xl">✓</span>}
      </div>

      {/* בחירת סטטוס */}
      {!c.status && !c.done && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="btn-soft" onClick={() => onPickStatus("couple")}>💍 בזוגיות</button>
          <button className="btn-soft" onClick={() => onPickStatus("single")}>🙋 רווק/ה · הורה</button>
        </div>
      )}

      {/* מסלול בזוגיות — Networking */}
      {c.status === "couple" && !c.done && (
        <div className="mt-3 space-y-2">
          <div>
            <label className="field-label">לאיזה סגנון נשדך בעזרתם?</label>
            <input
              className="field-input"
              value={c.networking?.style || ""}
              onChange={(e) => onChange({ networking: { ...(c.networking || {}), style: e.target.value } })}
            />
          </div>
          <div>
            <label className="field-label">על אילו 2 מועמדים שלנו נתייעץ איתם?</label>
            <input
              className="field-input"
              value={c.networking?.consult || ""}
              onChange={(e) => onChange({ networking: { ...(c.networking || {}), consult: e.target.value } })}
            />
          </div>
          <button className="btn-primary" onClick={onSaveCouple}>שמירה 💾</button>
        </div>
      )}

      {/* מסלול רווק/ה — תובנת AI */}
      {c.status === "single" && !c.done && (
        <div className="mt-3 space-y-2">
          <div>
            <label className="field-label">מה התכונה שאת הכי מעריכה בו/בה?</label>
            <input
              className="field-input"
              value={c.trait || ""}
              onChange={(e) => onChange({ trait: e.target.value })}
              placeholder="למשל: רגישה ואכפתית / שאפתן ונחוש / שמחה ומלאת חיים"
            />
          </div>
          {analyzing ? (
            <div className="flex items-center gap-2 rounded-2xl bg-blush/50 px-4 py-3 text-roseDark">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-rose border-t-transparent" />
              <span className="text-sm font-medium">מנתח/ת את הפאזל…</span>
            </div>
          ) : (
            <button className="btn-primary" onClick={onAnalyze}>✨ נתח/י לי את ההתאמה</button>
          )}
        </div>
      )}

      {/* תוצאה שמורה */}
      {c.done && c.message && (
        <p className="mt-3 rounded-2xl bg-white/70 px-3 py-2 text-sm font-medium leading-relaxed text-roseDark">{c.message}</p>
      )}
      {c.done && c.insight && (
        <div className="mt-3 rounded-2xl bg-white/70 px-3 py-2">
          <p className="mb-1 text-xs font-bold text-rose">🧩 תובנת השלמת הפאזל</p>
          <p className="text-sm leading-relaxed text-ink/90">{c.insight}</p>
        </div>
      )}

      {/* לולאת מעקב */}
      {c.done && (
        <button
          className={`mt-3 text-sm font-semibold ${c.followUp ? "text-amber-700" : "text-ink/50 hover:text-rose"}`}
          onClick={onFollowUp}
        >
          {c.followUp ? "✓ מסומן למעקב — בטלי תזכורת" : "⏰ הזכר לי מחר לשאול מה התקדם"}
        </button>
      )}
    </div>
  );
}
