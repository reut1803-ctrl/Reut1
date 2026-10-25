"use client";

import { useState } from "react";

// עדכוני השגרירים אחרי שיחה עם מועמד ("מה שלומו?") — למנהלת/ליזמית.
// החדשים ביותר למעלה, עם סינון לפי שגריר וחיפוש לפי שם מועמד.
const PAGE = 30;
const fmt = (iso) => {
  try { return new Date(iso).toLocaleString("he-IL", { day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" }); }
  catch (e) { return ""; }
};

export default function ContactUpdatesViewer({ data }) {
  const [rep, setRep] = useState("all");
  const [term, setTerm] = useState("");
  const [shown, setShown] = useState(PAGE);
  const all = [...(data.contactUpdates || [])].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  const repName = (u) => (data.reps || []).find((r) => r.id === u.repId)?.name || u.repName || "מנהלת";
  const candName = (u) => (data.candidates || []).find((c) => c.id === u.candidateId)?.fullName || u.candidateName || "מועמד/ת";
  const repsWithUpdates = (data.reps || []).filter((r) => all.some((u) => u.repId === r.id));
  const t = term.trim();
  const list = all.filter((u) => (rep === "all" || u.repId === rep) && (!t || candName(u).includes(t)));

  if (all.length === 0) {
    return <p className="rounded-2xl bg-blush/30 p-4 text-sm text-ink/55">עדיין אין עדכונים. השגרירים מעדכנים במסך "המועמדים שלי" ← "עדכון אחרי שיחה".</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <select className="field-input flex-1 text-sm" value={rep} onChange={(e) => { setRep(e.target.value); setShown(PAGE); }}>
          <option value="all">כל השגרירים</option>
          {repsWithUpdates.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <input className="field-input flex-1 text-sm" value={term} onChange={(e) => { setTerm(e.target.value); setShown(PAGE); }} placeholder="חיפוש לפי שם מועמד" />
      </div>
      {list.slice(0, shown).map((u) => (
        <div key={u.id} className="rounded-2xl bg-white/80 p-3.5 ring-1 ring-rose/10">
          <div className="flex items-baseline justify-between gap-2">
            <p className="font-bold text-roseDark">{candName(u)}</p>
            <p className="shrink-0 text-[11px] text-ink/45">{fmt(u.createdAt)}</p>
          </div>
          <p className="text-xs text-ink/50">עודכן ע״י {repName(u)}</p>
          <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-ink/80">{u.text}</p>
        </div>
      ))}
      {list.length === 0 && <p className="text-sm text-ink/50">אין עדכונים שמתאימים לסינון.</p>}
      {list.length > shown && <button className="btn-soft w-full" onClick={() => setShown((n) => n + PAGE)}>הצגת עוד ({list.length - shown})</button>}
    </div>
  );
}
