"use client";

import { useState } from "react";
import Modal from "./Modal";
import { compressImage } from "../lib/image";
import { classifyHeader, PARSE_FIELD_NAMES } from "../lib/parse";
import { addCandidate, updateCandidate } from "../lib/store";

// שדות מערכת שניתן למפות אליהם עמודה מהגיליון.
const MAP_FIELDS = ["fullName", "location", "age", "birthDate", "height", "community", "work", "degree", "parentsWork", "phone"];

// ----- עזרי CSV / Google Sheets -----
function toCsvUrls(input) {
  const s = (input || "").trim();
  if (/output=csv/.test(s)) return [s];
  const idM = s.match(/\/spreadsheets\/d\/(?:e\/)?([a-zA-Z0-9-_]+)/);
  const gidM = s.match(/[#&?]gid=([0-9]+)/);
  const gid = gidM ? gidM[1] : "0";
  if (!idM) return [s];
  const id = idM[1];
  return [
    `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&gid=${gid}`,
    `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`,
    `https://docs.google.com/spreadsheets/d/${id}/pub?output=csv&gid=${gid}`,
  ];
}

function parseCSV(text) {
  const rows = [];
  let row = [], cur = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') { cur += '"'; i++; } else inQ = false;
      } else cur += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") { row.push(cur); cur = ""; }
    else if (c === "\n") { row.push(cur); rows.push(row); row = []; cur = ""; }
    else if (c !== "\r") cur += c;
  }
  if (cur.length || row.length) { row.push(cur); rows.push(row); }
  return rows.filter((r) => r.some((v) => (v || "").trim()));
}

function extractDriveId(link) {
  if (!link) return "";
  const m = link.match(/\/d\/([a-zA-Z0-9-_]{20,})/) || link.match(/[?&]id=([a-zA-Z0-9-_]{20,})/);
  return m ? m[1] : "";
}

// הורדת תמונה מ-Drive עם כתובות חלופיות; אם ההורדה נחסמת - מחזיר קישור תצוגה ישיר.
async function resolveImage(link) {
  const raw = (link || "").trim();
  if (!raw) return "";
  const id = extractDriveId(raw);
  const tries = id
    ? [`https://drive.google.com/thumbnail?id=${id}&sz=w1000`, `https://lh3.googleusercontent.com/d/${id}=w1000`, `https://drive.google.com/uc?export=view&id=${id}`]
    : [raw];
  for (const u of tries) {
    try {
      const res = await fetch(u);
      if (res.ok) {
        const blob = await res.blob();
        if (blob.type.startsWith("image/")) return await compressImage(blob);
      }
    } catch (e) {}
  }
  return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w1000` : raw;
}

function keyOf(c) {
  const phone = (c.phone || "").replace(/\D/g, "");
  if (phone) return "p:" + phone;
  const name = (c.fullName || "").trim();
  return name ? "n:" + name : "";
}

export default function SheetImport({ data }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [headers, setHeaders] = useState(null);
  const [rows, setRows] = useState([]);
  const [gender, setGender] = useState("");
  const [mapping, setMapping] = useState({});
  const [descCols, setDescCols] = useState(new Set());
  const [imageCol, setImageCol] = useState(-1);
  const [dedupMode, setDedupMode] = useState("add");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState("");

  function reset() {
    setHeaders(null); setRows([]); setGender(""); setMapping({});
    setDescCols(new Set()); setImageCol(-1); setResult(""); setError("");
  }

  async function load() {
    setLoading(true); setError(""); reset();
    const urls = toCsvUrls(url);
    let text = "";
    for (const u of urls) {
      try {
        const res = await fetch(u);
        if (res.ok) {
          const t = await res.text();
          if (t && !/^\s*<(!doctype|html)/i.test(t)) { text = t; break; }
        }
      } catch (e) {}
    }
    setLoading(false);
    if (!text) { setError("לא הצלחנו לקרוא את הגיליון. ודאי שהגיליון «פורסם לצפייה» או משותף «לכל מי שיש קישור», ונסי שוב."); return; }
    const parsed = parseCSV(text);
    if (parsed.length < 2) { setError("הגיליון ריק או ללא שורות נתונים."); return; }
    const hdr = parsed[0].map((h) => (h || "").trim());
    setHeaders(hdr);
    setRows(parsed.slice(1));
    // ניחוש אוטומטי: מיפוי שדות, עמודת תמונה, ועמודות לתיאור (עמודות רגילות שלא מופו).
    const map = {}; const desc = new Set(); let imgCol = -1;
    hdr.forEach((h, i) => {
      const kind = classifyHeader(h);
      if (kind === "image") { if (imgCol < 0) imgCol = i; }
      else if (kind === "timestamp") { /* טכני - מחוץ לתיאור */ }
      else if (kind && MAP_FIELDS.includes(kind)) { if (map[kind] === undefined) map[kind] = i; }
      else desc.add(i); // עמודה רגילה - מועמדת לתיאור
    });
    setMapping(map); setImageCol(imgCol); setDescCols(desc);
  }

  function toggleDesc(i) {
    setDescCols((s) => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n; });
  }

  async function doImport() {
    if (!gender) { setError("חובה לבחור בנים או בנות לפני הייבוא."); return; }
    setImporting(true); setError(""); setResult("");
    const existing = {};
    (data.candidates || []).forEach((c) => { const k = keyOf(c); if (k) existing[k] = c; });
    let added = 0, updated = 0, skipped = 0;
    for (const row of rows) {
      const payload = { gender };
      MAP_FIELDS.forEach((f) => {
        const idx = mapping[f];
        if (idx !== undefined && idx >= 0) {
          let v = (row[idx] || "").trim();
          if (f === "age") { const m = v.match(/\d{1,3}/); v = m ? m[0] : ""; }
          if (f === "phone") v = v.replace(/[^\d]/g, "").replace(/^(\d{3})(\d)/, "$1-$2");
          if (v) payload[f] = v;
        }
      });
      // תיאור: ערכי העמודות שנבחרו, ברצף, ללא כותרות
      const descParts = [...descCols].sort((a, b) => a - b).map((i) => (row[i] || "").trim()).filter(Boolean);
      if (descParts.length) payload.description = descParts.join("\n\n");
      // תמונה
      if (imageCol >= 0 && row[imageCol]) {
        try { payload.photo = await resolveImage(row[imageCol]); } catch (e) {}
      }
      if (!payload.fullName && !payload.phone) { skipped++; continue; }
      const k = keyOf(payload);
      const exist = k && existing[k];
      if (exist) {
        if (dedupMode === "add") { skipped++; continue; }
        try { await updateCandidate(exist.id, payload); updated++; } catch (e) { skipped++; }
      } else {
        if (dedupMode === "update") { skipped++; continue; }
        try { await addCandidate(payload); added++; } catch (e) { skipped++; }
      }
    }
    setImporting(false);
    setResult(`הסתיים ✓ נוספו: ${added} · עודכנו: ${updated} · דולגו: ${skipped}`);
  }

  return (
    <div>
      <button className="btn-soft" onClick={() => setOpen(true)}>📥 ייבוא מ-Google Sheets</button>
      {open && (
        <Modal title="ייבוא מ-Google Sheets" onClose={() => { setOpen(false); reset(); setUrl(""); }}>
          <div className="space-y-4">
            <div>
              <label className="field-label">קישור לגיליון (מפורסם לצפייה או משותף)</label>
              <input className="field-input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://docs.google.com/spreadsheets/…" />
              <button className="btn-primary mt-2 w-full" disabled={loading || !url.trim()} onClick={load}>{loading ? "טוען…" : "טעינת הגיליון"}</button>
            </div>

            {error && <div className="rounded-2xl bg-rose/10 px-4 py-3 text-sm font-medium text-roseDark">{error}</div>}

            {headers && (
              <>
                <div className="rounded-2xl bg-blush/40 p-3">
                  <p className="mb-1 text-sm font-bold text-roseDark">1. בנים או בנות? (חובה)</p>
                  <div className="flex gap-2">
                    <button className={`flex-1 rounded-full px-3 py-2 text-sm font-bold ${gender === "male" ? "bg-blue-100 text-blue-700" : "bg-white text-ink/60"}`} onClick={() => setGender("male")}>בנים</button>
                    <button className={`flex-1 rounded-full px-3 py-2 text-sm font-bold ${gender === "female" ? "bg-blush text-roseDark" : "bg-white text-ink/60"}`} onClick={() => setGender("female")}>בנות</button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-bold text-roseDark">2. מיפוי עמודות לשדות</p>
                  {MAP_FIELDS.map((f) => (
                    <div key={f} className="flex items-center gap-2">
                      <span className="w-28 shrink-0 text-sm text-ink/70">{PARSE_FIELD_NAMES[f]}</span>
                      <select className="field-input !py-1.5" value={mapping[f] ?? -1} onChange={(e) => setMapping((m) => ({ ...m, [f]: parseInt(e.target.value) }))}>
                        <option value={-1}>— ללא —</option>
                        {headers.map((h, i) => <option key={i} value={i}>{h || `עמודה ${i + 1}`}</option>)}
                      </select>
                    </div>
                  ))}
                  <div className="flex items-center gap-2">
                    <span className="w-28 shrink-0 text-sm text-ink/70">תמונה (Drive)</span>
                    <select className="field-input !py-1.5" value={imageCol} onChange={(e) => setImageCol(parseInt(e.target.value))}>
                      <option value={-1}>— ללא —</option>
                      {headers.map((h, i) => <option key={i} value={i}>{h || `עמודה ${i + 1}`}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-bold text-roseDark">3. עמודות לתיאור האישי (סימון מרובה)</p>
                  <p className="text-xs text-ink/60">התוכן ישולב ברצף בשדה «תיאור אישי», ללא כותרות השאלות.</p>
                  <div className="max-h-40 space-y-1 overflow-y-auto rounded-xl bg-sand/30 p-2">
                    {headers.map((h, i) => (
                      <label key={i} className="flex items-center gap-2 text-sm text-ink/80">
                        <input type="checkbox" className="h-4 w-4 accent-rose" checked={descCols.has(i)} onChange={() => toggleDesc(i)} />
                        {h || `עמודה ${i + 1}`}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-bold text-roseDark">4. כפילויות (לפי טלפון או שם)</p>
                  <select className="field-input !py-1.5" value={dedupMode} onChange={(e) => setDedupMode(e.target.value)}>
                    <option value="add">הוספת חדשים בלבד (מדלג על קיימים)</option>
                    <option value="update">עדכון קיימים בלבד</option>
                    <option value="both">הוספה + עדכון</option>
                  </select>
                </div>

                <p className="text-xs text-ink/60">סה"כ שורות נתונים בגיליון: {rows.length}</p>
                <button className="btn-primary w-full" disabled={importing || !gender} onClick={doImport}>
                  {importing ? "מייבא…" : "🚀 התחלת ייבוא"}
                </button>
                {result && <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-center text-sm font-bold text-emerald-700">{result}</div>}
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
