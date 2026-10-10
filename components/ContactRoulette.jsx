"use client";

import { useEffect, useState } from "react";
import Modal from "./Modal";
import {
  loadRoulette,
  saveRoulette,
  clearRoulette,
  buildDraw,
  appendNames,
  outreachMessage,
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
  const [expandedId, setExpandedId] = useState(null);
  const [resetModal, setResetModal] = useState(false); // חלון "אתגר חדש"
  const [addMode, setAddMode] = useState(false); // הוספה לרשימה קיימת (בלי מחיקה)

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

  // קליטת שמות — או יצירת רשימה חדשה, או הוספה לקיימת (addMode) בלי למחוק כלום.
  function intakeNames(names) {
    const clean = (names || []).filter(Boolean);
    if (clean.length === 0) {
      alert("לא נמצאו שמות. נסי לבחור שוב או להקליד ידנית.");
      return;
    }
    if (addMode && state) {
      persist(appendNames(state, clean));
    } else {
      persist(buildDraw(clean));
    }
    setManual(false);
    setManualText("");
    setAddMode(false);
  }

  async function pickFromPhone() {
    try {
      // מבקשים גם מספר טלפון אם הדפדפן תומך (כדי לאפשר שיחה/SMS/וואטסאפ).
      let props = ["name"];
      try {
        const supported = await navigator.contacts.getProperties();
        if (supported.includes("tel")) props = ["name", "tel"];
      } catch (e) {}
      const selected = await navigator.contacts.select(props, { multiple: true });
      const items = (selected || [])
        .map((c) => ({ name: (c.name && c.name[0]) || "", phone: (c.tel && c.tel[0]) || "" }))
        .filter((x) => x.name);
      if (items.length === 0) {
        alert("לא נבחרו אנשי קשר.");
        return;
      }
      intakeNames(items);
    } catch (e) {
      setManual(true); // ביטול/חסימה — ניפול בעדינות להקלדה ידנית
    }
  }

  function submitManual() {
    const names = manualText.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
    if (names.length === 0) {
      alert("נא להקליד לפחות שם אחד.");
      return;
    }
    intakeNames(names);
  }

  // איפוס מלא (מתוך חלון הבחירה — ללא confirm נוסף).
  function doFullReset() {
    clearRoulette(ownerId);
    setState(null);
    setManual(false);
    setManualText("");
    setAddMode(false);
    setExpandedId(null);
    setResetModal(false);
  }

  // בחירת "השאר את הקיימים והוסף עוד" — פותח את ממשק ההוספה בלי למחוק.
  function startAddMore() {
    setAddMode(true);
    setManual(!pickerSupported); // אם אין בוחר — ישר להקלדה
    setResetModal(false);
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
    setTimeout(() => {
      setContact(c.id, { done: true, insight: puzzleInsight(trait) });
      setAnalyzingId(null);
    }, 1300);
  }

  const contacts = state?.contacts || [];
  const handled = contacts.filter((c) => c.done).length;
  const progressPct = contacts.length ? Math.round((handled / contacts.length) * 100) : 0;

  // ממשק הוספת שמות (משמש גם במסך פתיחה וגם בהוספה לרשימה קיימת).
  const addUI = (
    <div className="space-y-2">
      {!manual && (
        <div className="flex flex-wrap gap-2">
          {pickerSupported && (
            <button className="btn-primary" onClick={pickFromPhone}>📇 בחירה מאנשי הקשר</button>
          )}
          <button className="btn-soft" onClick={() => setManual(true)}>✍️ הקלדת שמות ידנית</button>
          {addMode && (
            <button className="btn-soft" onClick={() => { setAddMode(false); setManual(false); }}>ביטול</button>
          )}
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
            <button className="btn-primary" onClick={submitManual}>{addMode ? "הוסף לרשימה ➕" : "המשך לאתגר ✨"}</button>
            <button className="btn-soft" onClick={() => { setManual(false); if (addMode) setAddMode(false); }}>ביטול</button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="card border-rose/40">
      {/* כותרת מתקפלת */}
      <button onClick={() => setOpenPanel((v) => !v)} className="flex w-full items-center justify-between gap-2 text-right">
        <span className="flex items-center gap-2 text-lg font-bold text-roseDark">🎯 רולטת אנשי קשר — האתגר היומי</span>
        <span className="flex items-center gap-2">
          {state && (
            <span className="rounded-full bg-blush px-2.5 py-0.5 text-sm font-bold text-roseDark">{handled}/{contacts.length}</span>
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
              {addUI}
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
                  <div className="h-full rounded-full bg-rose transition-all duration-500" style={{ width: `${progressPct}%` }} />
                </div>
                {handled === contacts.length && contacts.length > 0 && (
                  <p className="mt-2 text-center text-sm font-bold text-roseDark">🎉 כל הכבוד! סיימת את האתגר היומי</p>
                )}
              </div>

              {/* ממשק הוספה (כשנבחר "השאר את הקיימים והוסף עוד") */}
              {addMode && (
                <div className="rounded-2xl border border-rose/30 bg-blush/30 p-3">
                  <p className="mb-2 text-sm font-bold text-roseDark">➕ הוספת אנשים לרשימה (בלי למחוק את הקיימים)</p>
                  {addUI}
                </div>
              )}

              {/* הקלפים */}
              <div className="space-y-3">
                {contacts.map((c) => (
                  <ContactCardItem
                    key={c.id}
                    c={c}
                    analyzing={analyzingId === c.id}
                    expanded={expandedId === c.id}
                    onToggleExpand={() => setExpandedId((id) => (id === c.id ? null : c.id))}
                    onPickStatus={(status) => setContact(c.id, { status })}
                    onChange={(patch) => setContact(c.id, patch)}
                    onSaveCouple={() => saveCouple(c)}
                    onAnalyze={() => analyzeSingle(c)}
                    onFollowUp={() => setContact(c.id, { followUp: !c.followUp, frozen: false })}
                    onToggleFreeze={() => setContact(c.id, { frozen: !c.frozen, followUp: false })}
                  />
                ))}
              </div>

              {!addMode && (
                <button className="btn-soft w-full text-sm" onClick={() => setResetModal(true)}>🔄 אתגר חדש</button>
              )}
            </div>
          )}
        </div>
      )}

      {/* חלון בחירה ל"אתגר חדש" — מונע מחיקה בטעות */}
      {resetModal && (
        <Modal title="🔄 אתגר חדש — מה תרצי לעשות?" onClose={() => setResetModal(false)}>
          <div className="space-y-3">
            <button
              className="w-full rounded-2xl border border-sand bg-white p-4 text-right transition hover:border-rose hover:shadow"
              onClick={startAddMore}
            >
              <p className="font-bold text-roseDark">➕ השאר את הקיימים והוסף עוד אנשים</p>
              <p className="mt-1 text-sm text-ink/60">מוסיף אנשים חדשים לרשימה הנוכחית ומעדכן את ההתקדמות — בלי למחוק שום מידע קיים.</p>
            </button>
            <button
              className="w-full rounded-2xl border border-sand bg-white p-4 text-right transition hover:border-rose hover:shadow"
              onClick={() => { if (confirm("לאפס ולמחוק את כל הרשימה הנוכחית מהמכשיר?")) doFullReset(); }}
            >
              <p className="font-bold text-ink">🗑️ אפס הכל והתחל אתגר חדש</p>
              <p className="mt-1 text-sm text-ink/60">מוחק את כל האנשים וההערות הנוכחיים ומתחיל רשימה חדשה לגמרי.</p>
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// קלף בודד
function ContactCardItem({ c, analyzing, expanded, onToggleExpand, onPickStatus, onChange, onSaveCouple, onAnalyze, onFollowUp, onToggleFreeze }) {
  const msg = outreachMessage(c);
  const digits = (c.phone || "").replace(/[^0-9]/g, "");
  const hasPhone = digits.length >= 6;
  // המרת מספר ישראלי מקומי לפורמט בינלאומי עבור וואטסאפ.
  const waNum = digits.startsWith("972") ? digits : digits.startsWith("0") ? "972" + digits.slice(1) : digits;
  const waHref = hasPhone
    ? `https://wa.me/${waNum}?text=${encodeURIComponent(msg)}`
    : `https://wa.me/?text=${encodeURIComponent(msg)}`;

  function copyMsg() {
    try {
      navigator.clipboard.writeText(msg);
      alert("ההודעה הועתקה ללוח ✓");
    } catch (e) {
      alert(msg);
    }
  }

  return (
    <div className={`rounded-2xl border p-4 transition ${c.frozen ? "border-slate-300 bg-slate-50" : c.done ? "border-rose/30 bg-blush/30" : "border-sand bg-white"}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* חץ אקורדיון — מוצג רק לקלף שכבר טופל (יש מה להרחיב) */}
          {c.done && (
            <button onClick={onToggleExpand} className="text-ink/40 hover:text-rose" title="פרטים נוספים">
              {expanded ? "▲" : "▼"}
            </button>
          )}
          <p className="text-lg font-bold text-ink">{c.name}</p>
        </div>
        {c.frozen ? (
          <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-bold text-slate-600">🧊 מוקפא/תפוס</span>
        ) : c.followUp ? (
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">👀 במעקב</span>
        ) : c.done ? (
          <span className="text-xl">✓</span>
        ) : null}
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
            <input className="field-input" value={c.networking?.style || ""} onChange={(e) => onChange({ networking: { ...(c.networking || {}), style: e.target.value } })} />
          </div>
          <div>
            <label className="field-label">על אילו 2 מועמדים שלנו נתייעץ איתם?</label>
            <input className="field-input" value={c.networking?.consult || ""} onChange={(e) => onChange({ networking: { ...(c.networking || {}), consult: e.target.value } })} />
          </div>
          <button className="btn-primary" onClick={onSaveCouple}>שמירה 💾</button>
        </div>
      )}

      {/* מסלול רווק/ה — תובנת AI */}
      {c.status === "single" && !c.done && (
        <div className="mt-3 space-y-2">
          <div>
            <label className="field-label">מה התכונה שאת הכי מעריכה בו/בה?</label>
            <input className="field-input" value={c.trait || ""} onChange={(e) => onChange({ trait: e.target.value })} placeholder="למשל: רגישה ואכפתית / שאפתן ונחוש / שמחה ומלאת חיים" />
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

      {/* אחרי טיפול: הקלט של הנציגה הוא התוכן המרכזי; הודעת המערכת — שורה עדינה אחת בלבד */}
      {c.done && (
        <div className="mt-3 space-y-2">
          {c.status === "couple" ? (
            <div className="rounded-2xl bg-white/70 px-3 py-2 text-sm text-ink/90">
              <p className="mb-1 text-xs font-bold text-ink/50">📌 מה שמילאת</p>
              {c.networking?.style && <p>סגנון לשידוך: {c.networking.style}</p>}
              {c.networking?.consult && <p>להתייעץ על: {c.networking.consult}</p>}
              {!c.networking?.style && !c.networking?.consult && <p className="text-ink/40">—</p>}
            </div>
          ) : (
            <>
              {c.trait && (
                <div className="rounded-2xl bg-white/70 px-3 py-2 text-sm text-ink/90">
                  <p className="mb-1 text-xs font-bold text-ink/50">📌 מה שמילאת</p>
                  <p>התכונה שציינת: {c.trait}</p>
                </div>
              )}
              {c.insight && (
                <div className="rounded-2xl bg-white/70 px-3 py-2">
                  <p className="mb-1 text-xs font-bold text-rose">🧩 תובנת השלמת הפאזל</p>
                  <p className="text-sm leading-relaxed text-ink/90">{c.insight}</p>
                </div>
              )}
            </>
          )}
          {/* חיווי מערכת כללי — פעם אחת, עדין */}
          {c.message && <p className="px-1 text-xs italic text-roseDark/70">{c.message}</p>}
        </div>
      )}

      {/* מגירת אקורדיון — הערות, יצירת קשר, הקפאה */}
      {c.done && expanded && (
        <div className="mt-3 space-y-3 border-t border-sand pt-3">
          <div>
            <label className="field-label">הערות אישיות שלי</label>
            <textarea
              className="field-input min-h-[72px]"
              placeholder="כל מה שחשוב לזכור על הקשר הזה…"
              value={c.notes || ""}
              onChange={(e) => onChange({ notes: e.target.value })}
            />
          </div>

          {/* דרכי יצירת קשר — שורת אייקונים עדינה */}
          <div>
            <p className="mb-1.5 text-xs font-bold text-ink/50">דרכי יצירת קשר</p>
            <div className="flex flex-wrap items-center gap-2">
              {hasPhone && (
                <a className="flex h-9 w-9 items-center justify-center rounded-full bg-blush text-lg transition hover:bg-rose/20" href={`tel:${digits}`} title="שיחה">📞</a>
              )}
              {hasPhone && (
                <a className="flex h-9 w-9 items-center justify-center rounded-full bg-blush text-lg transition hover:bg-rose/20" href={`sms:${digits}`} title="SMS">💬</a>
              )}
              <a className="flex h-9 w-9 items-center justify-center rounded-full bg-blush text-lg transition hover:bg-rose/20" href={waHref} target="_blank" rel="noreferrer" title="וואטסאפ">🟢</a>
              <button className="flex h-9 w-9 items-center justify-center rounded-full bg-blush text-lg transition hover:bg-rose/20" onClick={copyMsg} title="העתק הודעה">📋</button>
              {!hasPhone && <span className="text-xs text-ink/40">לא נשמר מספר — אפשר להעתיק ולהדביק</span>}
            </div>
          </div>

          <button className="btn-soft w-full" onClick={onToggleFreeze}>
            {c.frozen ? "♻️ החזר לפעיל" : "🧊 הקפאה / השהיה"}
          </button>
        </div>
      )}

      {/* לולאת מעקב */}
      {c.done && !c.frozen && (
        <button className={`mt-3 text-sm font-semibold ${c.followUp ? "text-amber-700" : "text-ink/50 hover:text-rose"}`} onClick={onFollowUp}>
          {c.followUp ? "✓ מסומן למעקב — בטלי תזכורת" : "⏰ הזכר לי מחר לשאול מה התקדם"}
        </button>
      )}
    </div>
  );
}
