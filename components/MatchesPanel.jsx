"use client";

import { useState } from "react";
import Modal from "./Modal";
import { addMatch, updateMatch, deleteMatch, addMatchUpdate, displayRep } from "../lib/store";
import { copyClean, downloadPdf, shareClean } from "../lib/export";

// שלבי ההתקדמות של ההתאמה (מהוצע ועד אירוסין).
const STAGES = ["הוצע", "בבדיקה", "הוחלפו פרטים", "נפגשו", "בהמשך / מתקדמים", "אירוסין"];

export default function MatchesPanel({ data, user, readOnly = false }) {
  const [adding, setAdding] = useState(false);
  const [manId, setManId] = useState("");
  const [womanId, setWomanId] = useState("");
  const [rationale, setRationale] = useState("");
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [updateText, setUpdateText] = useState({});
  const [collapsed, setCollapsed] = useState({});

  function flash(msg) {
    setNotice(msg);
    setTimeout(() => setNotice(""), 1800);
  }

  function submitUpdate(mId) {
    const text = (updateText[mId] || "").trim();
    if (!text) return;
    addMatchUpdate(mId, text);
    setUpdateText((s) => ({ ...s, [mId]: "" }));
  }

  function fmtDate(iso) {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleString("he-IL", {
        day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit",
      });
    } catch (e) { return iso; }
  }

  // האם הנציג הנוכחי מנהל את המועמד (משויך ישירות או מכסה את הנציג המשויך)
  const managedByMe = (c) => {
    if (!user.repId) return false;
    if (c && c.assignedRep === user.repId) return true;
    const owner = c && data.reps.find((r) => r.id === c.assignedRep);
    return !!(owner && (owner.coveredBy || []).includes(user.repId));
  };
  const canView = (c) =>
    !c.restricted || user.role === "admin" || managedByMe(c);
  const men = data.candidates.filter((c) => c.gender === "male" && canView(c));
  const women = data.candidates.filter((c) => c.gender === "female" && canView(c));
  const repById = (id) => data.reps.find((r) => r.id === id);
  const candById = (id) => data.candidates.find((c) => c.id === id);

  // מנהלת רואה הכל; נציג רואה התאמות שמערבות מועמד שלו, וגם התאמות שהוא/היא יצר/ה.
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
      setFormError("חובה לפרט את הרציונל (הניצוץ) — למה ההצעה מתאימה ואילו תכונות משלימות.");
      return;
    }
    addMatch({ manId, womanId, rationale: rationale.trim(), status: STAGES[0], createdByRep: user.repId || "admin" });
    setManId("");
    setWomanId("");
    setRationale("");
    setFormError("");
    setAdding(false);
  }

  // כל הנציגים המעורבים: נציג/ת הבחור, נציג/ת הבחורה, ויוזם/ת ההתאמה - ללא כפילויות.
  function involvedReps(m, man, woman) {
    const entries = [];
    const add = (rep, role) => {
      if (!rep) return;
      const ex = entries.find((e) => e.rep.id === rep.id);
      if (ex) { if (!ex.roles.includes(role)) ex.roles.push(role); }
      else entries.push({ rep, roles: [role] });
    };
    add(displayRep(man, data.reps), "נציג/ת הבחור");
    add(displayRep(woman, data.reps), "נציג/ת הבחורה");
    if (m.createdByRep && m.createdByRep !== "admin") add(repById(m.createdByRep), "יוזם/ת ההתאמה");
    return entries;
  }

  // שם הנציג/ה המטפל/ת בהתאמה (ברירת מחדל: יוזם/ת ההתאמה).
  function handlerName(m) {
    const id = m.handledBy !== undefined ? m.handledBy : m.createdByRep;
    if (!id) return null;
    if (id === "admin") return "מנהלת";
    return repById(id)?.name || null;
  }

  // כפתורי יצירת קשר לנציג/ה - וואטסאפ / SMS / שיחה, עם הודעה מוכנה.
  function contactButtons(rep, man, woman) {
    const phone = (rep.phone || "").replace(/[^0-9]/g, "");
    const text = `היי ${rep.name}, בנוגע להתאמה אפשרית בין ${man?.fullName || ""} לבין ${woman?.fullName || ""} — נוכל לדבר על זה?`;
    const enc = encodeURIComponent(text);
    return (
      <div className="flex flex-wrap gap-1.5">
        <a className="btn-soft !px-2.5 !py-1 text-xs" href={phone ? `https://wa.me/${phone}?text=${enc}` : `https://wa.me/?text=${enc}`} target="_blank" rel="noreferrer">🟢 וואטסאפ</a>
        {phone && <a className="btn-soft !px-2.5 !py-1 text-xs" href={`sms:${phone}?body=${enc}`}>💬 SMS</a>}
        {phone && <a className="btn-soft !px-2.5 !py-1 text-xs" href={`tel:${phone}`}>📞 שיחה</a>}
        {!phone && <span className="text-xs text-ink/40">לא הוגדר טלפון</span>}
      </div>
    );
  }

  // כרטיס מועמד עם שם, טלפון (למי שמורשה) ופעולות מהירות - כרטיס מיוצא מלא.
  function candidateCard(cand) {
    if (!cand) return null;
    const canSee = user.role === "admin" || managedByMe(cand);
    const phone = (cand.phone || "").replace(/[^0-9]/g, "");
    return (
      <div className="flex-1 rounded-2xl bg-sand/40 p-3">
        <p className="font-bold text-ink">{cand.fullName}</p>
        {canSee && cand.phone ? (
          <a href={`tel:${phone}`} className="mb-2 mt-0.5 block text-sm text-ink/70">📞 {cand.phone}</a>
        ) : (
          <p className="mb-2 mt-0.5 text-xs text-ink/40">הטלפון דרך הנציג/ה</p>
        )}
        <div className="flex flex-wrap gap-1.5">
          <button className="btn-soft !px-2.5 !py-1 text-xs" onClick={async () => { await copyClean(cand, data.openQuestions, canSee); flash("הכרטיס הועתק ✓"); }}>📋 העתקת כרטיס</button>
          <button className="btn-soft !px-2.5 !py-1 text-xs" onClick={() => downloadPdf(cand, data.openQuestions, canSee)}>📄 הורד</button>
          <button className="btn-soft !px-2.5 !py-1 text-xs" onClick={async () => { const r = await shareClean(cand, data.openQuestions, canSee); if (r === "copied") flash("הועתק ללוח לשיתוף ✓"); }}>📤 שתף</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-roseDark">💞 הצעות פעילות ({visibleMatches.length})</h2>
        {!readOnly && <button className="btn-soft" onClick={() => { setFormError(""); setAdding(true); }}>+ הצעת התאמה</button>}
      </div>

      {notice && (
        <div className="rounded-2xl bg-rose/10 px-4 py-2 text-center text-sm font-semibold text-roseDark">{notice}</div>
      )}

      {visibleMatches.length === 0 && <p className="text-sm text-ink/50">אין הצעות עדיין.</p>}

      {visibleMatches.map((m) => {
        const man = candById(m.manId);
        const woman = candById(m.womanId);
        const entries = involvedReps(m, man, woman);
        const others = entries.filter((e) => user.role === "admin" || e.rep.id !== user.repId);
        const isCollapsed = !!collapsed[m.id];
        const curStage = Math.max(0, STAGES.indexOf(m.status));
        const handler = handlerName(m);
        const canManageAssign = user.role === "admin" || (!readOnly && (m.handledBy ?? m.createdByRep) === user.repId);
        return (
          <div key={m.id} className="card space-y-3">
            {/* כותרת + כיווץ */}
            <div className="flex items-center justify-between">
              <p className="font-semibold text-ink">{man?.fullName || "—"} 🤝 {woman?.fullName || "—"}</p>
              <button className="text-ink/40" onClick={() => setCollapsed((s) => ({ ...s, [m.id]: !isCollapsed }))}>{isCollapsed ? "▼" : "▲"}</button>
            </div>

            {!isCollapsed && (
              <>
                {/* תגית מטפל/ת + שחרור שיוך */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded-full bg-rose/10 px-3 py-1 text-sm font-semibold text-roseDark">
                    👤 {handler ? `מטופל/ת ע"י ${handler}` : "לא משויך"}
                  </span>
                  {canManageAssign && (
                    handler
                      ? <button className="text-xs text-ink/50" onClick={() => updateMatch(m.id, { handledBy: "" })}>✕ שחרור שיוך</button>
                      : (!readOnly && user.repId && <button className="text-xs font-semibold text-roseDark" onClick={() => updateMatch(m.id, { handledBy: user.repId })}>+ קבל/י שיוך</button>)
                  )}
                </div>

                {/* פס שלבי התקדמות */}
                <div className="flex gap-1 overflow-x-auto pb-1">
                  {STAGES.map((s, i) => {
                    const active = i === curStage;
                    return (
                      <button
                        key={s}
                        disabled={readOnly}
                        onClick={() => updateMatch(m.id, { status: s })}
                        className="flex shrink-0 flex-col items-center gap-1"
                        style={{ width: "5rem" }}
                      >
                        <span className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${active ? "bg-roseDark text-white" : "bg-sand text-ink/50"}`}>{i + 1}</span>
                        <span className={`text-center text-[11px] leading-tight ${active ? "font-bold text-roseDark" : "text-ink/50"}`}>{s}</span>
                      </button>
                    );
                  })}
                </div>

                {/* הרציונל (הניצוץ) */}
                <div className="rounded-2xl bg-amber-50 p-3">
                  <p className="mb-1 text-sm font-bold text-amber-700">✨ הרציונל (הניצוץ)</p>
                  {m.rationale ? (
                    <p className="whitespace-pre-wrap text-sm text-ink/90">{m.rationale}</p>
                  ) : (
                    <p className="text-sm text-ink/40">לא הוזן רציונל (התאמה שנוצרה לפני עדכון זה).</p>
                  )}
                </div>

                {/* כרטיסי המועמדים */}
                <div className="flex flex-col gap-2 sm:flex-row">
                  {candidateCard(man)}
                  {candidateCard(woman)}
                </div>

                {/* אנשי קשר - הנציגים האחרים בלבד, עם כפתורי חיוג */}
                <div className="space-y-2 border-t border-sand pt-3">
                  <p className="text-sm font-bold text-roseDark">אנשי קשר להתאמה</p>
                  {others.length === 0 && <p className="text-xs text-ink/40">אין נציגים נוספים ליצירת קשר בהתאמה זו.</p>}
                  {others.map((e) => (
                    <div key={e.rep.id} className="rounded-2xl bg-blush/40 p-2.5">
                      <p className="text-sm font-semibold text-ink">{e.rep.name}</p>
                      <p className="mb-1 text-xs text-ink/50">{e.roles.join(" · ")}{e.rep.institution ? ` · ${e.rep.institution}` : ""}</p>
                      {contactButtons(e.rep, man, woman)}
                    </div>
                  ))}
                </div>

                {/* יומן מעקב - עדכונים והערות */}
                <div className="space-y-2 border-t border-sand pt-3">
                  <p className="text-sm font-bold text-roseDark">📌 עדכונים והערות</p>
                  {(m.updates && m.updates.length > 0) ? (
                    <div className="space-y-1.5">
                      {[...m.updates].sort((a, b) => (b.at || "").localeCompare(a.at || "")).map((u, i) => (
                        <div key={i} className="rounded-xl bg-cream px-3 py-2">
                          <p className="whitespace-pre-wrap text-sm text-ink/90">{u.text}</p>
                          <p className="mt-0.5 text-xs text-ink/50">{u.by} · {fmtDate(u.at)}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-ink/40">אין עדכונים עדיין.</p>
                  )}
                  {!readOnly && (
                    <div className="flex gap-2">
                      <input
                        className="field-input flex-1 !py-2 text-sm"
                        placeholder="הוספת עדכון (לדוגמה: דיברתי עם ראובן…)"
                        value={updateText[m.id] || ""}
                        onChange={(e) => setUpdateText((s) => ({ ...s, [m.id]: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === "Enter") submitUpdate(m.id); }}
                      />
                      <button className="btn-primary !px-3 !py-2 text-sm" onClick={() => submitUpdate(m.id)}>הוספה</button>
                    </div>
                  )}
                </div>

                {!readOnly && (
                  <div className="border-t border-sand pt-2">
                    <button className="btn-soft text-roseDark !px-2.5 !py-1 text-xs" onClick={() => { if (confirm("למחוק התאמה?")) deleteMatch(m.id); }}>🗑️ מחיקת התאמה</button>
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}

      {adding && (
        <Modal title="הצעת התאמה" onClose={() => setAdding(false)}>
          <div className="space-y-4">
            <p className="text-sm text-ink/60">בחרו בחור ובחורה והציעו התאמה ביניהם</p>
            {formError && (
              <div className="rounded-2xl bg-rose/10 px-4 py-3 text-sm font-medium text-roseDark">{formError}</div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">בחור</label>
                <select className="field-input" value={manId} onChange={(e) => setManId(e.target.value)}>
                  <option value="">בחירת בחור…</option>
                  {men.map((c) => <option key={c.id} value={c.id}>{c.fullName}</option>)}
                </select>
              </div>
              <div>
                <label className="field-label">בחורה</label>
                <select className="field-input" value={womanId} onChange={(e) => setWomanId(e.target.value)}>
                  <option value="">בחירת בחורה…</option>
                  {women.map((c) => <option key={c.id} value={c.id}>{c.fullName}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="field-label">הרציונל (הניצוץ) — למה זה מתאים?</label>
              <textarea
                className="field-input min-h-[120px] leading-relaxed"
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                placeholder="מה משלים בין הצדדים, למה נוצר החיבור…"
              />
            </div>
            <button className="btn-primary w-full" onClick={create}>♡ הצע התאמה</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
