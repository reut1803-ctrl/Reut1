"use client";

import { useState } from "react";
import Modal from "./Modal";
import { DEFAULT_FAQ } from "../lib/store";
import {
  Eye, Phone, MessageSquare, Clock, ChevronDown,
  Users, HelpCircle, Gift, PlayCircle, FileDown, Sparkles, Pin, BellOff,
} from "lucide-react";
import WhatsApp from "./icons/WhatsApp";

// ============================================================================
// "המועמדים שלי" — מסך השגריר (מרכז קשר והכשרה) · סגנון בוטיק-יוקרה.
// רשימת המועמדים עדיין עם נתוני דמה (לוגיקת ההסלמה תחובר בשלב ב').
// ה-FAQ כבר דינמי — נשלף מלוח הבקרה (data.faq), עם נפילה חלקה לברירת מחדל.
// ============================================================================

const DEMO_TEAM = { partner: "שריה ניצן" };

const DEMO_ALERTS = [
  { id: "a1", name: "שמואל אהרון צחור", gender: "male", age: 22, phone: "052-463-0704", lastContact: 34, place: "ירושלים", work: "אברך, כולל 'תורת חיים'" },
  { id: "a2", name: "רבקה כהן",          gender: "female", age: 21, phone: "054-234-2558", lastContact: 31, place: "צפת", work: "גננת" },
  { id: "a3", name: "שמואל יוסף הולובר",  gender: "male", age: 22, phone: "053-511-4224", lastContact: 46, place: "יצהר", work: "סטודנט להנדסה" },
  { id: "a4", name: "מרים פרידמן",        gender: "female", age: 23, phone: "052-980-1123", lastContact: 38, place: "בית שמש", work: "מטפלת רגשית" },
];

const DEMO_GIFTS = [
  { id: "g1", title: "סרטוני הדרכה", sub: "איך לנהל שיחת שגריר", pdf: "מדריך השגריר.pdf" },
  { id: "g2", title: "כרטיסיות ותרגילים", sub: "כלים מעשיים להורדה", pdf: "כרטיסיית שאלות פתיחה.pdf" },
];

function waNum(phone) {
  const d = (phone || "").replace(/[^0-9]/g, "");
  return d.startsWith("972") ? d : d.startsWith("0") ? "972" + d.slice(1) : d;
}

export default function MyCandidatesPanel({ data }) {
  const [openNote, setOpenNote] = useState(null);
  const [notes, setNotes] = useState({});
  const [snoozed, setSnoozed] = useState({});
  const [peek, setPeek] = useState(null);
  const [faqOpen, setFaqOpen] = useState(null);
  const [flipped, setFlipped] = useState({});

  const active = DEMO_ALERTS.filter((c) => !snoozed[c.id]);
  // FAQ דינמי מלוח הבקרה; אם ריק — ברירת מחדל.
  const faqList = (data && Array.isArray(data.faq) && data.faq.length) ? data.faq : DEFAULT_FAQ;

  const CARD = "rounded-[26px] bg-white/85 shadow-[0_18px_42px_-18px_rgba(122,46,59,0.22)] ring-1 ring-rose/10 backdrop-blur-sm";

  return (
    <div className="space-y-5">
      {/* ===== באנר חלוקת עומס לצוות ===== */}
      <div className="rounded-[26px] border border-[#CBB089]/40 bg-gradient-to-bl from-[#FCF6EC] via-white to-blush/40 p-5 shadow-[0_18px_42px_-20px_rgba(176,141,87,0.4)]">
        <p className="flex items-center gap-2 text-base font-bold text-[#7a2e3b]">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#CBB089] to-[#B08D57]"><Users className="h-4 w-4 text-white" strokeWidth={2} /></span>
          עבודת צוות מנצחת
        </p>
        <p className="mt-2 text-sm leading-relaxed text-ink/70">
          חילקנו את רשימת המועמדים לתחזוקת קשר <span className="mark-gold font-semibold text-ink/90">שווה בשווה</span> בינך לבין {DEMO_TEAM.partner} — כך אף אחד לא נופל בין הכיסאות, ואתם מכסים יחד את כל הצוות.
        </p>
      </div>

      {/* ===== רשימת עבודה: התראות 30 יום ===== */}
      <div>
        <div className="mb-1 flex items-center justify-between px-1">
          <h2 className="text-xl font-bold text-[#7a2e3b]">טעון <span className="mark-gold">חידוש קשר</span></h2>
          <span className="rounded-full bg-gradient-to-br from-[#CBB089] to-[#B08D57] px-3 py-0.5 text-sm font-bold text-white shadow-sm">{active.length}</span>
        </div>
        <p className="px-1 text-xs text-ink/45">מועמדים שלא נוצר איתם קשר מעל 30 יום — כדאי מגע חם היום.</p>
      </div>

      <div className="space-y-3.5">
        {active.map((c) => {
          const digits = (c.phone || "").replace(/[^0-9]/g, "");
          const noteOpen = openNote === c.id;
          const hasReport = !!(notes[c.id] || "").trim();
          return (
            <div key={c.id} className={`overflow-hidden transition-all duration-300 hover:-translate-y-0.5 ${CARD}`}>
              {/* שורת מועמד */}
              <div className="flex items-center gap-3 p-4 pb-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[17px] font-bold text-ink">{c.name}</p>
                  <p className="mt-0.5 text-xs text-ink/50">{c.gender === "female" ? "בחורה" : "בחור"} · גיל {c.age} · {c.place}</p>
                  <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-[#FBF1EA] px-2 py-0.5 text-[11px] font-semibold text-[#A84F4F]"><Clock className="h-3 w-3" strokeWidth={2} /> אחרון: לפני {c.lastContact} יום</p>
                </div>
                <button onClick={() => setPeek(c)} title="הצצה לכרטיס" className="shrink-0 rounded-2xl bg-blush/60 p-2.5 text-roseDark shadow-sm transition hover:scale-105 hover:bg-blush active:scale-95">
                  <Eye className="h-5 w-5" strokeWidth={1.75} />
                </button>
              </div>

              {/* כפתורי קשר + נודניק */}
              <div className="flex flex-wrap items-center gap-2 px-4 pb-4">
                <a className="btn-soft !rounded-full !px-3.5 !py-1.5 text-xs" href={`tel:${digits}`}><Phone className="h-3.5 w-3.5" strokeWidth={1.75} /> חיוג</a>
                <a className="btn-soft !rounded-full !px-3.5 !py-1.5 text-xs" href={`sms:${digits}`}><MessageSquare className="h-3.5 w-3.5" strokeWidth={1.75} /> SMS</a>
                <a className="btn-soft !rounded-full !px-3.5 !py-1.5 text-xs" href={`https://wa.me/${waNum(c.phone)}`} target="_blank" rel="noreferrer"><WhatsApp size={14} className="text-green-600" /> וואטסאפ</a>
                <button onClick={() => setSnoozed((s) => ({ ...s, [c.id]: true }))} className="ms-auto flex items-center gap-1 rounded-full border border-[#CBB089]/50 bg-[#FCF6EC] px-3.5 py-1.5 text-xs font-semibold text-[#9b7a46] shadow-sm transition hover:bg-[#F6ECD9] active:scale-95">
                  <BellOff className="h-3.5 w-3.5" strokeWidth={1.75} /> נודניק
                </button>
              </div>

              {/* מניפת "מה התחדש" — אנימציה חלקה */}
              <button onClick={() => setOpenNote(noteOpen ? null : c.id)} className="flex w-full items-center justify-between border-t border-rose/10 bg-blush/25 px-4 py-2.5 text-right transition hover:bg-blush/40">
                <span className="flex items-center gap-1.5 text-sm font-semibold text-roseDark">
                  <Pin className="h-4 w-4" strokeWidth={1.75} /> מה התחדש?
                  {hasReport && <span className="rounded-full bg-gradient-to-br from-[#CBB089] to-[#B08D57] px-2 py-0.5 text-[10px] font-bold text-white">דווח ✓</span>}
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
                    <p className="flex items-center gap-1 text-[11px] text-ink/45">🔒 פרטי — גלוי רק לך ולצוות שלך. הזנת טקסט כאן נחשבת כ"דיווח".</p>
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

      {/* ===== מרכז הכשרה וקהילה ===== */}
      <div className="mt-7 border-t border-[#CBB089]/25 pt-6">
        <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-[#7a2e3b]">
          <Sparkles className="h-5 w-5 text-[#B08D57]" strokeWidth={1.75} /> מרכז <span className="mark-gold">הכשרה וקהילה</span>
        </h2>

        {/* קופסאות מתנה — Flip אלגנטי */}
        <div className="grid grid-cols-2 gap-4">
          {DEMO_GIFTS.map((g) => {
            const isFlipped = !!flipped[g.id];
            return (
              <div key={g.id} className="h-56 [perspective:1300px]" onClick={() => setFlipped((f) => ({ ...f, [g.id]: !f[g.id] }))}>
                <div className={`flip-3d relative h-full w-full cursor-pointer ${isFlipped ? "flipped" : ""}`}>
                  {/* חזית */}
                  <div className="flip-face absolute inset-0 flex flex-col items-center justify-center gap-2.5 rounded-[26px] p-4 text-center"
                    style={{ background: "linear-gradient(150deg,#FDF8F0,#F3E6D0)", border: "1px solid rgba(176,141,87,.38)", boxShadow: "0 20px 44px -18px rgba(176,141,87,.5)" }}>
                    <div className="flex h-16 w-16 items-center justify-center rounded-full shadow-md" style={{ background: "linear-gradient(135deg,#D9C29B,#B08D57)" }}>
                      <Gift className="h-8 w-8 text-white" strokeWidth={1.4} />
                    </div>
                    <p className="text-sm font-bold text-[#7a2e3b]">{g.title}</p>
                    <p className="text-[11px] text-ink/55">{g.sub}</p>
                    <span className="mt-1 rounded-full bg-white/70 px-3 py-0.5 text-[10px] font-semibold tracking-wide text-[#9b7a46]">לחצו לפתיחה ✦</span>
                  </div>
                  {/* גב */}
                  <div className="flip-face flip-back absolute inset-0 flex flex-col gap-2 rounded-[26px] bg-white p-3.5"
                    style={{ border: "1px solid rgba(176,141,87,.38)", boxShadow: "0 20px 44px -18px rgba(176,141,87,.5)" }}>
                    <div className="flex aspect-video items-center justify-center rounded-2xl bg-gradient-to-br from-[#2b2224] to-[#3a2e31] text-white/85">
                      <span className="flex items-center gap-1.5 text-xs"><PlayCircle className="h-6 w-6" strokeWidth={1.4} /> סרטון הדרכה</span>
                    </div>
                    <p className="text-[10px] text-ink/40">כאן יוטמע iframe של YouTube/Vimeo</p>
                    <button className="mt-auto flex items-center justify-center gap-1.5 rounded-full border border-[#B08D57]/45 bg-[#FCF6EC] py-2 text-xs font-semibold text-[#9b7a46] transition hover:bg-[#F6ECD9]">
                      <FileDown className="h-3.5 w-3.5" strokeWidth={1.75} /> {g.pdf}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* שאלות ותשובות — דינמי מלוח הבקרה */}
        <div className="mt-5 space-y-2.5">
          <p className="flex items-center gap-1.5 px-1 text-sm font-bold text-ink/70"><HelpCircle className="h-4 w-4 text-[#B08D57]" strokeWidth={1.75} /> שאלות ותשובות נפוצות</p>
          {faqList.map((f, i) => {
            const open = faqOpen === i;
            return (
              <div key={f.id || i} className={`overflow-hidden transition-all duration-300 ${CARD}`}>
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
            <div className="rounded-2xl bg-blush/40 p-3 text-sm text-ink/80">
              <p><b className="text-roseDark">עיסוק:</b> {peek.work}</p>
              <p className="mt-1"><b className="text-roseDark">קשר אחרון:</b> לפני {peek.lastContact} יום</p>
              <p className="mt-1"><b className="text-roseDark">טלפון:</b> <span dir="ltr">{peek.phone}</span></p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a className="btn-soft !rounded-full !px-3.5 !py-1.5 text-xs" href={`tel:${(peek.phone || "").replace(/[^0-9]/g, "")}`}><Phone className="h-3.5 w-3.5" strokeWidth={1.75} /> חיוג</a>
              <a className="btn-soft !rounded-full !px-3.5 !py-1.5 text-xs" href={`https://wa.me/${waNum(peek.phone)}`} target="_blank" rel="noreferrer"><WhatsApp size={14} className="text-green-600" /> וואטסאפ</a>
            </div>
            <p className="text-[11px] text-ink/40">* הצצה מהירה (נתוני דמה). בגרסה המלאה תיפתח כאן תצוגת הכרטיס המלאה של המועמד.</p>
          </div>
        </Modal>
      )}
    </div>
  );
}
