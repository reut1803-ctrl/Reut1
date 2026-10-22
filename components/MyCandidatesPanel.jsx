"use client";

import { useEffect, useState } from "react";
import Modal from "./Modal";
import { DEFAULT_FAQ, DEFAULT_REFLECTION_FORM, saveReflection, monthKey, teamMembers } from "../lib/store";
import {
  Eye, Phone, MessageSquare, Clock, ChevronDown,
  Users, PlayCircle, FileDown, Pin, BellOff, NotebookPen, Check,
} from "lucide-react";
import WhatsApp from "./icons/WhatsApp";

// ============================================================================
// "המועמדים שלי" — מסך השגריר (מרכז קשר והכשרה).
// רשימת המועמדים עדיין עם נתוני דמה (לוגיקת ההסלמה תחובר בשלב ב').
// ה-FAQ דינמי מלוח הבקרה, והסיכום החודשי נשמר במסד תחת פרופיל השגריר.
// ============================================================================

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";
// נייר העטיפה של קופסאות המתנה. להחלפת התבנית — מחליפים את הקובץ
// public/assets/harlequin-pink.jpg (באותו שם), בלי לגעת בקוד.
const WRAP_URL = `${BASE}/assets/harlequin-pink.jpg`;

const WINE = "#6d2433";

// רשימת "טעון חידוש קשר" עדיין על נתוני דמה — מוסתרת באתר החי עד שיחובר
// מנגנון ה-30 יום האמיתי (שלב ב'). להצגת הדמו: true.
const SHOW_DEMO_ALERTS = false;
const DEMO_ALERTS = [
  { id: "a1", name: "שמואל אהרון צחור", gender: "male", age: 22, phone: "052-463-0704", lastContact: 34, place: "ירושלים", work: "אברך, כולל 'תורת חיים'" },
  { id: "a2", name: "רבקה כהן",          gender: "female", age: 21, phone: "054-234-2558", lastContact: 31, place: "צפת", work: "גננת" },
  { id: "a3", name: "שמואל יוסף הולובר",  gender: "male", age: 22, phone: "053-511-4224", lastContact: 46, place: "יצהר", work: "סטודנט להנדסה" },
  { id: "a4", name: "מרים פרידמן",        gender: "female", age: 23, phone: "052-980-1123", lastContact: 38, place: "בית שמש", work: "מטפלת רגשית" },
];
const DEMO_GIFTS = [
  { id: "g1", label: "איך לנהל שיחת שגריר", sub: "סרטון הדרכה", pdf: "מדריך השגריר.pdf" },
  { id: "g2", label: "כרטיסיות ותרגילים להורדה", sub: "כלים מעשיים", pdf: "כרטיסיית שאלות פתיחה.pdf" },
];

const MONTHS_HE = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];
const monthLabel = (key) => {
  const [y, m] = (key || "").split("-");
  return m ? `${MONTHS_HE[Number(m) - 1]} ${y}` : key;
};

function waNum(phone) {
  const d = (phone || "").replace(/[^0-9]/g, "");
  return d.startsWith("972") ? d : d.startsWith("0") ? "972" + d.slice(1) : d;
}

// ---------- כותרת עם מרקר ורוד באלכסון ----------
function SkewTitle({ children, className = "" }) {
  return <h2 className={`text-xl font-bold ${className}`}><span className="title-skew">{children}</span></h2>;
}

// ---------- פרפר (סרט הקשירה) — SVG בבורדו-יין ----------
function Bow({ className = "" }) {
  return (
    <svg viewBox="0 0 140 78" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="ribbonG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8a3344" />
          <stop offset="1" stopColor="#56192a" />
        </linearGradient>
      </defs>
      {/* זנבות */}
      <path d="M64 44 L48 76 L57 71 L62 77 L69 46 Z" fill="url(#ribbonG)" />
      <path d="M76 44 L92 76 L83 71 L78 77 L71 46 Z" fill="url(#ribbonG)" />
      {/* לולאות */}
      <path d="M70 40 C 52 8, 10 6, 14 32 C 17 52, 50 50, 70 40 Z" fill="url(#ribbonG)" />
      <path d="M70 40 C 88 8, 130 6, 126 32 C 123 52, 90 50, 70 40 Z" fill="url(#ribbonG)" />
      {/* קפלי אור עדינים */}
      <path d="M66 38 C 52 22, 28 18, 24 30" fill="none" stroke="#b25a6b" strokeWidth="2" strokeLinecap="round" opacity=".55" />
      <path d="M74 38 C 88 22, 112 18, 116 30" fill="none" stroke="#b25a6b" strokeWidth="2" strokeLinecap="round" opacity=".55" />
      {/* קשר */}
      <rect x="61" y="30" width="18" height="20" rx="6" fill="#4a1422" />
    </svg>
  );
}

// ---------- קופסת מתנה — "חלון ראווה" ----------
function GiftBox({ gift, flipped, onToggle }) {
  return (
    <div className="h-[330px] [perspective:1400px]">
      <div className={`flip-3d relative h-full w-full ${flipped ? "flipped" : ""}`}>
        {/* חזית: הקופסה */}
        <button type="button" onClick={onToggle} aria-label={`פתיחת המתנה: ${gift.label}`}
          className="flip-face absolute inset-0 flex items-center justify-center overflow-hidden rounded-[30px] bg-[#F3E2DF]">
          <div className="relative h-[230px] w-[62%] max-w-[250px]">
            {/* צל רצפה */}
            <div className="absolute -bottom-5 left-1/2 h-6 w-[115%] -translate-x-1/2 rounded-[50%] bg-[#7a2e3b]/20 blur-lg" />
            {/* גוף הקופסה */}
            <div className="absolute inset-x-0 bottom-0 top-[22%] rounded-[6px] shadow-[inset_0_-10px_18px_rgba(122,46,59,0.10),0_14px_28px_-12px_rgba(122,46,59,0.45)]"
              style={{ backgroundImage: `url(${WRAP_URL})`, backgroundSize: "120px auto", backgroundPosition: "center" }} />
            {/* מכסה — רחב מעט מהגוף */}
            <div className="absolute -inset-x-[5%] top-[10%] h-[18%] rounded-[6px] shadow-[0_8px_14px_-6px_rgba(122,46,59,0.45)]"
              style={{ backgroundImage: `url(${WRAP_URL})`, backgroundSize: "120px auto", backgroundPosition: "center 30%" }} />
            {/* סרט אנכי */}
            <div className="absolute bottom-0 left-1/2 top-[10%] w-[13%] -translate-x-1/2"
              style={{ background: `linear-gradient(90deg, #4f1626, ${WINE} 30%, #8a3344 55%, ${WINE} 80%, #4f1626)` }} />
            {/* פרפר */}
            <Bow className="absolute left-1/2 top-[-14%] w-[62%] -translate-x-1/2 drop-shadow-[0_6px_6px_rgba(74,20,34,0.35)]" />
            {/* תווית צפה — חורגת מרוחב הקופסה */}
            <div className="absolute left-1/2 top-[50%] w-[128%] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[#CBB089]/60 px-4 py-3.5 text-center shadow-[0_14px_30px_-10px_rgba(60,15,25,0.65)]"
              style={{ background: `linear-gradient(160deg, #7d2a3b, #551828)` }}>
              <p className="text-[15px] font-bold leading-snug text-[#FBF3E6]">{gift.label}</p>
              <p className="mt-0.5 text-[11px] font-medium tracking-wide text-[#E6CF9F]">{gift.sub} · לחצו לפתיחה</p>
            </div>
          </div>
        </button>

        {/* גב: תוכן ההדרכה */}
        <div className="flip-face flip-back absolute inset-0 flex flex-col gap-3 rounded-[30px] bg-[#FFFBF6] p-5 shadow-[0_20px_44px_-20px_rgba(122,46,59,0.45)] ring-1 ring-[#CBB089]/40">
          <p className="text-center text-sm font-bold text-[#7a2e3b]">{gift.label}</p>
          <div className="flex aspect-video items-center justify-center rounded-2xl bg-gradient-to-br from-[#2b2224] to-[#3a2e31] text-white/85">
            <span className="flex items-center gap-1.5 text-xs"><PlayCircle className="h-6 w-6" strokeWidth={1.4} /> כאן יוטמע סרטון (YouTube/Vimeo)</span>
          </div>
          <div className="mt-auto flex gap-2">
            <button type="button" className="flex flex-1 items-center justify-center gap-1.5 rounded-full py-2.5 text-xs font-semibold text-[#FBF3E6]" style={{ background: WINE }}>
              <FileDown className="h-3.5 w-3.5" strokeWidth={1.75} /> {gift.pdf}
            </button>
            <button type="button" onClick={onToggle} className="rounded-full border border-[#7a2e3b]/25 px-4 py-2.5 text-xs font-semibold text-[#7a2e3b]">סגירת המתנה</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- סיכום חודשי ("איך עבר החודש?") — השאלות נשלפות מלוח הבקרה ----------
function ReflectionModal({ user, data, onClose }) {
  const month = monthKey();
  const repId = user?.repId;
  const rep = (data?.reps || []).find((r) => r.id === repId);
  const form = data?.reflectionForm || DEFAULT_REFLECTION_FORM;
  const questions = form.questions || [];
  const existing = (data?.reflections || []).find((r) => r.id === `${repId}_${month}`);
  const [answers, setAnswers] = useState({});
  const [state, setState] = useState("idle"); // idle | saving | saved | error

  useEffect(() => {
    if (existing) setAnswers(existing.answers || {});
  }, [existing?.updatedAt]); // eslint-disable-line react-hooks/exhaustive-deps

  const canSave = !!repId && questions.some((q) => (answers[q.id] || "").trim());
  async function save() {
    if (!canSave) return;
    setState("saving");
    try {
      const clean = {};
      questions.forEach((q) => { clean[q.id] = (answers[q.id] || "").trim(); });
      await saveReflection({ repId, repName: rep?.name || "", month, answers: clean, questions });
      setState("saved");
      setTimeout(onClose, 900);
    } catch (e) {
      setState("error");
    }
  }

  return (
    <Modal title={`איך עבר החודש? · ${monthLabel(month)}`} onClose={onClose}>
      <div className="space-y-4">
        {form.intro && <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink/65">{form.intro}</p>}
        {!repId && <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">הטופס מיועד לשגרירים. (מחוברת כמנהלת — אפשר לראות איך הוא נראה, השמירה פתוחה לשגרירים בלבד.)</p>}
        {questions.map((q) => (
          <div key={q.id}>
            <label className="field-label">{q.label}</label>
            <textarea className="field-input min-h-[96px] text-sm" placeholder={q.hint || ""} value={answers[q.id] || ""}
              onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))} />
          </div>
        ))}
        {existing && <p className="text-xs text-ink/45">כבר מילאת החודש — אפשר לעדכן, הגרסה החדשה תחליף את הקודמת.</p>}
        <div className="modal-footer flex gap-3">
          <button className="btn-primary flex-1" disabled={!canSave || state === "saving"} onClick={save}>
            {state === "saving" ? "שומר…" : state === "saved" ? (<><Check className="h-4 w-4" strokeWidth={2.25} /> נשמר, תודה!</>) : "שמירה"}
          </button>
          <button className="btn-soft flex-1" onClick={onClose}>ביטול</button>
        </div>
        {state === "error" && <p className="text-sm text-roseDark">השמירה נכשלה. בדקי חיבור לאינטרנט ונסי שוב — מה שכתבת לא נמחק.</p>}
      </div>
    </Modal>
  );
}

export default function MyCandidatesPanel({ data, user }) {
  const [openNote, setOpenNote] = useState(null);
  const [notes, setNotes] = useState({});
  const [snoozed, setSnoozed] = useState({});
  const [peek, setPeek] = useState(null);
  const [faqOpen, setFaqOpen] = useState(null);
  const [flipped, setFlipped] = useState({});
  const [reflecting, setReflecting] = useState(false);

  const active = DEMO_ALERTS.filter((c) => !snoozed[c.id]);
  // באנר צוות — רק כשלשגריר המחובר יש באמת שותפים לצוות (agency_name משותף)
  const myRep = (data?.reps || []).find((r) => r.id === user?.repId);
  const partners = myRep ? teamMembers(myRep, data?.reps || []).filter((r) => r.id !== myRep.id) : [];
  const faqList = (data && Array.isArray(data.faq) && data.faq.length) ? data.faq : DEFAULT_FAQ;
  const month = monthKey();
  const myReflection = user?.repId ? (data?.reflections || []).find((r) => r.id === `${user.repId}_${month}`) : null;

  const CARD = "rounded-[26px] bg-white/90 shadow-[0_18px_42px_-18px_rgba(122,46,59,0.22)] ring-1 ring-rose/10";

  return (
    <div className="space-y-5">
      {/* ===== באנר חלוקת עומס לצוות ===== */}
      {partners.length > 0 && <div className="rounded-[26px] bg-[#F3E2DF] p-5">
        <p className="flex items-center gap-2 text-base font-bold text-[#7a2e3b]"><Users className="h-5 w-5" strokeWidth={1.75} /> עבודת צוות מנצחת</p>
        <p className="mt-1.5 text-sm leading-relaxed text-ink/70">
          חילקנו את רשימת המועמדים לתחזוקת קשר שווה בשווה בינך לבין {partners.map((r) => r.name).join(" ו")} — כך אף אחד לא נופל בין הכיסאות.
        </p>
      </div>}

      {/* ===== סיכום חודשי ===== */}
      <button type="button" onClick={() => setReflecting(true)}
        className="flex w-full items-center gap-4 rounded-[26px] p-5 text-right shadow-[0_18px_40px_-18px_rgba(60,15,25,0.6)] transition active:scale-[0.99]"
        style={{ background: "linear-gradient(150deg,#7d2a3b,#551828)" }}>
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#CBB089]/60 bg-[#FBF3E6]/10">
          <NotebookPen className="h-6 w-6 text-[#E6CF9F]" strokeWidth={1.5} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-bold text-[#FBF3E6]">איך עבר החודש?</span>
          <span className="mt-0.5 block text-xs text-[#E6CF9F]">
            {myReflection ? `מילאת את הסיכום של ${monthLabel(month)} ✓ · לחצו לעדכון` : `סיכום קצר ל${monthLabel(month)} · שלוש שאלות, שתי דקות`}
          </span>
        </span>
      </button>

      {/* ===== רשימת עבודה: התראות 30 יום (מוסתרת עד חיבור הנתונים האמיתיים) ===== */}
      {SHOW_DEMO_ALERTS && (<>
      <div className="px-1">
        <div className="flex items-center justify-between">
          <SkewTitle>טעון חידוש קשר</SkewTitle>
          <span className="rounded-full bg-[#7a2e3b] px-3 py-0.5 text-sm font-bold text-[#FBF3E6]">{active.length}</span>
        </div>
        <p className="mt-1 text-xs text-ink/45">מועמדים שלא נוצר איתם קשר מעל 30 יום — כדאי מגע חם היום.</p>
      </div>

      <div className="space-y-3.5">
        {active.map((c) => {
          const digits = (c.phone || "").replace(/[^0-9]/g, "");
          const noteOpen = openNote === c.id;
          const hasReport = !!(notes[c.id] || "").trim();
          return (
            <div key={c.id} className={`overflow-hidden ${CARD}`}>
              <div className="flex items-center gap-3 p-4 pb-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[17px] font-bold text-ink">{c.name}</p>
                  <p className="mt-0.5 text-xs text-ink/50">{c.gender === "female" ? "בחורה" : "בחור"} · גיל {c.age} · {c.place}</p>
                  <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-[#F3E2DF] px-2 py-0.5 text-[11px] font-semibold text-[#7a2e3b]"><Clock className="h-3 w-3" strokeWidth={2} /> אחרון: לפני {c.lastContact} יום</p>
                </div>
                <button onClick={() => setPeek(c)} title="הצצה לכרטיס" className="shrink-0 rounded-2xl bg-[#F3E2DF] p-2.5 text-[#7a2e3b] transition hover:scale-105 active:scale-95">
                  <Eye className="h-5 w-5" strokeWidth={1.75} />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 px-4 pb-4">
                <a className="btn-soft !rounded-full !px-3.5 !py-1.5 text-xs" href={`tel:${digits}`}><Phone className="h-3.5 w-3.5" strokeWidth={1.75} /> חיוג</a>
                <a className="btn-soft !rounded-full !px-3.5 !py-1.5 text-xs" href={`sms:${digits}`}><MessageSquare className="h-3.5 w-3.5" strokeWidth={1.75} /> SMS</a>
                <a className="btn-soft !rounded-full !px-3.5 !py-1.5 text-xs" href={`https://wa.me/${waNum(c.phone)}`} target="_blank" rel="noreferrer"><WhatsApp size={14} className="text-green-600" /> וואטסאפ</a>
                <button onClick={() => setSnoozed((s) => ({ ...s, [c.id]: true }))} className="ms-auto flex items-center gap-1 rounded-full border border-[#7a2e3b]/20 bg-white px-3.5 py-1.5 text-xs font-semibold text-[#7a2e3b] transition hover:bg-[#F3E2DF] active:scale-95">
                  <BellOff className="h-3.5 w-3.5" strokeWidth={1.75} /> נודניק
                </button>
              </div>

              <button onClick={() => setOpenNote(noteOpen ? null : c.id)} className="flex w-full items-center justify-between border-t border-rose/10 bg-[#FBF5F3] px-4 py-3 text-right">
                <span className="flex items-center gap-1.5 text-[15px] font-bold">
                  <Pin className="h-4 w-4 text-[#7a2e3b]" strokeWidth={1.75} /> <span className="title-skew">מה התחדש?</span>
                  {hasReport && <span className="rounded-full bg-[#7a2e3b] px-2 py-0.5 text-[10px] font-bold text-[#FBF3E6]">דווח ✓</span>}
                </span>
                <ChevronDown className={`h-4 w-4 text-ink/40 transition-transform duration-300 ${noteOpen ? "rotate-180" : ""}`} />
              </button>
              <div className={`acc-smooth ${noteOpen ? "open" : ""}`}>
                <div className="acc-inner">
                  <div className="space-y-1.5 px-4 pb-4 pt-2.5">
                    <textarea
                      className="field-input min-h-[72px] text-sm"
                      placeholder="כתוב/י עדכון קצר — למשל: 'דיברנו, מחפש רצינית', 'ביקש הפסקה לחודש'…"
                      value={notes[c.id] || ""}
                      onChange={(e) => setNotes((n) => ({ ...n, [c.id]: e.target.value }))}
                    />
                    <p className="text-[11px] text-ink/45">🔒 פרטי — גלוי רק לך ולצוות שלך. הזנת טקסט כאן נחשבת כ"דיווח".</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {active.length === 0 && (
          <div className={`p-7 text-center text-sm text-ink/55 ${CARD}`}>🎉 כל הכבוד! אין כרגע מועמדים שממתינים לחידוש קשר.</div>
        )}
      </div>
      </>)}

      {/* ===== מרכז הכשרה וקהילה — חלון ראווה ===== */}
      <div className="mt-8 space-y-4 border-t border-[#7a2e3b]/10 pt-7">
        <div className="text-center">
          <SkewTitle>מרכז הכשרה וקהילה</SkewTitle>
          <p className="mt-1.5 text-xs text-ink/50">מתנה קטנה מאיתנו לכל שגריר — לחצו על קופסה כדי לפתוח</p>
        </div>
        {DEMO_GIFTS.map((g) => (
          <GiftBox key={g.id} gift={g} flipped={!!flipped[g.id]} onToggle={() => setFlipped((f) => ({ ...f, [g.id]: !f[g.id] }))} />
        ))}

        {/* שאלות ותשובות — דינמי מלוח הבקרה */}
        <div className="space-y-2.5 pt-3">
          <div className="px-1"><SkewTitle className="!text-lg">שאלות ותשובות</SkewTitle></div>
          {faqList.map((f, i) => {
            const open = faqOpen === i;
            return (
              <div key={f.id || i} className={`overflow-hidden ${CARD}`}>
                <button onClick={() => setFaqOpen(open ? null : i)} className="flex w-full items-center justify-between gap-2 px-4 py-3.5 text-right">
                  <span className="text-sm font-semibold text-ink/85">{f.question}</span>
                  <ChevronDown className={`h-4 w-4 shrink-0 text-ink/40 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
                </button>
                <div className={`acc-smooth ${open ? "open" : ""}`}>
                  <div className="acc-inner">
                    <p className="whitespace-pre-wrap px-4 pb-4 text-sm leading-relaxed text-ink/65">{f.answer}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ===== הצצה מהירה (עין) ===== */}
      {peek && (
        <Modal title="הצצה מהירה" onClose={() => setPeek(null)}>
          <div className="space-y-3">
            <div>
              <p className="text-xl font-bold text-ink">{peek.name}</p>
              <p className="text-sm text-ink/55">{peek.gender === "female" ? "בחורה" : "בחור"} · גיל {peek.age} · {peek.place}</p>
            </div>
            <div className="rounded-2xl bg-[#F3E2DF] p-3 text-sm text-ink/80">
              <p><b className="text-[#7a2e3b]">עיסוק:</b> {peek.work}</p>
              <p className="mt-1"><b className="text-[#7a2e3b]">קשר אחרון:</b> לפני {peek.lastContact} יום</p>
              <p className="mt-1"><b className="text-[#7a2e3b]">טלפון:</b> <span dir="ltr">{peek.phone}</span></p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a className="btn-soft !rounded-full !px-3.5 !py-1.5 text-xs" href={`tel:${(peek.phone || "").replace(/[^0-9]/g, "")}`}><Phone className="h-3.5 w-3.5" strokeWidth={1.75} /> חיוג</a>
              <a className="btn-soft !rounded-full !px-3.5 !py-1.5 text-xs" href={`https://wa.me/${waNum(peek.phone)}`} target="_blank" rel="noreferrer"><WhatsApp size={14} className="text-green-600" /> וואטסאפ</a>
            </div>
            <p className="text-[11px] text-ink/40">* הצצה מהירה (נתוני דמה). בגרסה המלאה תיפתח כאן תצוגת הכרטיס המלאה של המועמד.</p>
          </div>
        </Modal>
      )}

      {reflecting && <ReflectionModal user={user} data={data} onClose={() => setReflecting(false)} />}
    </div>
  );
}
