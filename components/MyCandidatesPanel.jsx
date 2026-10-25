"use client";

import { useEffect, useState } from "react";
import Modal from "./Modal";
import { DEFAULT_FAQ, DEFAULT_REFLECTION_FORM, saveReflection, monthKey, teamMembers, teamRepIds } from "../lib/store";
import {
  Eye, Phone, MessageSquare, Clock, ChevronDown,
  Users, PlayCircle, FileDown, BellOff, NotebookPen, Check, UserRound, Sparkles,
} from "lucide-react";
import WhatsApp from "./icons/WhatsApp";

// ============================================================================
// "המועמדים שלי" — מסך השגריר, בשני אזורים:
//   א. "המועמדים שלי" — רשימת המועמדים האמיתית שבטיפול השגריר/הצוות (קריאה בלבד).
//   ב. "אני כשגריר"  — מרכז הכשרה (קופסאות מתנה), "איך עבר החודש?" ושאלות ותשובות.
// התראות 30 יום ותיעוד "נודניק" במסד יחוברו בשלב ב' — כרגע "נודניק" מקומי בלבד.
// ============================================================================

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";
// נייר העטיפה של קופסאות המתנה. להחלפת התבנית — מחליפים את הקובץ
// public/assets/harlequin-pink.jpg (באותו שם), בלי לגעת בקוד.
const WRAP_URL = `${BASE}/assets/harlequin-pink.jpg`;

const WINE = "#6d2433";

// תמונת הסרט (סאטן) שמונחת על נייר המעוינים. להחלפה — מחליפים את הקובץ
// public/assets/gift-ribbon.png (PNG שקוף, באותו שם), בלי לגעת בקוד.
const RIBBON_URL = `${BASE}/assets/gift-ribbon.png`;
const PAGE = 15;
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

// ---------- קופסת מתנה — "חלון ראווה" ----------
function GiftBox({ gift, flipped, onToggle }) {
  return (
    <div className="h-[330px] [perspective:1400px]">
      <div className={`flip-3d relative h-full w-full ${flipped ? "flipped" : ""}`}>
        {/* חזית: נייר מעוינים + סרט סאטן (תמונה) + תווית מתנה עדינה */}
        <button type="button" onClick={onToggle} aria-label={`פתיחת המתנה: ${gift.label}`}
          className="flip-face absolute inset-0 overflow-hidden rounded-[30px] shadow-[0_20px_44px_-22px_rgba(122,46,59,0.45)] ring-1 ring-[#CBB089]/30"
          style={{ backgroundImage: `url(${WRAP_URL})`, backgroundSize: "130px auto", backgroundPosition: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={RIBBON_URL} alt="" aria-hidden="true" loading="lazy" decoding="async"
            className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover object-[center_35%]" />
          <span className="absolute inset-x-0 bottom-5 flex justify-center px-6">
            <span className="rounded-xl border border-[#CBB089]/70 bg-[#FFFBF6]/95 px-4 py-2 text-center shadow-[0_6px_18px_-10px_rgba(122,46,59,0.35)] backdrop-blur-sm">
              <span className="block text-[13.5px] font-bold leading-snug text-[#7a2e3b]">{gift.label}</span>
              <span className="mt-0.5 block text-[10.5px] tracking-wide text-[#a8865a]">{gift.sub} · לחצו לפתיחה</span>
            </span>
          </span>
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
  const [section, setSection] = useState("cands"); // cands | me
  const [snoozed, setSnoozed] = useState({});
  const [peek, setPeek] = useState(null);
  const [faqOpen, setFaqOpen] = useState(null);
  const [flipped, setFlipped] = useState({});
  const [reflecting, setReflecting] = useState(false);
  const [shown, setShown] = useState(PAGE);

  const reps = data?.reps || [];
  const isAdmin = user?.role === "admin";
  // באנר צוות — רק כשלשגריר המחובר יש באמת שותפים לצוות (agency_name משותף)
  const myRep = reps.find((r) => r.id === user?.repId);
  const partners = myRep ? teamMembers(myRep, reps).filter((r) => r.id !== myRep.id) : [];
  const faqList = (data && Array.isArray(data.faq) && data.faq.length) ? data.faq : DEFAULT_FAQ;
  const month = monthKey();
  const myReflection = user?.repId ? (data?.reflections || []).find((r) => r.id === `${user.repId}_${month}`) : null;

  // המועמדים שבטיפולי — אותם כללים כמו בלשונית המועמדים: משויכים אליי או לצוות שלי,
  // או לנציג/ה שאני מכסה; מועמד שהוסתר ממני נקודתית לא מופיע. מנהלת רואה את כולם.
  const myTeamIds = teamRepIds(user?.repId, reps);
  const mine = (c) => {
    if (isAdmin) return true;
    if (!user?.repId || (c.hiddenFrom || []).includes(user.repId)) return false;
    if (myTeamIds.has(c.assignedRep)) return true;
    const owner = reps.find((r) => r.id === c.assignedRep);
    return !!(owner && (owner.coveredBy || []).includes(user.repId));
  };
  const statusOf = (c) => ((data?.candidateStatus || []).find((s) => s.id === c.id) || {}).availabilityStatus || "";
  const daysSince = (iso) => (iso ? Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)) : null);
  const myCands = (data?.candidates || []).filter(mine)
    .sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));
  const active = myCands.filter((c) => !snoozed[c.id]);
  const resting = myCands.filter((c) => snoozed[c.id]);

  const CARD = "rounded-[26px] bg-white/90 shadow-[0_18px_42px_-18px_rgba(122,46,59,0.22)] ring-1 ring-rose/10";

  const candRow = (c) => {
    const digits = (c.phone || "").replace(/[^0-9]/g, "");
    const days = daysSince(c.createdAt);
    const st = statusOf(c);
    const isSnoozed = !!snoozed[c.id];
    return (
      <div key={c.id} className={`overflow-hidden ${CARD} ${isSnoozed ? "opacity-60" : ""}`}>
        <div className="flex items-center gap-3 p-4 pb-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[17px] font-bold text-ink">{c.fullName}</p>
            <p className="mt-0.5 text-xs text-ink/50">{[c.gender === "female" ? "בחורה" : "בחור", c.age && `גיל ${c.age}`, c.location].filter(Boolean).join(" · ")}</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {days !== null && <span className="inline-flex items-center gap-1 rounded-full bg-[#F3E2DF] px-2 py-0.5 text-[11px] font-semibold text-[#7a2e3b]"><Clock className="h-3 w-3" strokeWidth={2} /> במאגר {days} ימים</span>}
              {st && <span className="rounded-full bg-[#FBF3E6] px-2 py-0.5 text-[11px] font-semibold text-[#a8865a] ring-1 ring-[#CBB089]/40">{st}</span>}
            </div>
          </div>
          <button onClick={() => setPeek(c)} title="הצצה לכרטיס" className="shrink-0 rounded-2xl bg-[#F3E2DF] p-2.5 text-[#7a2e3b] transition hover:scale-105 active:scale-95">
            <Eye className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2 px-4 pb-4">
          {digits && <>
            <a className="btn-soft !rounded-full !px-3.5 !py-1.5 text-xs" href={`tel:${digits}`}><Phone className="h-3.5 w-3.5" strokeWidth={1.75} /> חיוג</a>
            <a className="btn-soft !rounded-full !px-3.5 !py-1.5 text-xs" href={`sms:${digits}`}><MessageSquare className="h-3.5 w-3.5" strokeWidth={1.75} /> SMS</a>
            <a className="btn-soft !rounded-full !px-3.5 !py-1.5 text-xs" href={`https://wa.me/${waNum(c.phone)}`} target="_blank" rel="noreferrer"><WhatsApp size={14} className="text-green-600" /> וואטסאפ</a>
          </>}
          <button onClick={() => setSnoozed((s) => ({ ...s, [c.id]: !s[c.id] }))} className="ms-auto flex items-center gap-1 rounded-full border border-[#7a2e3b]/20 bg-white px-3.5 py-1.5 text-xs font-semibold text-[#7a2e3b] transition hover:bg-[#F3E2DF] active:scale-95">
            <BellOff className="h-3.5 w-3.5" strokeWidth={1.75} /> {isSnoozed ? "החזרה לרשימה" : "נודניק"}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* ===== בורר אזורים ===== */}
      <div className="sticky top-[4.25rem] z-10 mx-auto flex max-w-sm rounded-full bg-white/85 p-1 shadow-[0_10px_26px_-14px_rgba(122,46,59,0.4)] ring-1 ring-[#CBB089]/35 backdrop-blur" role="tablist">
        {[["cands", "המועמדים שלי", UserRound], ["me", "אני כשגריר", Sparkles]].map(([id, label, Icon]) => (
          <button key={id} type="button" role="tab" aria-selected={section === id}
            onClick={() => { setSection(id); window.scrollTo(0, 0); }}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2.5 text-sm font-bold transition ${section === id ? "bg-[#7a2e3b] text-[#FBF3E6] shadow" : "text-[#7a2e3b]/70"}`}>
            <Icon className="h-4 w-4" strokeWidth={1.75} /> {label}
          </button>
        ))}
      </div>

      {section === "cands" && (<>
        {/* באנר צוות */}
        {partners.length > 0 && <div className="rounded-[26px] bg-[#F3E2DF] p-5">
          <p className="flex items-center gap-2 text-base font-bold text-[#7a2e3b]"><Users className="h-5 w-5" strokeWidth={1.75} /> עבודת צוות מנצחת</p>
          <p className="mt-1.5 text-sm leading-relaxed text-ink/70">
            הרשימה משותפת לך ול{partners.map((r) => r.name).join(" ול")} — כך אף אחד לא נופל בין הכיסאות.
          </p>
        </div>}

        <div className="px-1">
          <div className="flex items-center justify-between">
            <SkewTitle>{isAdmin ? "כל המועמדים" : "המועמדים שבטיפולי"}</SkewTitle>
            <span className="rounded-full bg-[#7a2e3b] px-3 py-0.5 text-sm font-bold text-[#FBF3E6]">{active.length}</span>
          </div>
          <p className="mt-1 text-xs text-ink/45">מגע חם קטן עושה הבדל גדול. העין מציגה סטטוס ופרטים, "נודניק" מעביר לסוף הרשימה.</p>
        </div>

        <div className="space-y-3.5">
          {active.slice(0, shown).map(candRow)}
          {active.length > shown && (
            <button className="btn-soft w-full" onClick={() => setShown((n) => n + PAGE)}>הצגת עוד ({active.length - shown})</button>
          )}
          {active.length === 0 && (
            <div className={`p-7 text-center text-sm text-ink/55 ${CARD}`}>{myCands.length ? "🎉 כל הכבוד! כולם בנודניק כרגע." : "עדיין אין מועמדים משויכים אליך."}</div>
          )}
          {resting.length > 0 && (<>
            <p className="px-1 pt-2 text-xs font-semibold text-ink/45">בנודניק ({resting.length})</p>
            {resting.map(candRow)}
          </>)}
        </div>
      </>)}

      {section === "me" && (<>
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

      {/* ===== מרכז הכשרה וקהילה — חלון ראווה ===== */}
      <div className="space-y-4 pt-2">
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
      </>)}

      {/* ===== הצצה מהירה (עין) ===== */}
      {peek && (
        <Modal title="הצצה מהירה" onClose={() => setPeek(null)}>
          <div className="space-y-3">
            <div>
              <p className="text-xl font-bold text-ink">{peek.fullName}</p>
              <p className="text-sm text-ink/55">{[peek.gender === "female" ? "בחורה" : "בחור", peek.age && `גיל ${peek.age}`, peek.location].filter(Boolean).join(" · ")}</p>
            </div>
            <div className="space-y-1 rounded-2xl bg-[#F3E2DF] p-3 text-sm text-ink/80">
              <p><b className="text-[#7a2e3b]">סטטוס:</b> {statusOf(peek) || "לא עודכן"}</p>
              {peek.work && <p><b className="text-[#7a2e3b]">עיסוק:</b> {peek.work}</p>}
              {peek.community && <p><b className="text-[#7a2e3b]">קהילה:</b> {peek.community}</p>}
              {peek.createdAt && <p><b className="text-[#7a2e3b]">במאגר:</b> {daysSince(peek.createdAt)} ימים</p>}
              {peek.phone && <p><b className="text-[#7a2e3b]">טלפון:</b> <span dir="ltr">{peek.phone}</span></p>}
            </div>
            <div className="flex flex-wrap gap-2">
              <a className="btn-soft !rounded-full !px-3.5 !py-1.5 text-xs" href={`tel:${(peek.phone || "").replace(/[^0-9]/g, "")}`}><Phone className="h-3.5 w-3.5" strokeWidth={1.75} /> חיוג</a>
              <a className="btn-soft !rounded-full !px-3.5 !py-1.5 text-xs" href={`https://wa.me/${waNum(peek.phone)}`} target="_blank" rel="noreferrer"><WhatsApp size={14} className="text-green-600" /> וואטסאפ</a>
            </div>
            <p className="text-[11px] text-ink/40">לכרטיס המלא — לשונית "מועמדים".</p>
          </div>
        </Modal>
      )}

      {reflecting && <ReflectionModal user={user} data={data} onClose={() => setReflecting(false)} />}
    </div>
  );
}
