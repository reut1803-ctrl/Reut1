"use client";

import { useState } from "react";
import Modal from "./Modal";
import { addMatch, updateMatch, deleteMatch } from "../lib/store";

const STATUS_OPTIONS = [
  "נוצרה התאמה",
  "בבירורים",
  "הוצע לצדדים",
  "נפגשים",
  "בהמתנה",
  "נסגר",
];

export default function MatchesPanel({ data, user }) {
  const [adding, setAdding] = useState(false);
  const [manId, setManId] = useState("");
  const [womanId, setWomanId] = useState("");

  const men = data.candidates.filter((c) => c.gender === "male");
  const women = data.candidates.filter((c) => c.gender === "female");
  const repById = (id) => data.reps.find((r) => r.id === id);
  const candById = (id) => data.candidates.find((c) => c.id === id);

  // נציג רואה התאמות שמערבות מועמד שלו; מנהלת רואה הכל.
  const visibleMatches = data.matches.filter((m) => {
    if (user.role === "admin") return true;
    const man = candById(m.manId);
    const woman = candById(m.womanId);
    return man?.assignedRep === user.repId || woman?.assignedRep === user.repId;
  });

  function create() {
    if (!manId || !womanId) return;
    addMatch({ manId, womanId, createdByRep: user.repId || "admin" });
    setManId("");
    setWomanId("");
    setAdding(false);
  }

  function contactInfo(match) {
    const man = candById(match.manId);
    const woman = candById(match.womanId);
    // הנציג של "שלי" הוא הנציג הנוכחי; הצד השני הוא הנציג של המועמד האחר.
    let myCand, otherCand, otherRepId;
    if (user.role === "rep") {
      if (man?.assignedRep === user.repId) { myCand = man; otherCand = woman; otherRepId = woman?.assignedRep; }
      else { myCand = woman; otherCand = man; otherRepId = man?.assignedRep; }
    } else {
      myCand = man; otherCand = woman; otherRepId = woman?.assignedRep;
    }
    const otherRep = repById(otherRepId);
    const repName = otherRep ? otherRep.name : "נציג";
    const text = `היי ${repName}, ראיתי במערכת התאמה פוטנציאלית בין ${myCand?.fullName || ""} לבין ${otherCand?.fullName || ""}. נוכל לדבר על זה?`;
    const phone = (otherRep?.phone || "").replace(/[^0-9]/g, "");
    return { phone, repName, text, enc: encodeURIComponent(text) };
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-roseDark">💞 התאמות</h2>
        <button className="btn-soft" onClick={() => setAdding(true)}>+ התאמה חדשה</button>
      </div>

      {visibleMatches.length === 0 && <p className="text-sm text-ink/50">אין התאמות עדיין.</p>}

      {visibleMatches.map((m) => {
        const man = candById(m.manId);
        const woman = candById(m.womanId);
        return (
          <div key={m.id} className="card space-y-3">
            <p className="font-semibold text-ink">
              {man?.fullName || "—"} 🤝 {woman?.fullName || "—"}
            </p>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-ink/60">הצעד הבא:</span>
              <select
                className="field-input !py-1.5"
                value={m.status}
                onChange={(e) => updateMatch(m.id, { status: e.target.value })}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            {(() => {
              const ci = contactInfo(m);
              return (
                <div className="space-y-2">
                  <p className="text-sm text-ink/60">יצירת קשר עם הנציג: {ci.repName}</p>
                  <div className="flex flex-wrap gap-2">
                    <a
                      className="btn-soft"
                      href={ci.phone ? `https://wa.me/${ci.phone}?text=${ci.enc}` : `https://wa.me/?text=${ci.enc}`}
                      target="_blank"
                      rel="noreferrer"
                    >🟢 וואטסאפ</a>
                    {ci.phone && (
                      <a className="btn-soft" href={`sms:${ci.phone}?body=${ci.enc}`}>💬 SMS</a>
                    )}
                    {ci.phone && (
                      <a className="btn-soft" href={`tel:${ci.phone}`}>📞 שיחה</a>
                    )}
                    <button className="btn-soft text-roseDark" onClick={() => { if (confirm("למחוק התאמה?")) deleteMatch(m.id); }}>🗑️</button>
                  </div>
                </div>
              );
            })()}
          </div>
        );
      })}

      {adding && (
        <Modal title="יצירת התאמה" onClose={() => setAdding(false)}>
          <div className="space-y-4">
            <div>
              <label className="field-label">בחירת גבר</label>
              <select className="field-input" value={manId} onChange={(e) => setManId(e.target.value)}>
                <option value="">בחר/י</option>
                {men.map((c) => <option key={c.id} value={c.id}>{c.fullName}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">בחירת אישה</label>
              <select className="field-input" value={womanId} onChange={(e) => setWomanId(e.target.value)}>
                <option value="">בחר/י</option>
                {women.map((c) => <option key={c.id} value={c.id}>{c.fullName}</option>)}
              </select>
            </div>
            <button className="btn-primary w-full" onClick={create}>יצירה</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
