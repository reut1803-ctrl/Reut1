"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Sheet, RefreshCw, Download, Check, AlertTriangle, ChevronLeft, Link2 } from "lucide-react";
import { useCrmStore } from "@/lib/crm/store";
import {
  toCsvUrl,
  fetchSheetRows,
  guessMapping,
  rowKey,
  rowToCandidate,
  FIELD_LABELS,
} from "@/lib/crm/sheetImport";

// ייבוא מועמדים מגיליון Google. מסך למנהלת בלבד.
export default function SheetImportPage() {
  const role = useCrmStore((s) => s.role);
  const sheetImport = useCrmStore((s) => s.sheetImport);
  const setSheetImportConfig = useCrmStore((s) => s.setSheetImportConfig);
  const candidates = useCrmStore((s) => s.candidates);
  const addCandidate = useCrmStore((s) => s.addCandidate);
  const updateCandidate = useCrmStore((s) => s.updateCandidate);
  const showToast = useCrmStore((s) => s.showToast);

  const [linkDraft, setLinkDraft] = useState("");
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [mapping, setMapping] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState("");
  const [forcedGender, setForcedGender] = useState("");
  const [repairing, setRepairing] = useState(false);

  useEffect(() => {
    setLinkDraft(sheetImport?.csvUrl || "");
    if (sheetImport?.mapping && Object.keys(sheetImport.mapping).length) setMapping(sheetImport.mapping);
    if (sheetImport?.forcedGender) setForcedGender(sheetImport.forcedGender);
  }, [sheetImport]);

  // מפתחות השורות שכבר יובאו, כדי שאותה שורה לא תיפתח פעמיים ככרטיס
  const importedKeys = useMemo(
    () => new Set(candidates.map((c) => c.sheetRowKey).filter(Boolean)),
    [candidates]
  );

  const newRows = useMemo(
    () => rows.filter((r) => !importedKeys.has(rowKey(r, mapping))),
    [rows, mapping, importedKeys]
  );

  if (role !== "admin") {
    return <p className="px-4 py-10 text-center text-sm text-[#7C6E60]">אזור זה זמין למנהלת בלבד</p>;
  }

  const load = async (rawUrl) => {
    const csvUrl = toCsvUrl(rawUrl);
    if (!csvUrl) {
      setError("הקישור אינו נראה כמו קישור לגיליון Google");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { headers: h, rows: r } = await fetchSheetRows(csvUrl);
      setHeaders(h);
      setRows(r);
      const nextMapping = Object.keys(mapping).length ? mapping : guessMapping(h);
      setMapping(nextMapping);
      await setSheetImportConfig({ csvUrl, mapping: nextMapping });
    } catch (e) {
      setError(e?.message || "שאיבת הגיליון נכשלה");
      setHeaders([]);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const chooseGender = async (value) => {
    setForcedGender(value);
    await setSheetImportConfig({ forcedGender: value });
  };

  // המרת שורה לכרטיס, תמיד עם הכותרות ועם בחירת המאגר
  const toCandidate = (row) => rowToCandidate(row, mapping, { headers, forcedGender });

  const changeMapping = async (field, value) => {
    const next = { ...mapping };
    if (value === "") delete next[field];
    else next[field] = Number(value);
    setMapping(next);
    await setSheetImportConfig({ mapping: next });
  };

  const runImport = async () => {
    if (newRows.length === 0 || importing) return;
    if (mapping.name === undefined) {
      setError("חובה לבחור עמודה של שם מלא לפני הייבוא");
      return;
    }
    if (!forcedGender && mapping.gender === undefined) {
      setError("חובה לבחור אם השורות בגיליון הזה הן בנים או בנות");
      return;
    }
    setImporting(true);
    setError("");
    let ok = 0;
    let skipped = 0;
    for (let i = 0; i < newRows.length; i++) {
      setProgress(`מייבאת ${i + 1} מתוך ${newRows.length}...`);
      const data = toCandidate(newRows[i]);
      if (!data.name) {
        skipped++;
        continue;
      }
      try {
        await addCandidate(data);
        ok++;
      } catch {
        skipped++;
      }
    }
    setProgress("");
    setImporting(false);
    showToast(`יובאו ${ok} מועמדים${skipped ? `, ${skipped} דולגו` : ""}`);
  };

  // עדכון כרטיסים שכבר יובאו מהגיליון: משלים את התיאור המלא ואת המאגר הנכון,
  // בלי ליצור כרטיסים חדשים ובלי לגעת בכרטיסים שלא הגיעו מהגיליון.
  const runRepair = async () => {
    if (rows.length === 0 || repairing) return;
    setRepairing(true);
    setError("");
    const byKey = new Map();
    candidates.forEach((c) => {
      if (c.sheetRowKey) byKey.set(c.sheetRowKey, c);
    });

    let updated = 0;
    for (let i = 0; i < rows.length; i++) {
      setProgress(`מעדכנת ${i + 1} מתוך ${rows.length}...`);
      const key = rowKey(rows[i], mapping);
      const existing = byKey.get(key);
      if (!existing) continue;
      const fresh = toCandidate(rows[i]);
      const patch = {};
      if (fresh.bio && fresh.bio !== existing.bio) patch.bio = fresh.bio;
      if (forcedGender && existing.gender !== forcedGender) {
        patch.gender = forcedGender;
        patch.religiousLevel = fresh.religiousLevel;
        patch.education = fresh.education;
        patch.yeshivaLevel = fresh.yeshivaLevel;
      }
      if (Object.keys(patch).length === 0) continue;
      try {
        await updateCandidate(existing.id, patch);
        updated++;
      } catch {
        // ממשיכים לשורה הבאה
      }
    }
    setProgress("");
    setRepairing(false);
    showToast(updated ? `עודכנו ${updated} כרטיסים קיימים` : "לא נמצאו כרטיסים לעדכון");
  };

  const alreadyImported = rows.filter((r) => importedKeys.has(rowKey(r, mapping))).length;

  return (
    <div className="px-4 py-6">
      <Link href="/crm/dashboard" className="flex items-center gap-1 text-[13px] font-semibold text-[#844442]">
        <ChevronLeft size={14} /> חזרה ללוח הבקרה
      </Link>

      <h1 className="mt-3 flex items-center gap-2 text-xl font-bold text-[#3A2E26]">
        <Sheet size={20} /> ייבוא מגיליון Google
      </h1>
      <p className="mt-1 text-[13px] leading-relaxed text-[#7C6E60]">
        שואב שורות חדשות מהגיליון שבו נאספות תשובות המועמדים, ופותח מהן כרטיסים במאגר.
        שורה שכבר יובאה לא תיובא שוב.
      </p>

      <div className="mt-4 rounded-3xl border border-[#CCBDAB] bg-white p-4 shadow-[0_4px_18px_rgba(58,51,53,0.06)]">
        <p className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-[#3A2E26]">
          <Link2 size={14} /> קישור לגיליון
        </p>
        <input
          type="url"
          dir="ltr"
          value={linkDraft}
          onChange={(e) => setLinkDraft(e.target.value)}
          placeholder="https://docs.google.com/spreadsheets/..."
          className="w-full rounded-xl border border-[#CCBDAB] bg-white px-3 py-2 text-left text-[13px] outline-none focus:border-[#844442]"
        />
        <button
          onClick={() => load(linkDraft)}
          disabled={loading}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-2xl bg-[#844442] px-4 py-2.5 text-[13px] font-semibold text-white transition active:scale-95 disabled:opacity-60"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          {loading ? "טוענת מהגיליון..." : "בדיקת הגיליון ורענון"}
        </button>

        <div className="mt-3 rounded-xl bg-[#E8DCCB] p-3">
          <p className="text-[11px] font-bold text-[#3A2E26]">איך מכינים את הגיליון (פעם אחת):</p>
          <ol className="mt-1 list-inside list-decimal space-y-0.5 text-[11px] leading-relaxed text-[#7C6E60]">
            <li>פותחים את הגיליון ב-Google Sheets</li>
            <li>בתפריט העליון: קובץ ← שיתוף ← פרסום באינטרנט</li>
            <li>בוחרים את הגיליון הרצוי, ובפורמט בוחרים CSV</li>
            <li>לוחצים פרסם, מעתיקים את הקישור שמתקבל ומדביקים כאן</li>
          </ol>
        </div>
      </div>

      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-2xl bg-[#FBEDED] p-3">
          <AlertTriangle size={15} className="mt-0.5 shrink-0 text-[#C24545]" />
          <p className="text-[12px] leading-relaxed text-[#C24545]">{error}</p>
        </div>
      )}

      {headers.length > 0 && (
        <>
          <h2 className="mt-6 mb-2 text-[15px] font-bold text-[#3A2E26]">התאמת עמודות</h2>
          <p className="mb-2 text-[11px] leading-relaxed text-[#7C6E60]">
            המערכת ניחשה לבד לפי הכותרות. אפשר לתקן כל שורה, והבחירה נשמרת לפעם הבאה.
          </p>
          <div className="space-y-1.5 rounded-3xl border border-[#CCBDAB] bg-white p-4">
            {Object.entries(FIELD_LABELS).map(([field, label]) => (
              <div key={field} className="flex items-center justify-between gap-2">
                <select
                  value={mapping[field] === undefined ? "" : String(mapping[field])}
                  onChange={(e) => changeMapping(field, e.target.value)}
                  className="min-w-0 flex-1 rounded-xl border border-[#CCBDAB] bg-white px-2 py-1.5 text-[12px] outline-none focus:border-[#844442]"
                >
                  <option value="">-- אין עמודה --</option>
                  {headers.map((h, i) => (
                    <option key={i} value={i}>
                      {h || `עמודה ${i + 1}`}
                    </option>
                  ))}
                </select>
                <span className="w-28 shrink-0 text-right text-[12px] font-semibold text-[#3A2E26]">{label}</span>
              </div>
            ))}
          </div>

          <h2 className="mt-6 mb-2 text-[15px] font-bold text-[#3A2E26]">לאיזה מאגר השורות שייכות?</h2>
          <div className="rounded-3xl border border-[#CCBDAB] bg-white p-4">
            <div className="flex gap-2">
              {[
                { key: "female", label: "בנות" },
                { key: "male", label: "בנים" },
                ...(mapping.gender !== undefined ? [{ key: "", label: "לפי העמודה בגיליון" }] : []),
              ].map((option) => (
                <button
                  key={option.key || "column"}
                  onClick={() => chooseGender(option.key)}
                  className={`flex-1 rounded-2xl border px-3 py-2.5 text-[13px] font-semibold transition ${
                    forcedGender === option.key
                      ? "border-[#844442] bg-[#844442] text-white"
                      : "border-[#CCBDAB] bg-white text-[#3A2E26]"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-[#7C6E60]">
              כל השורות בגיליון הזה ייכנסו למאגר שנבחר כאן. הבחירה נשמרת לפעם הבאה.
            </p>
          </div>

          {alreadyImported > 0 && (
            <>
              <h2 className="mt-6 mb-2 text-[15px] font-bold text-[#3A2E26]">עדכון כרטיסים שכבר יובאו</h2>
              <div className="rounded-3xl border border-[#CCBDAB] bg-white p-4">
                <p className="text-[12px] leading-relaxed text-[#7C6E60]">
                  {alreadyImported} שורות בגיליון כבר קיימות ככרטיסים במאגר. הכפתור משלים בהן את
                  התיאור המלא (כל שאר השאלות והתשובות מהגיליון) ומתקן את המאגר לפי הבחירה שלמעלה.
                  לא נוצרים כרטיסים חדשים.
                </p>
                <button
                  onClick={runRepair}
                  disabled={repairing}
                  className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-2xl border-2 border-[#844442] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#844442] transition active:scale-95 disabled:opacity-60"
                >
                  <RefreshCw size={15} className={repairing ? "animate-spin" : ""} />
                  {repairing ? progress || "מעדכנת..." : `עדכון ${alreadyImported} הכרטיסים הקיימים`}
                </button>
              </div>
            </>
          )}

          <h2 className="mt-6 mb-2 text-[15px] font-bold text-[#3A2E26]">
            שורות חדשות לייבוא ({newRows.length} מתוך {rows.length})
          </h2>

          {newRows.length === 0 ? (
            <div className="flex items-center gap-2 rounded-2xl bg-[#DDE6DF] p-3">
              <Check size={16} className="shrink-0 text-[#4A6552]" />
              <p className="text-[12px] text-[#4A6552]">הכל מסונכרן - אין שורות חדשות בגיליון</p>
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                {newRows.slice(0, 25).map((r, i) => {
                  const preview = toCandidate(r);
                  return (
                    <div key={i} className="rounded-2xl border border-[#CCBDAB] bg-white px-3 py-2">
                      <p className="text-[13px] font-bold text-[#3A2E26]">{preview.name || "(ללא שם - ידולג)"}</p>
                      <p className="text-[11px] text-[#7C6E60]">
                        {[
                          preview.gender === "female" ? "בחורה" : "בחור",
                          preview.age ? `גיל ${preview.age}` : null,
                          preview.height ? `${preview.height} ס״מ` : null,
                          preview.city,
                          preview.photoUrl ? "כולל תמונה" : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                  );
                })}
                {newRows.length > 25 && (
                  <p className="py-1 text-center text-[11px] text-[#A2937F]">
                    ועוד {newRows.length - 25} שורות...
                  </p>
                )}
              </div>

              <button
                onClick={runImport}
                disabled={importing}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-2xl bg-[#62826B] px-4 py-3 text-[14px] font-semibold text-white transition active:scale-95 disabled:opacity-60"
              >
                <Download size={16} /> {importing ? progress || "מייבאת..." : `ייבוא ${newRows.length} מועמדים למאגר`}
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}
