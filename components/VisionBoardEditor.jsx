"use client";

import { useEffect, useState } from "react";
import { updateVisionBoard, DEFAULT_VISION_BOARD } from "../lib/store";
import { Plus, Trash2, ArrowUp, ArrowDown, Check } from "lucide-react";

// עריכת "לוח החזון" שבעמוד השער: כותרת, תת-כותרת, ולכל כרטיס — טקסט חזית,
// טקסט גב (נחשף בהיפוך), רקע וגודל. נשמר ב-meta/config ומתעדכן בשער מיד.
const STYLE_OPTIONS = [
  ["cream", "קרם (ציטוט)"],
  ["wine", "בורדו (ציטוט)"],
  ["harlequin", "נייר מעוינים"],
  ["paper", "טקסטורת נייר"],
  ["blush", "ורוד רך"],
  ["sand", "חול חם"],
];
const SIZE_OPTIONS = [["s", "נמוך"], ["m", "בינוני"], ["l", "גבוה"]];

export default function VisionBoardEditor({ data }) {
  const current = data.visionBoard || DEFAULT_VISION_BOARD;
  const [board, setBoard] = useState(current);
  const [state, setState] = useState("idle");
  const dirty = JSON.stringify(board) !== JSON.stringify(current);

  useEffect(() => {
    if (!dirty) setBoard(current);
  }, [JSON.stringify(current)]); // eslint-disable-line react-hooks/exhaustive-deps

  const setItem = (i, patch) => setBoard((b) => ({ ...b, items: b.items.map((it, j) => (j === i ? { ...it, ...patch } : it)) }));
  const move = (i, d) => setBoard((b) => {
    const items = [...b.items]; const j = i + d;
    if (j < 0 || j >= items.length) return b;
    [items[i], items[j]] = [items[j], items[i]];
    return { ...b, items };
  });
  const add = () => setBoard((b) => ({ ...b, items: [...b.items, { id: `v${Date.now().toString(36)}`, style: "cream", size: "m", front: "", back: "" }] }));
  const remove = (i) => setBoard((b) => ({ ...b, items: b.items.filter((_, j) => j !== i) }));

  // כרטיס ציטוט (קרם/בורדו) חייב טקסט חזית — אחרת הוא ריק לגמרי
  const invalid = board.items.findIndex((it) => ["cream", "wine"].includes(it.style) && !(it.front || "").trim());
  const valid = board.items.length > 0 && invalid === -1 && (board.title || "").trim();

  async function save() {
    if (!valid) return;
    setState("saving");
    try {
      await updateVisionBoard({
        title: board.title.trim(),
        subtitle: (board.subtitle || "").trim(),
        items: board.items.map((it) => ({ id: it.id, style: it.style, size: it.size, front: (it.front || "").trim(), back: (it.back || "").trim() })),
      });
      setState("saved");
      setTimeout(() => setState("idle"), 1600);
    } catch (e) {
      setState("error");
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-ink/60">הכרטיסים שבעמוד השער. בלחיצה הכרטיס מתהפך ומציג את "טקסט הגב". כרטיס רקע (מעוינים/נייר/ורוד/חול) יכול להישאר בלי טקסט חזית — אז רואים רק את הרקע.</p>

      <div className="card space-y-2">
        <label className="field-label">כותרת</label>
        <input className="field-input" value={board.title || ""} onChange={(e) => setBoard((b) => ({ ...b, title: e.target.value }))} />
        <label className="field-label">תת-כותרת</label>
        <input className="field-input" value={board.subtitle || ""} onChange={(e) => setBoard((b) => ({ ...b, subtitle: e.target.value }))} />
      </div>

      {board.items.map((it, i) => (
        <div key={it.id} className={`card space-y-2 ${i === invalid ? "ring-2 ring-rose/50" : ""}`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-roseDark">כרטיס {i + 1}</span>
            <span className="flex items-center gap-1">
              <button className="rounded-lg p-1.5 text-ink/50 hover:bg-blush disabled:opacity-30" disabled={i === 0} onClick={() => move(i, -1)} aria-label="הזזה למעלה"><ArrowUp className="h-4 w-4" /></button>
              <button className="rounded-lg p-1.5 text-ink/50 hover:bg-blush disabled:opacity-30" disabled={i === board.items.length - 1} onClick={() => move(i, 1)} aria-label="הזזה למטה"><ArrowDown className="h-4 w-4" /></button>
              <button className="rounded-lg p-1.5 text-roseDark hover:bg-blush disabled:opacity-30" disabled={board.items.length <= 1} onClick={() => remove(i)} aria-label="מחיקה"><Trash2 className="h-4 w-4" /></button>
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select className="field-input text-sm" value={it.style} onChange={(e) => setItem(i, { style: e.target.value })}>
              {STYLE_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <select className="field-input text-sm" value={it.size} onChange={(e) => setItem(i, { size: e.target.value })}>
              {SIZE_OPTIONS.map(([v, l]) => <option key={v} value={v}>גובה: {l}</option>)}
            </select>
          </div>
          <input className="field-input" value={it.front || ""} onChange={(e) => setItem(i, { front: e.target.value })} placeholder={["cream", "wine"].includes(it.style) ? "טקסט החזית (חובה בכרטיס ציטוט)" : "טקסט קטן מרחף על הרקע (לא חובה)"} />
          <textarea className="field-input min-h-[64px] text-sm" value={it.back || ""} onChange={(e) => setItem(i, { back: e.target.value })} placeholder="טקסט הגב — נחשף בהיפוך (עדיף עד ~15 מילים)" />
        </div>
      ))}

      <button className="btn-soft w-full" onClick={add}><Plus className="h-4 w-4" strokeWidth={2} /> הוספת כרטיס</button>

      <div className="flex gap-2">
        <button className="btn-primary flex-1" disabled={!valid || !dirty || state === "saving"} onClick={save}>
          {state === "saving" ? "שומר…" : state === "saved" ? (<><Check className="h-4 w-4" strokeWidth={2.25} /> נשמר</>) : "שמירת לוח החזון"}
        </button>
        {dirty && <button className="btn-soft" onClick={() => setBoard(current)}>ביטול שינויים</button>}
      </div>
      {invalid !== -1 && <p className="text-xs text-roseDark">בכרטיס {invalid + 1} (ציטוט) חסר טקסט חזית.</p>}
      {state === "error" && <p className="text-xs text-roseDark">השמירה נכשלה — בדקי חיבור ונסי שוב.</p>}
    </div>
  );
}
