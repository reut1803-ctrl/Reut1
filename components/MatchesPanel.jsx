"use client";

import { useState } from "react";
import Modal from "./Modal";
import SearchSelect from "./SearchSelect";
import Recorder from "./Recorder";
import { addMatch, updateMatch, deleteMatch, addMatchUpdate, displayRep } from "../lib/store";
import { copyClean, downloadPdf, shareClean } from "../lib/export";

// שלבי ההתקדמות של ההתאמה (מהוצע ועד אירוסין), ובסוף "ירד מהפרק" - שמעביר להיסטוריה.
const ARCHIVED = "ירד מהפרק";
const STAGES = ["הוצע", "בבדיקה", "הוחלפו פרטים", "נפגשו", "בהמשך / מתקדמים", "אירוסין", ARCHIVED];
const STUCK_MS = 14 * 24 * 60 * 60 * 1000; // שבועיים - סף "הצעה תקועה"

export default function MatchesPanel({ data, user, readOnly = false }) {
  const [adding, setAdding] = useState(false);
  const [manId, setManId] = useState("");
  const [womanId, setWomanId] = useState("");
  const [rationale, setRationale] = useState("");
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [updateText, setUpdateText] = useState({});
  const [collapsed, setCollapsed] = useState({});
  const [reWarn, setReWarn] = useState(null); // התראת שימוש חוזר בהצעה שירדה בעבר
  const [histOpen, setHistOpen] = useState(false);
  // אדם "לא במאגר" (מהמעגל האישי) - נשמר רק בתוך ההתאמה. {name, details}
  const [externalMan, setExternalMan] = useState(null);
  const [externalWoman, setExternalWoman] = useState(null);

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
  // הסתרה נקודתית - חוק ברזל שגובר על הכל: מועמד שהוסתר מהנציג/ה הנוכחי לא קיים עבורו/ה כלל.
  const hiddenFromMe = (c) =>
    user.role === "rep" && !!user.repId && !!c && (c.hiddenFrom || []).includes(user.repId);
  const canView = (c) =>
    !hiddenFromMe(c) && (!c.restricted || user.role === "admin" || managedByMe(c));
  const men = data.candidates.filter((c) => c.gender === "male" && canView(c));
  const women = data.candidates.filter((c) => c.gender === "female" && canView(c));
  const repById = (id) => data.reps.find((r) => r.id === id);
  const candById = (id) => data.candidates.find((c) => c.id === id);

  // מנהלת רואה הכל; נציג רואה התאמות שמערבות מועמד שלו, וגם התאמות שהוא/היא יצר/ה.
  // אבל אם מועמד בהתאמה הוסתר מהנציג/ה - ההתאמה כולה לא תוצג לו/ה.
  const visibleMatches = data.matches.filter((m) => {
    const man = candById(m.manId);
    const woman = candById(m.womanId);
    if (hiddenFromMe(man) || hiddenFromMe(woman)) return false;
    if (user.role === "admin") return true;
    if (m.createdByRep && m.createdByRep === user.repId) return true;
    return (man && managedByMe(man)) || (woman && managedByMe(woman));
  });

  // הצעות פעילות (ללא אלו שירדו מהפרק).
  const activeMatches = visibleMatches.filter((m) => m.status !== ARCHIVED);
  // היסטוריית ההתאמות - הצעות שירדו מהפרק, גלויות לכלל הנציגים (למעט מועמד מוסתר).
  const historyMatches = data.matches.filter((m) => {
    if (m.status !== ARCHIVED) return false;
    return !hiddenFromMe(candById(m.manId)) && !hiddenFromMe(candById(m.womanId));
  });

  function create(force = false) {
    const manOk = manId || (externalMan && externalMan.name.trim());
    const womanOk = womanId || (externalWoman && externalWoman.name.trim());
    if (!manOk || !womanOk) {
      setFormError("יש לבחור/להזין גם בחור וגם בחורה.");
      return;
    }
    if (!rationale.trim()) {
      setFormError("חובה לפרט את הרציונל (הניצוץ) — למה ההצעה מתאימה ואילו תכונות משלימות.");
      return;
    }
    // התראת שימוש חוזר: הצעה זהה (מועמדים מהמאגר) שכבר ירדה מהפרק בעבר.
    if (!force && manId && womanId) {
      const prior = data.matches.find((m) => m.manId === manId && m.womanId === womanId && m.status === ARCHIVED);
      if (prior) {
        const who = handlerName(prior) || "הנציג/ה המלווה";
        setReWarn(`⚠️ הצעה זו כבר הוצעה בעבר וירדה מהפרק. מומלץ קודם לברר עם ${who} מה הייתה הסיבה, ולתעד אותה. אפשר להמשיך בכל זאת.`);
        return;
      }
    }
    const payload = { manId: manId || "", womanId: womanId || "", rationale: rationale.trim(), status: STAGES[0], createdByRep: user.repId || "admin" };
    if (!manId && externalMan) payload.externalMan = { name: externalMan.name.trim(), details: (externalMan.details || "").trim() };
    if (!womanId && externalWoman) payload.externalWoman = { name: externalWoman.name.trim(), details: (externalWoman.details || "").trim() };
    addMatch(payload);
    setManId(""); setWomanId("");
    setExternalMan(null); setExternalWoman(null);
    setRationale("");
    setFormError("");
    setReWarn(null);
    setAdding(false);
  }

  // ----- "הצעה תקועה" (פעמון): אותו סטטוס מעל שבועיים -----
  function isStuck(m) {
    if (m.status === ARCHIVED || m.status === "אירוסין") return false;
    if (m.snoozedUntil && Date.now() < new Date(m.snoozedUntil).getTime()) return false;
    const since = m.statusChangedAt || m.createdAt;
    if (!since) return false;
    return Date.now() - new Date(since).getTime() > STUCK_MS;
  }
  function daysStuck(m) {
    const since = m.statusChangedAt || m.createdAt;
    return since ? Math.floor((Date.now() - new Date(since).getTime()) / 86400000) : 0;
  }
  function nudgeSms(m, manLabel, womanLabel) {
    const creator = repById(m.createdByRep);
    const phone = (creator?.phone || "").replace(/[^0-9]/g, "");
    const text = `היי ${creator?.name || ""}, ההצעה בין ${manLabel || ""} ל${womanLabel || ""} תקועה בסטטוס "${m.status}" כבר ${daysStuck(m)} ימים. אפשר לקדם אותה?`;
    return phone ? `sms:${phone}?body=${encodeURIComponent(text)}` : "";
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
  function contactButtons(rep, manLabel, womanLabel) {
    const phone = (rep.phone || "").replace(/[^0-9]/g, "");
    const text = `היי ${rep.name}, בנוגע להתאמה אפשרית בין ${manLabel || ""} לבין ${womanLabel || ""} — נוכל לדבר על זה?`;
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

  // כרטיס לאדם "לא במאגר" - הפרטים נשמרים בתוך ההתאמה בלבד, עם הקלטה קצרה אופציונלית.
  function externalCard(m, side) {
    const ext = side === "man" ? m.externalMan : m.externalWoman;
    if (!ext) return null;
    return (
      <div className="flex-1 rounded-2xl border border-dashed border-rose/40 bg-blush/20 p-3">
        <p className="font-bold text-ink">{ext.name} <span className="text-xs font-normal text-roseDark">· לא במאגר</span></p>
        {ext.details && <p className="mt-1 whitespace-pre-wrap text-sm text-ink/70">{ext.details}</p>}
        <div className="mt-2">
          <Recorder candidateId={`ext_${m.id}_${side}`} repId={user.repId || "admin"} canRecord={!readOnly} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-roseDark">💞 הצעות פעילות ({activeMatches.length})</h2>
        {!readOnly && <button className="btn-soft" onClick={() => { setFormError(""); setReWarn(null); setAdding(true); }}>+ הצעת התאמה</button>}
      </div>

      {notice && (
        <div className="rounded-2xl bg-rose/10 px-4 py-2 text-center text-sm font-semibold text-roseDark">{notice}</div>
      )}

      {activeMatches.length === 0 && <p className="text-sm text-ink/50">אין הצעות פעילות.</p>}

      {activeMatches.map((m) => {
        const man = candById(m.manId);
        const woman = candById(m.womanId);
        const manLabel = man?.fullName || m.externalMan?.name || "—";
        const womanLabel = woman?.fullName || m.externalWoman?.name || "—";
        const entries = involvedReps(m, man, woman);
        const others = entries.filter((e) => user.role === "admin" || e.rep.id !== user.repId);
        const isCollapsed = !!collapsed[m.id];
        const curStage = Math.max(0, STAGES.indexOf(m.status));
        const handler = handlerName(m);
        const canManageAssign = user.role === "admin" || (!readOnly && (m.handledBy ?? m.createdByRep) === user.repId);
        return (
          <div key={m.id} className="card space-y-3">
            {/* כותרת + חיווי "תקוע" + כיווץ */}
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold text-ink">{manLabel} 🤝 {womanLabel}</p>
              <div className="flex items-center gap-2">
                {isStuck(m) && (
                  <span className="animate-pulse rounded-full bg-red-100 px-2 py-1 text-xs font-bold text-red-700">🔔 תקוע {daysStuck(m)} ימים</span>
                )}
                <button className="text-ink/40" onClick={() => setCollapsed((s) => ({ ...s, [m.id]: !isCollapsed }))}>{isCollapsed ? "▼" : "▲"}</button>
              </div>
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
                    const isArch = s === ARCHIVED;
                    const circle = active
                      ? (isArch ? "bg-red-600 text-white" : "bg-roseDark text-white")
                      : (isArch ? "bg-red-100 text-red-700" : "bg-sand text-ink/50");
                    return (
                      <button
                        key={s}
                        disabled={readOnly}
                        onClick={() => { if (!isArch || confirm(`להעביר את ההצעה ל"ירד מהפרק"? היא תעבור להיסטוריה.`)) updateMatch(m.id, { status: s, statusChangedAt: new Date().toISOString() }); }}
                        className="flex shrink-0 flex-col items-center gap-1"
                        style={{ width: "5rem" }}
                      >
                        <span className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${circle}`}>{isArch ? "✕" : i + 1}</span>
                        <span className={`text-center text-[11px] leading-tight ${active ? "font-bold text-roseDark" : "text-ink/50"}`}>{s}</span>
                      </button>
                    );
                  })}
                </div>

                {/* התראת "הצעה תקועה" - עם כיבוי/איפוס אמיתי */}
                {isStuck(m) && (
                  <div className="rounded-2xl bg-red-50 p-3">
                    <p className="mb-2 text-sm font-semibold text-red-700">🔔 ההצעה תקועה {daysStuck(m)} ימים באותו סטטוס.</p>
                    <div className="flex flex-wrap gap-2">
                      {nudgeSms(m, manLabel, womanLabel) && (
                        <a className="btn-soft !px-2.5 !py-1 text-xs" href={nudgeSms(m, manLabel, womanLabel)}>📩 תזכורת ליוזם (SMS)</a>
                      )}
                      {!readOnly && (
                        <button className="btn-primary !px-2.5 !py-1 text-xs" onClick={() => updateMatch(m.id, { statusChangedAt: new Date().toISOString(), snoozedUntil: "" })}>✓ טיפלתי — כיבוי התראה</button>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] text-ink/50">הכיבוי מאפס את ספירת הימים. אם ההצעה תישאר תקועה שבועיים נוספים — התזכורת תחזור.</p>
                  </div>
                )}

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
                  {man ? candidateCard(man) : externalCard(m, "man")}
                  {woman ? candidateCard(woman) : externalCard(m, "woman")}
                </div>

                {/* אנשי קשר - הנציגים האחרים בלבד, עם כפתורי חיוג */}
                <div className="space-y-2 border-t border-sand pt-3">
                  <p className="text-sm font-bold text-roseDark">אנשי קשר להתאמה</p>
                  {others.length === 0 && <p className="text-xs text-ink/40">אין נציגים נוספים ליצירת קשר בהתאמה זו.</p>}
                  {others.map((e) => (
                    <div key={e.rep.id} className="rounded-2xl bg-blush/40 p-2.5">
                      <p className="text-sm font-semibold text-ink">{e.rep.name}</p>
                      <p className="mb-1 text-xs text-ink/50">{e.roles.join(" · ")}{e.rep.institution ? ` · ${e.rep.institution}` : ""}</p>
                      {contactButtons(e.rep, manLabel, womanLabel)}
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

      {/* היסטוריית ההתאמות - הצעות שירדו מהפרק, גלוי לכל הנציגים */}
      {historyMatches.length > 0 && (
        <div className="border-t border-sand pt-3">
          <button className="flex w-full items-center justify-between text-right" onClick={() => setHistOpen((v) => !v)}>
            <span className="text-base font-bold text-roseDark">📁 היסטוריית ההתאמות ({historyMatches.length})</span>
            <span className="text-sm text-ink/50">{histOpen ? "▲" : "▼"}</span>
          </button>
          <p className="text-xs text-ink/50">הצעות שירדו מהפרק — גלוי ונגיש לכל הנציגים.</p>
          {histOpen && historyMatches.map((m) => {
            const man = candById(m.manId);
            const woman = candById(m.womanId);
            const manLabel = man?.fullName || m.externalMan?.name || "—";
            const womanLabel = woman?.fullName || m.externalWoman?.name || "—";
            const last = m.updates && m.updates.length ? m.updates[m.updates.length - 1] : null;
            return (
              <div key={m.id} className="mt-2 rounded-2xl bg-sand/30 p-3">
                <p className="font-semibold text-ink">{manLabel} 🤝 {womanLabel}</p>
                {m.rationale && <p className="mt-1 text-xs text-ink/60">✨ {m.rationale}</p>}
                {last && <p className="mt-1 text-xs text-ink/50">הערה אחרונה: {last.text} ({last.by})</p>}
                {!readOnly && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button className="btn-soft !px-2.5 !py-1 text-xs" onClick={() => updateMatch(m.id, { status: STAGES[0] })}>↩️ החזרה לפעיל</button>
                    {user.role === "admin" && <button className="btn-soft text-roseDark !px-2.5 !py-1 text-xs" onClick={() => { if (confirm("למחוק לצמיתות מההיסטוריה?")) deleteMatch(m.id); }}>🗑️</button>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {adding && (
        <Modal title="הצעת התאמה" onClose={() => { setAdding(false); setReWarn(null); }}>
          <div className="space-y-4">
            <p className="text-sm text-ink/60">בחרו בחור ובחורה והציעו התאמה ביניהם</p>
            {formError && (
              <div className="rounded-2xl bg-rose/10 px-4 py-3 text-sm font-medium text-roseDark">{formError}</div>
            )}
            {reWarn && (
              <div className="space-y-2 rounded-2xl bg-amber-100 px-4 py-3 text-sm font-medium text-amber-800">
                <p className="whitespace-pre-line">{reWarn}</p>
                <div className="flex gap-2">
                  <button className="btn-primary !px-3 !py-1.5 text-xs" onClick={() => create(true)}>המשך בכל זאת</button>
                  <button className="btn-soft !px-3 !py-1.5 text-xs" onClick={() => setReWarn(null)}>ביטול</button>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="field-label">בחור</label>
                {externalMan ? (
                  <ExternalForm title="פרטי הבחור החיצוני" value={externalMan} onChange={setExternalMan} onCancel={() => setExternalMan(null)} />
                ) : (
                  <SearchSelect
                    value={manId}
                    placeholder="בחירת בחור…"
                    options={men.map((c) => ({ id: c.id, label: c.fullName, external: c.external }))}
                    onChange={(id) => { setManId(id); setReWarn(null); }}
                    onAddExternal={(name) => { setExternalMan({ name, details: "" }); setManId(""); setReWarn(null); }}
                  />
                )}
              </div>
              <div>
                <label className="field-label">בחורה</label>
                {externalWoman ? (
                  <ExternalForm title="פרטי הבחורה החיצונית" value={externalWoman} onChange={setExternalWoman} onCancel={() => setExternalWoman(null)} />
                ) : (
                  <SearchSelect
                    value={womanId}
                    placeholder="בחירת בחורה…"
                    options={women.map((c) => ({ id: c.id, label: c.fullName, external: c.external }))}
                    onChange={(id) => { setWomanId(id); setReWarn(null); }}
                    onAddExternal={(name) => { setExternalWoman({ name, details: "" }); setWomanId(""); setReWarn(null); }}
                  />
                )}
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
            <button className="btn-primary w-full" onClick={() => create()}>♡ הצע התאמה</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// טופס לאדם "לא במאגר" - שם + פרטים חופשיים. נשמר רק בתוך ההתאמה.
function ExternalForm({ title, value, onChange, onCancel }) {
  return (
    <div className="space-y-2 rounded-2xl border border-dashed border-rose/40 bg-blush/20 p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-roseDark">{title}</p>
        <button type="button" className="text-xs text-ink/50" onClick={onCancel}>✕ ביטול</button>
      </div>
      <p className="text-xs text-ink/60">אדם שאינו במאגר. הפרטים נשמרים רק בתוך ההתאמה הזו ולא נפתח כרטיס במאגר.</p>
      <input className="field-input" value={value.name} onChange={(e) => onChange({ ...value, name: e.target.value })} placeholder="מי זה? (שם או זיהוי, למשל «בחור שפגשתי בשבת»)" />
      <textarea className="field-input min-h-[80px]" value={value.details} onChange={(e) => onChange({ ...value, details: e.target.value })} placeholder="פרטים על האדם: גיל, רקע, אופי, ממי הגיע…" />
      <p className="text-[11px] text-ink/50">אפשר להוסיף הקלטה קצרה על האדם בכרטיס ההתאמה לאחר היצירה.</p>
    </div>
  );
}
