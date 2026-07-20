"use client";

import { useState } from "react";
import Modal from "./Modal";
import { addMatch, updateMatch, deleteMatch, displayRep } from "../lib/store";
import { copyClean, downloadPdf, shareClean } from "../lib/export";

const STATUS_OPTIONS = [
  "נוצרה התאמה",
  "בבירורים",
  "הוצע לצדדים",
  "נפגשים",
  "בהמתנה",
  "נסגר",
];

export default function MatchesPanel({ data, user, readOnly = false }) {
  const [adding, setAdding] = useState(false);
  const [manId, setManId] = useState("");
  const [womanId, setWomanId] = useState("");
  const [rationale, setRationale] = useState("");
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");

  function flash(msg) {
    setNotice(msg);
    setTimeout(() => setNotice(""), 1800);
  }

  // האם הנציג הנוכחי מנהל את המועמד (משויך ישירות או מכסה את הנציג המשויך)
  const managedByMe = (c) => {
    if (!user.repId) return false;
    if (c.assignedRep === user.repId) return true;
    const owner = data.reps.find((r) => r.id === c.assignedRep);
    return !!(owner && (owner.coveredBy || []).includes(user.repId));
  };
  // כרטיס מוגבל אינו נבחר להתאמה ע"י מי שאינו המנהלת/הנציג המנהל
  const canView = (c) =>
    !c.restricted || user.role === "admin" || managedByMe(c);
  const men = data.candidates.filter((c) => c.gender === "male" && canView(c));
  const women = data.candidates.filter((c) => c.gender === "female" && canView(c));
  const repById = (id) => data.reps.find((r) => r.id === id);
  const candById = (id) => data.candidates.find((c) => c.id === id);

  // מנהלת רואה הכל; נציג רואה התאמות שמערבות מועמד שלו, וגם התאמות שהוא/היא עצמו/ה יצר/ה (יוזם/ת).
  const visibleMatches = data.matches.filter((m) => {
    if (user.role === "admin") return true;
    if (m.createdByRep && m.createdByRep === user.repId) return true;
    const man = candById(m.manId);
    const woman = candById(m.womanId);
    return (man && managedByMe(man)) || (woman && managedByMe(woman));
  });

  function create() {
    if (!manId || !womanId) {
      setFormError("יש לבחור גם בחור וגם בחורה.");
      return;
    }
    if (!rationale.trim()) {
      setFormError("חובה לפרט נימוק להתאמה — למה ההצעה מתאימה ואילו תכונות משלימות.");
      return;
    }
    addMatch({ manId, womanId, rationale: rationale.trim(), createdByRep: user.repId || "admin" });
    setManId("");
    setWomanId("");
    setRationale("");
    setFormError("");
    setAdding(false);
  }

  // כל הנציגים המעורבים בהתאמה: נציג/ת הבחור, נציג/ת הבחורה, ויוזם/ת ההתאמה - ללא כפילויות.
  function involvedReps(m) {
    const man = candById(m.manId);
    const woman = candById(m.womanId);
    const entries = [];
    const add = (rep, role) => {
      if (!rep) return;
      const ex = entries.find((e) => e.rep.id === rep.id);
      if (ex) {
        if (!ex.roles.includes(role)) ex.roles.push(role);
      } else {
        entries.push({ rep, roles: [role] });
      }
    };
    add(displayRep(man, data.reps), "נציג/ת הבחור");
    add(displayRep(woman, data.reps), "נציג/ת הבחורה");
    if (m.createdByRep && m.createdByRep !== "admin") {
      add(repById(m.createdByRep), "יוזם/ת ההתאמה");
    }
    return { man, woman, entries };
  }

  // כפתורי יצירת קשר לנציג/ה מסוים/ת - וואטסאפ / SMS / שיחה, עם הודעה מוכנה.
  function contactButtons(rep, man, woman) {
    const phone = (rep.phone || "").replace(/[^0-9]/g, "");
    const text = `היי ${rep.name}, בנוגע להתאמה אפשרית בין ${man?.fullName || ""} לבין ${woman?.fullName || ""} — נוכל לדבר על זה?`;
    const enc = encodeURIComponent(text);
    return (
      <div className="flex flex-wrap gap-1.5">
        <a
          className="btn-soft !px-2.5 !py-1 text-xs"
          href={phone ? `https://wa.me/${phone}?text=${enc}` : `https://wa.me/?text=${enc}`}
          target="_blank"
          rel="noreferrer"
        >🟢 וואטסאפ</a>
        {phone && <a className="btn-soft !px-2.5 !py-1 text-xs" href={`sms:${phone}?body=${enc}`}>💬 SMS</a>}
        {phone && <a className="btn-soft !px-2.5 !py-1 text-xs" href={`tel:${phone}`}>📞 שיחה</a>}
        {!phone && <span className="text-xs text-ink/40">לא הוגדר טלפון</span>}
      </div>
    );
  }

  // פעולות מהירות על כרטיס מועמד - העתק / הורד / שתף. הכרטיס המיוצא מלא ומורחב.
  function quickActions(cand) {
    if (!cand) return null;
    const canSee = user.role === "admin" || managedByMe(cand);
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-semibold text-ink/70">{cand.fullName}:</span>
        <button
          className="btn-soft !px-2.5 !py-1 text-xs"
          onClick={async () => { await copyClean(cand, data.openQuestions, canSee); flash("הכרטיס הועתק ✓"); }}
        >📋 העתק</button>
        <button
          className="btn-soft !px-2.5 !py-1 text-xs"
          onClick={() => downloadPdf(cand, data.openQuestions, canSee)}
        >📄 הורד</button>
        <button
          className="btn-soft !px-2.5 !py-1 text-xs"
          onClick={async () => { const r = await shareClean(cand, data.openQuestions, canSee); if (r === "copied") flash("הועתק ללוח לשיתוף ✓"); }}
        >📤 שתף</button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-roseDark">💞 התאמות</h2>
        {!readOnly && <button className="btn-soft" onClick={() => { setFormError(""); setAdding(true); }}>+ התאמה חדשה</button>}
      </div>

      {notice && (
        <div className="rounded-2xl bg-rose/10 px-4 py-2 text-center text-sm font-semibold text-roseDark">{notice}</div>
      )}

      {visibleMatches.length === 0 && <p className="text-sm text-ink/50">אין התאמות עדיין.</p>}

      {visibleMatches.map((m) => {
        const { man, woman, entries } = involvedReps(m);
        return (
          <div key={m.id} className="card space-y-3">
            <p className="font-semibold text-ink">
              {man?.fullName || "—"} 🤝 {woman?.fullName || "—"}
            </p>

            {/* נימוק ההתאמה - גלוי לכל הנציגים המעורבים */}
            {m.rationale && (
              <div className="rounded-2xl bg-blush/50 p-3">
                <p className="mb-1 text-xs font-bold text-roseDark">💭 נימוק ההתאמה</p>
                <p className="whitespace-pre-wrap text-sm text-ink/90">{m.rationale}</p>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm">
              <span className="text-ink/60">הצעד הבא:</span>
              <select
                className="field-input !py-1.5"
                value={m.status}
                disabled={readOnly}
                onChange={(e) => updateMatch(m.id, { status: e.target.value })}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* פרטי הקשר של כל הנציגים המעורבים - במקביל, ללא כפיית סדר */}
            <div className="space-y-2 border-t border-sand pt-3">
              <p className="text-sm font-bold text-roseDark">אנשי קשר להתאמה</p>
              {entries.map((e) => (
                <div key={e.rep.id} className="rounded-2xl bg-sand/40 p-2.5">
                  <p className="text-sm font-semibold text-ink">{e.rep.name}</p>
                  <p className="mb-1 text-xs text-ink/50">{e.roles.join(" · ")}{e.rep.institution ? ` · ${e.rep.institution}` : ""}</p>
                  {contactButtons(e.rep, man, woman)}
                </div>
              ))}
            </div>

            {/* פעולות מהירות על כרטיסי המועמדים - כרטיס מיוצא מלא */}
            <div className="space-y-1.5 border-t border-sand pt-3">
              <p className="text-sm font-bold text-roseDark">פעולות על הכרטיסים</p>
              {quickActions(man)}
              {quickActions(woman)}
            </div>

            {!readOnly && (
              <div className="border-t border-sand pt-2">
                <button className="btn-soft text-roseDark !px-2.5 !py-1 text-xs" onClick={() => { if (confirm("למחוק התאמה?")) deleteMatch(m.id); }}>🗑️ מחיקת התאמה</button>
              </div>
            )}
          </div>
        );
      })}

      {adding && (
        <Modal title="יצירת התאמה" onClose={() => setAdding(false)}>
          <div className="space-y-4">
            {formError && (
              <div className="rounded-2xl bg-rose/10 px-4 py-3 text-sm font-medium text-roseDark">{formError}</div>
            )}
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
            <div>
              <label className="field-label">נימוק ההתאמה (חובה)</label>
              <p className="mb-1.5 text-xs text-ink/60">למה ההצעה מתאימה? אילו תכונות מצאת אצל כל אחד/ת שיכולות להשלים זה את זו?</p>
              <textarea
                className="field-input min-h-[120px] leading-relaxed"
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                placeholder="פרט/י כאן את המחשבה מאחורי ההצעה…"
              />
            </div>
            <button className="btn-primary w-full" onClick={create}>יצירה</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
