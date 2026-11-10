"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, Wand2, Copy, Check, MessageSquare, Trash2, Download, Pencil, ChevronDown, X } from "lucide-react";
import WhatsApp from "./icons/WhatsApp";
import {
  buildSheet, estimateAge, guessGender, buildMessage, waNumber, DEFAULT_TEMPLATES,
  parseGrade, parseHebrewYear, GRADE_LETTERS, hebrewYearLabel, currentHebrewYear,
} from "../lib/contactSheet";

// ============================================================================
// מחלץ אנשי קשר מדפי קשר — כלי עזר נפרד בלוח הבקרה (Add-on).
// מעלים צילומי "דף קשר" של כיתה → הטבלה נקראת בדפדפן עצמו (OCR) → רשימת עבודה
// עם גיל מוערך, הודעה מוכנה (זכר/נקבה/להורים) וכפתורי וואטסאפ / SMS / העתקה.
// פרטיות: התמונות והרשימה לא נשמרות במסד ולא יוצאות מהמכשיר. רק נוסחי ההודעות
// (בלי פרטים של אף אחד) נשמרים במכשיר הזה, לנוחות.
// ============================================================================

const TPL_KEY = "contact_extractor_templates_v1";
const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";
let seq = 0;
const uid = () => `c${Date.now().toString(36)}${(seq++).toString(36)}`;

function loadTemplates() {
  try { return { ...DEFAULT_TEMPLATES, ...(JSON.parse(localStorage.getItem(TPL_KEY) || "{}")) }; }
  catch (e) { return { ...DEFAULT_TEMPLATES }; }
}

async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; }
  catch (e) {
    const t = document.createElement("textarea"); t.value = text; document.body.appendChild(t); t.select();
    const ok = document.execCommand("copy"); t.remove(); return ok;
  }
}

function ContactCard({ c, institution, templates, onChange, onRemove }) {
  const [editOpen, setEditOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const link = `${origin}${BASE}/form/${c.gender === "male" ? "male" : "female"}/`;
  const tpl = c.to === "parent" ? templates.parent : templates[c.gender === "male" ? "male" : "female"];
  const auto = buildMessage(tpl, { name: c.first || c.last, institution, gender: c.gender, link });
  const message = c.custom ?? auto;
  const phones = [["mom", "אמא"], ["dad", "אבא"], ["home", "בית"]].filter(([k]) => c[k]);
  const target = c[c.phoneKey] ? c.phoneKey : (phones[0] || [])[0];
  const num = target ? c[target] : "";
  const enc = encodeURIComponent(message);
  const sent = () => onChange({ sent: true });

  return (
    <div className={`rounded-2xl bg-white/90 p-3.5 ring-1 ${c.sent ? "ring-emerald-300" : "ring-rose/10"}`}>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex gap-1.5">
            <input className="field-input !py-1.5 text-sm font-bold" value={c.first} onChange={(e) => onChange({ first: e.target.value })} placeholder="שם פרטי" aria-label="שם פרטי" />
            <input className="field-input !py-1.5 text-sm" value={c.last} onChange={(e) => onChange({ last: e.target.value })} placeholder="שם משפחה" aria-label="שם משפחה" />
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {c.age && <span className="rounded-full bg-[#F3E2DF] px-2 py-0.5 text-[11px] font-bold text-[#7a2e3b]">גיל משוער {c.age.low}–{c.age.high}</span>}
            {/* מתג מגדר */}
            <span className="inline-flex overflow-hidden rounded-full ring-1 ring-[#7a2e3b]/25 text-[11px] font-bold">
              {[["female", "נ"], ["male", "ז"]].map(([g, l]) => (
                <button key={g} type="button" onClick={() => onChange({ gender: g })}
                  className={`px-2.5 py-0.5 ${c.gender === g ? "bg-[#7a2e3b] text-[#FBF3E6]" : "bg-white text-[#7a2e3b]"}`}>{l}</button>
              ))}
            </span>
            {/* למי הפנייה */}
            <span className="inline-flex overflow-hidden rounded-full ring-1 ring-[#CBB089]/60 text-[11px] font-bold">
              {[["self", c.gender === "male" ? "אליו" : "אליה"], ["parent", "להורים"]].map(([k, l]) => (
                <button key={k} type="button" onClick={() => onChange({ to: k })}
                  className={`px-2.5 py-0.5 ${c.to === k ? "bg-[#a8865a] text-white" : "bg-white text-[#a8865a]"}`}>{l}</button>
              ))}
            </span>
            {c.sent && <span className="flex items-center gap-0.5 text-[11px] font-bold text-emerald-700"><Check className="h-3 w-3" strokeWidth={2.5} /> נשלח</span>}
          </div>
        </div>
        <button type="button" onClick={onRemove} className="rounded-lg p-1.5 text-ink/35 hover:bg-blush hover:text-roseDark" aria-label="הסרה מהרשימה"><Trash2 className="h-4 w-4" /></button>
      </div>

      {/* בחירת מספר — בדפי קשר המספרים הם בדרך כלל של ההורים */}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {phones.length === 0 && <span className="text-xs text-roseDark">לא זוהה מספר — אפשר להוסיף ידנית בעריכה.</span>}
        {phones.map(([k, l]) => (
          <button key={k} type="button" onClick={() => onChange({ phoneKey: k })}
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${target === k ? "bg-[#F3E2DF] text-[#7a2e3b] ring-1 ring-[#7a2e3b]/40" : "bg-[#FBF5F3] text-ink/55"}`}>
            {l} · <span dir="ltr">{c[k]}</span>
          </button>
        ))}
      </div>

      <div className="mt-2.5 flex flex-wrap gap-2">
        <a className={`btn-soft !rounded-full !px-3.5 !py-1.5 text-xs ${num ? "" : "pointer-events-none opacity-40"}`} href={num ? `https://wa.me/${waNumber(num)}?text=${enc}` : undefined} target="_blank" rel="noreferrer" onClick={sent}>
          <WhatsApp size={14} className="text-green-600" /> WhatsApp
        </a>
        <a className={`btn-soft !rounded-full !px-3.5 !py-1.5 text-xs ${num ? "" : "pointer-events-none opacity-40"}`} href={num ? `sms:${num.replace(/\D/g, "")}?&body=${enc}` : undefined} onClick={sent}>
          <MessageSquare className="h-3.5 w-3.5" strokeWidth={1.75} /> SMS
        </a>
        <button type="button" className="btn-soft !rounded-full !px-3.5 !py-1.5 text-xs" onClick={async () => { if (await copyText(message)) { setCopied(true); setTimeout(() => setCopied(false), 1500); } }}>
          {copied ? <Check className="h-3.5 w-3.5" strokeWidth={2.25} /> : <Copy className="h-3.5 w-3.5" strokeWidth={1.75} />} {copied ? "הועתק" : "העתק טקסט"}
        </button>
        <button type="button" className="ms-auto flex items-center gap-1 text-xs font-semibold text-[#7a2e3b]" onClick={() => setEditOpen((v) => !v)}>
          <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} /> עריכת ההודעה <ChevronDown className={`h-3.5 w-3.5 transition-transform ${editOpen ? "rotate-180" : ""}`} />
        </button>
      </div>

      {editOpen && (
        <div className="mt-2 space-y-1.5">
          <textarea className="field-input min-h-[150px] text-sm leading-relaxed" value={message} onChange={(e) => onChange({ custom: e.target.value })} />
          <div className="flex flex-wrap items-center gap-2">
            {c.custom != null && <button type="button" className="text-xs text-ink/55 underline" onClick={() => onChange({ custom: null })}>חזרה לנוסח האוטומטי</button>}
            <span className="text-[11px] text-ink/40">מספרים (ניתן לתקן):</span>
            {[["mom", "אמא"], ["dad", "אבא"], ["home", "בית"]].map(([k, l]) => (
              <input key={k} dir="ltr" className="field-input !w-32 !py-1 text-xs" value={c[k] || ""} onChange={(e) => onChange({ [k]: e.target.value })} placeholder={l} aria-label={`טלפון ${l}`} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ContactExtractor() {
  const [institution, setInstitution] = useState("");
  const [instType, setInstType] = useState("auto"); // auto | female | male
  const [files, setFiles] = useState([]);
  const [sheets, setSheets] = useState([]); // [{id, fileName, grade, year, contacts:[]}]
  const [busy, setBusy] = useState(null); // {i, n} בזמן עיבוד
  const [error, setError] = useState("");
  const [templates, setTemplates] = useState(DEFAULT_TEMPLATES);
  const [tplOpen, setTplOpen] = useState(false);
  const [hideSent, setHideSent] = useState(false);
  const inputRef = useRef(null);
  const nowYear = useMemo(() => currentHebrewYear(), []);

  useEffect(() => { setTemplates(loadTemplates()); }, []);
  const saveTemplate = (k, v) => {
    const next = { ...templates, [k]: v };
    setTemplates(next);
    try { localStorage.setItem(TPL_KEY, JSON.stringify(next)); } catch (e) {}
  };

  async function extract() {
    if (!files.length) return;
    setError("");
    const { readContactSheet } = await import("../lib/ocr");
    const out = [];
    for (let i = 0; i < files.length; i++) {
      setBusy({ i: i + 1, n: files.length });
      try {
        const { heb, eng } = await readContactSheet(files[i]);
        const { heading, rows } = buildSheet(heb, eng);
        const grade = heading?.grade || null, year = heading?.year || null;
        const age = estimateAge(grade, year, nowYear);
        out.push({
          id: uid(), fileName: files[i].name, grade, year,
          contacts: rows.map((r) => {
            const gender = instType === "auto" ? guessGender(r.first) : instType;
            return { id: uid(), ...r, gender, age, to: "self", phoneKey: r.mom ? "mom" : r.dad ? "dad" : "home", custom: null, sent: false };
          }),
        });
      } catch (e) {
        setError(e && e.message === "load-failed"
          ? "לא הצלחתי לטעון את מנוע זיהוי התמונות — בדקי חיבור לאינטרנט ונסי שוב."
          : `לא הצלחתי לקרוא את "${files[i].name}". נסי צילום חד וישר יותר.`);
      }
    }
    setSheets((s) => [...out, ...s]);
    setFiles([]);
    if (inputRef.current) inputRef.current.value = "";
    setBusy(null);
  }

  const updateContact = (sid, cid, patch) => setSheets((all) => all.map((s) => (s.id !== sid ? s : { ...s, contacts: s.contacts.map((c) => (c.id === cid ? { ...c, ...patch } : c)) })));
  const removeContact = (sid, cid) => setSheets((all) => all.map((s) => (s.id !== sid ? s : { ...s, contacts: s.contacts.filter((c) => c.id !== cid) })));
  // תיקון ידני של כיתה/שנה — מחשב מחדש את הגיל לכל הדף
  const updateSheet = (sid, patch) => setSheets((all) => all.map((s) => {
    if (s.id !== sid) return s;
    const n = { ...s, ...patch };
    const age = estimateAge(n.grade, n.year, nowYear);
    return { ...n, contacts: n.contacts.map((c) => ({ ...c, age })) };
  }));

  function exportCsv() {
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = [["מוסד", "כיתה", "שנה", "שם פרטי", "שם משפחה", "גיל משוער", "אמא", "אבא", "בית", "נשלח"].map(esc).join(",")];
    for (const s of sheets) for (const c of s.contacts) {
      lines.push([institution, GRADE_LETTERS[s.grade] || "", hebrewYearLabel(s.year), c.first, c.last, c.age ? `${c.age.low}-${c.age.high}` : "", c.mom, c.dad, c.home, c.sent ? "כן" : ""].map(esc).join(","));
    }
    const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `אנשי-קשר-${institution || "מוסד"}.csv`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  const total = sheets.reduce((n, s) => n + s.contacts.length, 0);
  const sentCount = sheets.reduce((n, s) => n + s.contacts.filter((c) => c.sent).length, 0);

  return (
    <div className="space-y-3">
      <p className="text-xs leading-relaxed text-ink/60">
        מעלים צילומי מסך של "דף קשר" כיתתי, והמערכת קוראת את הטבלה, מחשבת גיל משוער לפי הכותרת (למשל "כתה ח' תשפ"ב") ומכינה הודעה אישית לכל אחד.
        🔒 הזיהוי נעשה בתוך הטלפון/המחשב שלך — התמונות והרשימה לא נשמרות במערכת ולא נשלחות לשום מקום. רענון הדף מנקה את הרשימה (אפשר לשמור קובץ אקסל).
      </p>

      {/* קלט */}
      <div className="card space-y-2">
        <label className="field-label">שם המוסד</label>
        <input className="field-input" value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder='למשל: "יעלת"' />
        <label className="field-label">סוג המוסד</label>
        <select className="field-input text-sm" value={instType} onChange={(e) => setInstType(e.target.value)}>
          <option value="auto">מעורב — לזהות מגדר לפי השם</option>
          <option value="female">מוסד בנות</option>
          <option value="male">מוסד בנים</option>
        </select>
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => setFiles([...e.target.files])} />
        <button type="button" className="btn-soft w-full" onClick={() => inputRef.current?.click()}>
          <ImagePlus className="h-4 w-4" strokeWidth={1.75} /> {files.length ? `נבחרו ${files.length} תמונות` : "העלאת תמונות של דפי קשר"}
        </button>
        <button type="button" className="btn-primary w-full" disabled={!files.length || !!busy} onClick={extract}>
          <Wand2 className="h-4 w-4" strokeWidth={1.75} />
          {busy ? `קורא את התמונה ${busy.i} מתוך ${busy.n}… (בפעם הראשונה לוקח כחצי דקה)` : "חילוץ אנשי הקשר"}
        </button>
        {!institution.trim() && files.length > 0 && <p className="text-xs text-amber-700">כדאי למלא את שם המוסד — הוא נכנס להודעה.</p>}
        {error && <p className="rounded-2xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}
      </div>

      {/* נוסחי ההודעה */}
      <div className="card">
        <button type="button" className="flex w-full items-center justify-between text-sm font-bold text-roseDark" onClick={() => setTplOpen((v) => !v)}>
          נוסחי ההודעה (נשמרים במכשיר הזה) <ChevronDown className={`h-4 w-4 transition-transform ${tplOpen ? "rotate-180" : ""}`} />
        </button>
        {tplOpen && (
          <div className="mt-2 space-y-2">
            <p className="text-[11px] text-ink/50">אפשר להשתמש ב: {"{שם}"} · {"{מוסד}"} · {"{קישור}"} (קישור ההרשמה המתאים) · {"{שלמד}"} (שלמד/שלמדה, בנוסח להורים)</p>
            {[["female", "פנייה לבחורה"], ["male", "פנייה לבחור"], ["parent", "פנייה להורים"]].map(([k, l]) => (
              <div key={k}>
                <label className="field-label">{l}</label>
                <textarea className="field-input min-h-[120px] text-sm" value={templates[k]} onChange={(e) => saveTemplate(k, e.target.value)} />
              </div>
            ))}
            <button type="button" className="text-xs text-ink/55 underline" onClick={() => { setTemplates(DEFAULT_TEMPLATES); try { localStorage.removeItem(TPL_KEY); } catch (e) {} }}>חזרה לנוסחים המקוריים</button>
          </div>
        )}
      </div>

      {/* רשימת העבודה */}
      {total > 0 && (
        <div className="flex flex-wrap items-center gap-2 px-1">
          <span className="text-sm font-bold text-roseDark">{total} אנשי קשר · נשלחו {sentCount}</span>
          <label className="flex items-center gap-1 text-xs text-ink/60"><input type="checkbox" checked={hideSent} onChange={(e) => setHideSent(e.target.checked)} /> הסתרת מי שנשלח</label>
          <button type="button" className="btn-soft ms-auto !px-3 !py-1.5 text-xs" onClick={exportCsv}><Download className="h-3.5 w-3.5" strokeWidth={1.75} /> שמירה לאקסל</button>
          <button type="button" className="btn-soft !px-3 !py-1.5 text-xs text-roseDark" onClick={() => { if (confirm("לנקות את כל הרשימה?")) setSheets([]); }}><X className="h-3.5 w-3.5" strokeWidth={2} /> ניקוי</button>
        </div>
      )}

      {sheets.map((s) => (
        <div key={s.id} className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-[#F3E2DF] px-3 py-2">
            <span className="text-sm font-bold text-[#7a2e3b]">כיתה</span>
            <select className="field-input !w-auto !py-1 text-sm" value={GRADE_LETTERS[s.grade] || ""} onChange={(e) => updateSheet(s.id, { grade: parseGrade(e.target.value) })}>
              <option value="">?</option>
              {GRADE_LETTERS.slice(1).map((g) => <option key={g} value={g}>{g}'</option>)}
            </select>
            <span className="text-sm font-bold text-[#7a2e3b]">שנה</span>
            <select className="field-input !w-auto !py-1 text-sm" value={s.year || ""} onChange={(e) => updateSheet(s.id, { year: Number(e.target.value) || null })}>
              <option value="">?</option>
              {Array.from({ length: 25 }, (_, i) => nowYear - i).map((y) => <option key={y} value={y}>{hebrewYearLabel(y)}</option>)}
            </select>
            <span className="text-xs text-ink/55">{s.contacts.length} שורות{!s.grade || !s.year ? " · לא זוהתה כותרת — בחרי כיתה ושנה לחישוב הגיל" : ""}</span>
          </div>
          {s.contacts.length === 0 && <p className="px-1 text-xs text-roseDark">לא נמצאו שורות בטבלה בתמונה הזו ({s.fileName}). נסי צילום מסך ישר וחד של הדף.</p>}
          {s.contacts.filter((c) => !hideSent || !c.sent).map((c) => (
            <ContactCard key={c.id} c={c} institution={institution.trim()} templates={templates}
              onChange={(p) => updateContact(s.id, c.id, p)} onRemove={() => removeContact(s.id, c.id)} />
          ))}
        </div>
      ))}
      {total > 0 && <p className="px-1 text-[11px] text-ink/45">💡 הזיהוי האוטומטי לא מושלם — שווה להעיף מבט על השם והמספר לפני כל שליחה. כל שדה ניתן לתיקון.</p>}
    </div>
  );
}
