"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { UploadCloud, Sparkles, Trash2, Send, RefreshCcw, ImageIcon, X, CheckCircle2, AlertCircle } from "lucide-react";
import AppShell, { PageTitle } from "@/components/AppShell";
import { useAuth } from "@/context/AuthContext";
import { fileToTiles } from "@/lib/imageTiles";
import {
  currentHebrewYear, estimateAge, parseGrade, parseHebrewYear, normalizePhone,
  GRADE_LETTERS, hebrewYearLabel,
} from "@/lib/hebrewYear";
import { normKey, assigneesFor } from "@/lib/territory";
import { loadStaff, saveFamilies, resyncAll } from "@/lib/familiesStore";

const ERRORS = {
  "ai-not-configured": "מנוע ה-AI עוד לא חובר. חסר המפתח ANTHROPIC_API_KEY בהגדרות Vercel.",
  "not-allowed": "רק הנהלה יכולה להפעיל את החילוץ. נסי לצאת ולהיכנס מחדש.",
  busy: "מנוע ה-AI עמוס כרגע. נסי שוב בעוד דקה.",
  refused: "מנוע ה-AI לא הסכים לקרוא את התמונה הזו.",
  unreadable: "התמונה לא נקראה. נסי צילום חד וישר יותר.",
};

let seq = 0;
const uid = () => `r${Date.now().toString(36)}${(seq++).toString(36)}`;

async function runPool(items, limit, worker) {
  let i = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      await worker(items[idx], idx);
    }
  });
  await Promise.all(runners);
}

// איחוד שורות שחזרו מכמה אריחים (בגלל החפיפה) — לפי שם וטלפון
function mergeRows(rows) {
  const out = [];
  const byKey = new Map();
  for (const r of rows) {
    const phones = Array.from(new Set((r.phones || []).map(normalizePhone).filter(Boolean)));
    if (!r.lastName && !r.firstName) continue;
    if (!phones.length && !r.lastName) continue;
    const name = `${normKey(r.lastName)}|${normKey(r.firstName)}`;
    const hit = byKey.get(name) || phones.map((p) => byKey.get(`p:${p}`)).find(Boolean);
    if (hit) {
      hit.phones = Array.from(new Set([...hit.phones, ...phones]));
      if (!hit.street && r.street) hit.street = r.street;
      phones.forEach((p) => byKey.set(`p:${p}`, hit));
      continue;
    }
    const row = { id: uid(), lastName: (r.lastName || "").trim(), firstName: (r.firstName || "").trim(), phones, street: (r.street || "").trim() };
    out.push(row);
    byKey.set(name, row);
    phones.forEach((p) => byKey.set(`p:${p}`, row));
  }
  return out;
}

export default function ExtractPage() {
  return (
    <AppShell roles={["admin"]}>
      <Extractor />
    </AppShell>
  );
}

function Extractor() {
  const { user } = useAuth();
  const nowYear = useMemo(() => currentHebrewYear(), []);
  const inputRef = useRef(null);
  const [source, setSource] = useState("");
  const [files, setFiles] = useState([]);
  const [sheets, setSheets] = useState([]); // {id, fileName, grade, year, rows}
  const [progress, setProgress] = useState(null); // {done, total}
  const [error, setError] = useState("");
  const [staff, setStaff] = useState([]);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    loadStaff().then(setStaff).catch(console.error);
  }, []);

  const staffName = (id) => (staff.find((s) => s.id === id)?.name || "").split(" ")[0] || "צוות";

  async function extract() {
    setError("");
    setResult(null);
    const token = await user.getIdToken();
    const prepared = [];
    for (const f of files) {
      try {
        prepared.push({ file: f, tiles: await fileToTiles(f) });
      } catch {
        setError(`לא הצלחתי לפתוח את "${f.name}".`);
      }
    }
    const jobs = prepared.flatMap((p, fi) => p.tiles.map((t) => ({ fi, t })));
    const raw = prepared.map(() => ({ rows: [], grade: null, year: null }));
    setProgress({ done: 0, total: jobs.length });
    let fatal = "";

    await runPool(jobs, 3, async ({ fi, t }) => {
      if (fatal) return;
      try {
        const res = await fetch("/api/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ data: t.data, mediaType: t.mediaType }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          const msg = ERRORS[json.error] || "קריאת חלק מהתמונה נכשלה.";
          if (["ai-not-configured", "not-allowed"].includes(json.error)) fatal = msg;
          else setError(msg);
          return;
        }
        raw[fi].rows.push(...(json.rows || []));
        const g = parseGrade(json.heading?.classGrade);
        const y = parseHebrewYear(json.heading?.hebrewYear);
        if (g && !raw[fi].grade) raw[fi].grade = g;
        if (y && !raw[fi].year) raw[fi].year = y;
      } catch {
        setError("אין חיבור לשרת. בדקי אינטרנט ונסי שוב.");
      } finally {
        setProgress((p) => (p ? { ...p, done: p.done + 1 } : p));
      }
    });

    if (fatal) setError(fatal);
    const next = prepared.map((p, i) => ({
      id: uid(),
      fileName: p.file.name,
      grade: raw[i].grade,
      year: raw[i].year,
      rows: mergeRows(raw[i].rows),
    }));
    setSheets((s) => [...next, ...s]);
    setFiles([]);
    if (inputRef.current) inputRef.current.value = "";
    setProgress(null);
  }

  const updateSheet = (sid, patch) => setSheets((all) => all.map((s) => (s.id === sid ? { ...s, ...patch } : s)));
  const updateRow = (sid, rid, patch) =>
    setSheets((all) => all.map((s) => (s.id !== sid ? s : { ...s, rows: s.rows.map((r) => (r.id === rid ? { ...r, ...patch } : r)) })));
  const removeRow = (sid, rid) => setSheets((all) => all.map((s) => (s.id !== sid ? s : { ...s, rows: s.rows.filter((r) => r.id !== rid) })));

  const allRows = sheets.flatMap((s) => {
    const age = estimateAge(s.grade, s.year, nowYear);
    return s.rows.map((r) => ({ ...r, age, grade: s.grade, year: s.year }));
  });
  const assignedCount = allRows.filter((r) => assigneesFor(r, staff).length).length;

  async function saveAll() {
    setSaving(true);
    setError("");
    try {
      const res = await saveFamilies(allRows, { source: source.trim() });
      setResult(res);
      setSheets([]);
    } catch (e) {
      console.error(e);
      setError("השמירה נכשלה. בדקי חיבור ונסי שוב. הרשימה לא נמחקה.");
    } finally {
      setSaving(false);
    }
  }

  async function resync() {
    setSaving(true);
    try {
      setStaff(await loadStaff());
      const r = await resyncAll();
      setResult({ resync: true, ...r });
    } catch (e) {
      console.error(e);
      setError("השיגור מחדש נכשל.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageTitle eyebrow="AI Vision · הנהלה" title="חילוץ משפחות חכם">
        מעלים צילומי מסך של דפי קשר. ה-AI קורא רק את הרשימה השמית ומתעלם מפרסומות, מוסדות ומספרים זעירים. הוא מזהה את שנתון הכיתה, מחשב גיל עדכני ומשגר כל משפחה לאשת הצוות שאחראית עליה.
      </PageTitle>

      <motion.section initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.8 }} className="card">
        <div className="grid gap-5 md:grid-cols-[1fr_1.2fr]">
          <div>
            <label className="label">שם המקור</label>
            <input className="field" value={source} onChange={(e) => setSource(e.target.value)} placeholder='למשל: אלפון יצהר, או כיתה ח" יעלת' />
            <p className="mt-2 text-xs leading-relaxed text-ink-soft/70">
              השנה הנוכחית: {hebrewYearLabel(nowYear)}. הגיל מחושב לפי כותרת הכיתה והשנתון שבדף.
            </p>
          </div>
          <div>
            <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => setFiles([...e.target.files])} />
            <motion.button
              type="button"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => inputRef.current?.click()}
              className="flex h-full min-h-[140px] w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gold/50 bg-white/60 p-5 text-ink-soft transition hover:border-gold hover:bg-white"
            >
              <UploadCloud size={30} strokeWidth={1.4} className="text-gold-dark" />
              {files.length ? <span className="font-medium text-bordeaux">נבחרו {files.length} צילומים</span> : <span>בחירת צילומי מסך של דפי קשר</span>}
              {files.length > 0 && (
                <span className="flex flex-wrap justify-center gap-1">
                  {files.map((f) => (
                    <span key={f.name} className="chip"><ImageIcon size={11} /> {f.name.slice(0, 22)}</span>
                  ))}
                </span>
              )}
            </motion.button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" className="btn-luxe flex-1" disabled={!files.length || !!progress} onClick={extract}>
            <Sparkles size={18} strokeWidth={1.7} />
            {progress ? `קורא… ${progress.done} מתוך ${progress.total} חלקים` : "חילוץ המשפחות"}
          </button>
          <button type="button" className="btn-ghost !px-5" disabled={saving} onClick={resync} title="מחשב מחדש את השיוך של כל המאגר מול הטריטוריות העדכניות">
            <RefreshCcw size={15} /> שיגור מחדש לכל המאגר
          </button>
        </div>

        <AnimatePresence>
          {progress && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-4 h-1.5 overflow-hidden rounded-full bg-sand">
              <motion.div
                className="h-full rounded-full bg-gradient-to-l from-gold to-bordeaux"
                animate={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}
                transition={{ ease: "easeOut" }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <p className="mt-4 flex items-center gap-2 rounded-2xl bg-rose/10 px-4 py-3 text-sm text-rose-dark">
            <AlertCircle size={16} /> {error}
          </p>
        )}
        <AnimatePresence>
          {result && (
            <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4 flex items-center gap-2 rounded-2xl bg-white/80 px-4 py-3 text-sm text-bordeaux">
              <CheckCircle2 size={16} className="text-[#1f8f5f]" />
              {result.resync
                ? `השיגור הושלם: ${result.changed} מתוך ${result.total} משפחות עודכנו.`
                : `${result.total} משפחות נשמרו במאגר, ${result.assigned} מהן שוגרו ישירות לצוות.`}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.section>

      {allRows.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass sticky top-24 z-30 mt-8 flex flex-wrap items-center gap-3 rounded-full px-5 py-3">
          <span className="font-display text-lg font-bold text-bordeaux">{allRows.length} משפחות לבדיקה</span>
          <span className="chip">{assignedCount} ישוגרו לצוות</span>
          <span className="chip">{allRows.length - assignedCount} ללא שיוך</span>
          <button type="button" className="btn-solid ms-auto" disabled={saving} onClick={saveAll}>
            <Send size={15} /> {saving ? "שומרת…" : "שמירה ושיגור"}
          </button>
        </motion.div>
      )}

      <div className="mt-6 space-y-8">
        {sheets.map((s, si) => {
          const age = estimateAge(s.grade, s.year, nowYear);
          return (
            <motion.section key={s.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: si * 0.08, duration: 0.7 }} className="card">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <h2 className="font-display text-2xl font-bold text-bordeaux">{s.fileName}</h2>
                <span className="chip">{s.rows.length} שורות</span>
                <div className="ms-auto flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-ink-soft">כיתה</span>
                  <select className="field !w-auto !py-1.5" value={GRADE_LETTERS[s.grade] || ""} onChange={(e) => updateSheet(s.id, { grade: parseGrade(e.target.value) })}>
                    <option value="">לא ידוע</option>
                    {GRADE_LETTERS.slice(1).map((g) => (
                      <option key={g} value={g}>{g}&apos;</option>
                    ))}
                  </select>
                  <span className="text-ink-soft">שנתון</span>
                  <select className="field !w-auto !py-1.5" value={s.year || ""} onChange={(e) => updateSheet(s.id, { year: Number(e.target.value) || null })}>
                    <option value="">לא ידוע</option>
                    {Array.from({ length: 30 }, (_, i) => nowYear - i).map((y) => (
                      <option key={y} value={y}>{hebrewYearLabel(y)}</option>
                    ))}
                  </select>
                  {age && <span className="rounded-full bg-gradient-to-l from-gold to-gold-dark px-3 py-1 text-xs font-medium text-white">גיל <span dir="ltr">{age.low}–{age.high}</span></span>}
                </div>
              </div>
              {!s.grade || !s.year ? (
                <p className="mb-3 text-xs text-ink-soft/70">לא זוהו כיתה ושנתון בכותרת. אפשר לבחור ידנית כדי לחשב גיל, או להשאיר ללא גיל.</p>
              ) : null}
              {s.rows.length === 0 && <p className="text-sm text-rose-dark">לא נמצאה רשימה שמית בתמונה הזו.</p>}

              <div className="divide-y divide-gold/15 overflow-hidden rounded-2xl bg-white/60">
                <AnimatePresence>
                  {s.rows.map((r) => {
                    const who = assigneesFor(r, staff);
                    return (
                      <motion.div key={r.id} layout exit={{ opacity: 0, height: 0 }} className="grid grid-cols-2 items-center gap-2 px-3 py-2.5 md:grid-cols-[1fr_1fr_1.4fr_1fr_auto_auto]">
                        <input className="field !py-1.5 !text-sm font-medium" value={r.lastName} placeholder="משפחה" onChange={(e) => updateRow(s.id, r.id, { lastName: e.target.value })} />
                        <input className="field !py-1.5 !text-sm" value={r.firstName} placeholder="שם פרטי" onChange={(e) => updateRow(s.id, r.id, { firstName: e.target.value })} />
                        <input
                          dir="ltr"
                          className="field !py-1.5 !text-sm"
                          value={r.phones.join(", ")}
                          placeholder="טלפונים"
                          onChange={(e) => updateRow(s.id, r.id, { phones: e.target.value.split(/[,\s]+/).filter(Boolean) })}
                        />
                        <input className="field !py-1.5 !text-sm" value={r.street} placeholder="רחוב" onChange={(e) => updateRow(s.id, r.id, { street: e.target.value })} />
                        <span className={`chip justify-center ${who.length ? "!bg-gold-light/60 !text-bordeaux" : ""}`}>
                          {who.length ? who.map(staffName).join(", ") : "ללא שיוך"}
                        </span>
                        <button type="button" aria-label="הסרה" onClick={() => removeRow(s.id, r.id)} className="justify-self-end rounded-full p-2 text-ink-soft/60 transition hover:bg-rose/10 hover:text-rose-dark">
                          <Trash2 size={16} />
                        </button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
              <button type="button" className="mt-3 flex items-center gap-1 text-xs text-ink-soft hover:text-rose-dark" onClick={() => setSheets((all) => all.filter((x) => x.id !== s.id))}>
                <X size={13} /> הסרת הדף כולו מהרשימה
              </button>
            </motion.section>
          );
        })}
      </div>
    </>
  );
}
