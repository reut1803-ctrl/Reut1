"use client";

import { useState } from "react";
import Modal from "./Modal";
import {
  Eye, Phone, MessageSquare, Clock, ChevronDown, ChevronUp,
  Users, HelpCircle, Gift, PlayCircle, FileDown, Sparkles, Pin, BellOff,
} from "lucide-react";
import WhatsApp from "./icons/WhatsApp";

// ============================================================================
// "המועמדים שלי" — מסך השגריר (מרכז קשר והכשרה).
// שלב זה: ממשק בלבד עם *נתוני דמה* לאישור עיצוב. הלוגיקה האמיתית (זיהוי 30 יום,
// חלוקת עומס אמיתית, הסלמה) תחובר בשלב הבא — לכן אין כאן שום תלות בנתוני אמת.
// ============================================================================

// ----- נתוני דמה -----
const DEMO_TEAM = { me: "אפרים אברהם", partner: "שריה ניצן", name: "ישיבת עוד יוסף יצהר" };

const DEMO_ALERTS = [
  { id: "a1", name: "שמואל אהרון צחור", gender: "male", age: 22, phone: "052-463-0704", lastContact: 34, place: "ירושלים", work: "אברך, כולל 'תורת חיים'" },
  { id: "a2", name: "רבקה כהן",         gender: "female", age: 21, phone: "054-234-2558", lastContact: 31, place: "צפת", work: "גננת" },
  { id: "a3", name: "שמואל יוסף הולובר", gender: "male", age: 22, phone: "053-511-4224", lastContact: 46, place: "יצהר", work: "סטודנט להנדסה" },
  { id: "a4", name: "מרים פרידמן",       gender: "female", age: 23, phone: "052-980-1123", lastContact: 38, place: "בית שמש", work: "מטפלת רגשית" },
];

const DEMO_FAQ = [
  { q: "כל כמה זמן כדאי ליצור קשר עם מועמד?", a: "מומלץ מגע חם לפחות אחת ל-30 יום — גם בלי הצעה קונקרטית, רק כדי שירגישו מעטפת ושייכות." },
  { q: "מה כותבים בתיבת 'מה התחדש'?", a: "כל עדכon קצר: 'דיברנו, מחפש רצינית', 'ביקש הפסקה לחודש', 'הצעתי התאמה'. זה פרטי — גלוי רק לך ולצוות שלך." },
  { q: "מה עושים כשמועמד לא עונה?", a: "משאירים הודעת וואטסאפ חמה, מסמנים 'נודניק' לתזכורת, ומנסים שוב בעוד יומיים-שלושה." },
];

const DEMO_GIFTS = [
  { id: "g1", title: "סרטוני הדרכה", sub: "איך לנהל שיחת שגריר", icon: PlayCircle, pdf: "מדריך השגריר.pdf" },
  { id: "g2", title: "כרטיסיות ותרגילים", sub: "כלים מעשיים להורדה", icon: FileDown, pdf: "כרטיסיית שאלות פתיחה.pdf" },
];

// המרת מספר ישראלי לפורמט וואטסאפ (כמו בשאר המערכת)
function waNum(phone) {
  const d = (phone || "").replace(/[^0-9]/g, "");
  return d.startsWith("972") ? d : d.startsWith("0") ? "972" + d.slice(1) : d;
}

export default function MyCandidatesPanel() {
  const [openNote, setOpenNote] = useState(null); // מזהה השורה שמניפת "מה התחדש" פתוחה בה
  const [notes, setNotes] = useState({});          // טיוטות תיעוד (דמה, מקומי)
  const [snoozed, setSnoozed] = useState({});       // מי נדחה ל"נודניק"
  const [peek, setPeek] = useState(null);           // מועמד להצצה מהירה (עין)
  const [faqOpen, setFaqOpen] = useState(null);
  const [flipped, setFlipped] = useState({});       // קופסאות מתנה שהתהפכו

  const active = DEMO_ALERTS.filter((c) => !snoozed[c.id]);

  return (
    <div className="space-y-4">
      {/* ===== באנר חלוקת עומס לצוות ===== */}
      <div className="rounded-3xl border border-[#B08D57]/30 bg-gradient-to-l from-[#FBF4EA] to-blush/40 p-4">
        <p className="flex items-center gap-2 text-base font-bold text-roseDark">
          <Users className="h-5 w-5 text-[#B08D57]" strokeWidth={1.75} /> עבודת צוות מנצחת! 🤝
        </p>
        <p className="mt-1 text-sm leading-relaxed text-ink/70">
          חילקנו את רשימת המועמדים לתחזוקת קשר <b>שווה בשווה</b> בינך לבין {DEMO_TEAM.partner} —
          כך אף אחד לא נופל בין הכיסאות, ואתם מכסים יחד את כל הצוות.
        </p>
      </div>

      {/* ===== רשימת עבודה: התראות 30 יום ===== */}
      <div className="flex items-center justify-between px-1">
        <h2 className="flex items-center gap-2 text-lg font-bold text-roseDark">
          <Clock className="h-5 w-5" strokeWidth={1.75} /> טעון חידוש קשר
        </h2>
        <span className="rounded-full bg-blush px-3 py-0.5 text-sm font-bold text-roseDark">{active.length}</span>
      </div>
      <p className="-mt-2 px-1 text-xs text-ink/50">מועמדים שלא נוצר איתם קשר מעל 30 יום — כדאי מגע חם היום.</p>

      <div className="space-y-2.5">
        {active.map((c) => {
          const digits = (c.phone || "").replace(/[^0-9]/g, "");
          const noteOpen = openNote === c.id;
          const hasReport = !!(notes[c.id] || "").trim();
          return (
            <div key={c.id} className="overflow-hidden rounded-2xl border border-rose/15 bg-white/80 shadow-[0_6px_18px_rgba(167,79,79,0.07)]">
              {/* שורת מועמד */}
              <div className="flex items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-ink">{c.name}</p>
                  <p className="text-xs text-ink/50">{c.gender === "female" ? "בחורה" : "בחור"} · גיל {c.age} · {c.place}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-[#A84F4F]/70"><Clock className="h-3 w-3" strokeWidth={2} /> אחרון: לפני {c.lastContact} יום</p>
                </div>
                {/* הצצה מהירה (עין) */}
                <button onClick={() => setPeek(c)} title="הצצה לכרטיס" className="shrink-0 rounded-full bg-blush/70 p-2 text-roseDark transition hover:bg-blush">
                  <Eye className="h-5 w-5" strokeWidth={1.75} />
                </button>
              </div>

              {/* כפתורי קשר ישירים + נודניק */}
              <div className="flex flex-wrap items-center gap-2 px-3 pb-3">
                <a className="btn-soft !px-3 !py-1.5 text-xs" href={`tel:${digits}`}><Phone className="h-3.5 w-3.5" strokeWidth={1.75} /> חיוג</a>
                <a className="btn-soft !px-3 !py-1.5 text-xs" href={`sms:${digits}`}><MessageSquare className="h-3.5 w-3.5" strokeWidth={1.75} /> SMS</a>
                <a className="btn-soft !px-3 !py-1.5 text-xs" href={`https://wa.me/${waNum(c.phone)}`} target="_blank" rel="noreferrer"><WhatsApp size={14} className="text-green-600" /> וואטסאפ</a>
                <span className="text-[11px] text-ink/35" dir="ltr">{c.phone}</span>
                <button onClick={() => setSnoozed((s) => ({ ...s, [c.id]: true }))} className="ms-auto flex items-center gap-1 rounded-full border border-amber-300/60 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100">
                  <BellOff className="h-3.5 w-3.5" strokeWidth={1.75} /> נודניק
                </button>
              </div>

              {/* מניפת "מה התחדש" — תיעוד פרטי */}
              <button onClick={() => setOpenNote(noteOpen ? null : c.id)} className="flex w-full items-center justify-between border-t border-rose/10 bg-blush/20 px-3 py-2 text-right">
                <span className="flex items-center gap-1.5 text-sm font-semibold text-roseDark">
                  <Pin className="h-4 w-4" strokeWidth={1.75} /> מה התחדש?{hasReport && <span className="rounded-full bg-rose/15 px-2 py-0.5 text-[10px] font-bold text-roseDark">דווח ✓</span>}
                </span>
                {noteOpen ? <ChevronUp className="h-4 w-4 text-ink/40" /> : <ChevronDown className="h-4 w-4 text-ink/40" />}
              </button>
              {noteOpen && (
                <div className="space-y-1.5 px-3 pb-3 pt-2">
                  <textarea
                    className="field-input min-h-[70px] text-sm"
                    placeholder="כתוב/י עדכון קצר — למשל: 'דיברנו, מחפש רצינית', 'ביקש הפסקה לחודש'…"
                    value={notes[c.id] || ""}
                    onChange={(e) => setNotes((n) => ({ ...n, [c.id]: e.target.value }))}
                  />
                  <p className="flex items-center gap-1 text-[11px] text-ink/45">🔒 פרטי — גלוי רק לך ולצוות שלך. הזנת טקסט כאן נחשבת כ"דיווח".</p>
                </div>
              )}
            </div>
          );
        })}

        {active.length === 0 && (
          <div className="rounded-2xl bg-blush/30 p-6 text-center text-sm text-ink/50">🎉 כל הכבוד! אין כרגע מועמדים שממתינים לחידוש קשר.</div>
        )}
      </div>

      {/* ===== מרכז הכשרה וקהילה ===== */}
      <div className="mt-6 border-t border-sand pt-5">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-roseDark">
          <Sparkles className="h-5 w-5 text-[#B08D57]" strokeWidth={1.75} /> מרכז הכשרה וקהילה
        </h2>

        {/* קופסאות מתנה — Flip cards */}
        <div className="grid grid-cols-2 gap-3">
          {DEMO_GIFTS.map((g) => {
            const isFlipped = !!flipped[g.id];
            const Icon = g.icon;
            return (
              <div key={g.id} className="h-52 [perspective:1200px]" onClick={() => setFlipped((f) => ({ ...f, [g.id]: !f[g.id] }))}>
                <div className={`relative h-full w-full cursor-pointer transition-transform duration-500 [transform-style:preserve-3d] ${isFlipped ? "[transform:rotateY(180deg)]" : ""}`}>
                  {/* חזית — קופסת מתנה */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-3xl p-4 text-center [backface-visibility:hidden]"
                    style={{ background: "linear-gradient(145deg,#FBF4EA,#F3E6D2)", border: "1px solid rgba(176,141,87,.35)", boxShadow: "0 12px 28px rgba(176,141,87,.18)" }}>
                    <div className="flex h-14 w-14 items-center justify-center rounded-full" style={{ background: "linear-gradient(135deg,#CBB089,#B08D57)" }}>
                      <Gift className="h-7 w-7 text-white" strokeWidth={1.5} />
                    </div>
                    <p className="text-sm font-bold text-[#7a2e3b]">{g.title}</p>
                    <p className="text-[11px] text-ink/55">{g.sub}</p>
                    <span className="mt-1 text-[10px] font-semibold tracking-wide text-[#B08D57]">לחצו לפתיחה ✦</span>
                  </div>
                  {/* גב — תוכן ההדרכה */}
                  <div className="absolute inset-0 flex flex-col gap-2 rounded-3xl bg-white p-3 [backface-visibility:hidden] [transform:rotateY(180deg)]"
                    style={{ border: "1px solid rgba(176,141,87,.35)", boxShadow: "0 12px 28px rgba(176,141,87,.18)" }}>
                    <div className="flex aspect-video items-center justify-center rounded-xl bg-[#2b2224] text-white/80">
                      <span className="flex items-center gap-1.5 text-xs"><PlayCircle className="h-5 w-5" strokeWidth={1.5} /> סרטון הדרכה</span>
                    </div>
                    <p className="text-[10px] text-ink/40">כאן יוטמע iframe של YouTube/Vimeo</p>
                    <button className="mt-auto flex items-center justify-center gap-1.5 rounded-full border border-[#B08D57]/40 py-1.5 text-xs font-semibold text-[#9b7a46]">
                      <FileDown className="h-3.5 w-3.5" strokeWidth={1.75} /> {g.pdf}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* שאלות ותשובות */}
        <div className="mt-4 space-y-2">
          <p className="flex items-center gap-1.5 px-1 text-sm font-bold text-ink/70"><HelpCircle className="h-4 w-4 text-[#B08D57]" strokeWidth={1.75} /> שאלות ותשובות נפוצות</p>
          {DEMO_FAQ.map((f, i) => {
            const open = faqOpen === i;
            return (
              <div key={i} className="overflow-hidden rounded-2xl border border-rose/12 bg-white/70">
                <button onClick={() => setFaqOpen(open ? null : i)} className="flex w-full items-center justify-between gap-2 px-4 py-3 text-right">
                  <span className="text-sm font-semibold text-ink/85">{f.q}</span>
                  {open ? <ChevronUp className="h-4 w-4 shrink-0 text-ink/40" /> : <ChevronDown className="h-4 w-4 shrink-0 text-ink/40" />}
                </button>
                {open && <p className="px-4 pb-3 text-sm leading-relaxed text-ink/65">{f.a}</p>}
              </div>
            );
          })}
        </div>
      </div>

      {/* ===== הצצה מהירה לכרטיס (עין) ===== */}
      {peek && (
        <Modal title="הצצה מהירה" onClose={() => setPeek(null)}>
          <div className="space-y-3">
            <div>
              <p className="text-xl font-bold text-ink">{peek.name}</p>
              <p className="text-sm text-ink/55">{peek.gender === "female" ? "בחורה" : "בחור"} · גיל {peek.age} · {peek.place}</p>
            </div>
            <div className="rounded-2xl bg-blush/40 p-3 text-sm text-ink/80">
              <p><b className="text-roseDark">עיסוק:</b> {peek.work}</p>
              <p className="mt-1"><b className="text-roseDark">קשר אחרון:</b> לפני {peek.lastContact} יום</p>
              <p className="mt-1"><b className="text-roseDark">טלפון:</b> <span dir="ltr">{peek.phone}</span></p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a className="btn-soft !px-3 !py-1.5 text-xs" href={`tel:${(peek.phone || "").replace(/[^0-9]/g, "")}`}><Phone className="h-3.5 w-3.5" strokeWidth={1.75} /> חיוג</a>
              <a className="btn-soft !px-3 !py-1.5 text-xs" href={`https://wa.me/${waNum(peek.phone)}`} target="_blank" rel="noreferrer"><WhatsApp size={14} className="text-green-600" /> וואטסאפ</a>
            </div>
            <p className="text-[11px] text-ink/40">* הצצה מהירה (נתוני דמה). בגרסה המלאה תיפתח כאן תצוגת הכרטיס המלאה של המועמד.</p>
          </div>
        </Modal>
      )}
    </div>
  );
}
