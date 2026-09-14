"use client";

import { useState } from "react";
import Modal from "./Modal";
import CandidateEditor from "./CandidateEditor";
import Recorder from "./Recorder";
import { genderLabel } from "../lib/questions";
import { toHebrewDate } from "../lib/dates";
import { copyClean, downloadPdf } from "../lib/export";
import { displayRep, trackEngagement } from "../lib/store";

// כרטיס מועמד: תצוגה מקוצרת + תצוגה מורחבת (טופס מלא).
// locked = כרטיס מוגבל שהמשתמש/ת אינו/ה מורשה/ית לפרטים המלאים: מוצגים שם/גיל/נציג + מנעול בלבד.
export default function CandidateCard({ candidate, openQuestions, reps, canEdit, canSeeSensitive, currentRepId, isAdmin = false, locked = false, onUpdate, onDelete }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  // הנציג/ה המוצג/ת ליצירת קשר: מחליף/ה אם המשויך/ת בחופשה, אחרת המשויך/ת.
  const rep = displayRep(candidate, reps);

  // נתוני ליבה קצרים -> תגיות; תוכן ועומק -> נרטיב אחד זורם.
  const g = candidate.gender;
  const genderWord = g === "female" ? "בחורה" : "בחור";
  const phoneDigits = (candidate.phone || "").replace(/[^0-9]/g, "");
  const badges = [
    `${genderWord} · גיל ${candidate.age || "—"}`,
    candidate.height && `גובה ${candidate.height}`,
    candidate.community,
    candidate.location,
    candidate.work,
    candidate.degree,
    candidate.birthDate && toHebrewDate(candidate.birthDate),
  ].filter(Boolean);
  const hasNarrative = !!candidate.description || !!candidate.parentsWork || (openQuestions || []).some((q) => candidate.answers?.[q.key]);
  const aboutTitle = g === "female" ? "קצת עליה" : "קצת עליו";

  async function handleCopy() {
    await copyClean(candidate, openQuestions, canSeeSensitive);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <>
      {/* כרטיס מקוצר */}
      <div className="card cursor-pointer transition hover:shadow-lg" onClick={() => { trackEngagement("view"); setOpen(true); }}>
        <div className="flex items-center gap-3">
          {candidate.photo && !locked ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={candidate.photo} alt={candidate.fullName} className="h-14 w-14 rounded-2xl object-cover" />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blush text-2xl">{locked ? "🔒" : "👤"}</div>
          )}
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 truncate font-semibold text-ink">
              {candidate.fullName}
              {locked && <span className="text-base" title="כרטיס מוגבל">🔒</span>}
            </p>
            <p className="text-sm text-ink/60">
              {candidate.gender === "female" ? "בחורה" : "בחור"} · גיל {candidate.age}
            </p>
            <p className="truncate text-xs text-ink/50">נציג: {rep ? rep.name : "ללא שיוך"}</p>
          </div>
        </div>
      </div>

      {/* תצוגה מורחבת */}
      {open && (
        <Modal title={candidate.fullName} onClose={() => { setOpen(false); setEditing(false); }}>
          {locked ? (
            // כרטיס מוגבל - תצוגה נקייה לשם בלבד, עם הודעת דיסקרטיות. שום מידע רגיש/הקלטה/ייצוא.
            <div className="space-y-4 py-2 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-blush text-4xl">🔒</div>
              <p className="text-xl font-bold text-ink">{candidate.fullName}</p>
              <p className="rounded-2xl bg-blush/50 p-4 text-base leading-relaxed text-ink/80">
                הפרטים המלאים וההקלטה שמורים בדיסקרטיות וגלויים למנהלת ולנציג המטפל בלבד.
              </p>
            </div>
          ) : editing ? (
            <CandidateEditor
              initial={candidate}
              openQuestions={openQuestions}
              reps={reps}
              isAdmin={isAdmin}
              onSave={(form) => onUpdate(candidate.id, form).then(() => setEditing(false))}
              onCancel={() => setEditing(false)}
            />
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                {candidate.photo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={candidate.photo} alt={candidate.fullName} className="h-24 w-24 shrink-0 rounded-2xl object-cover" />
                )}
                {/* נתוני ליבה כתגיות נקיות למבט מהיר */}
                <div className="flex flex-wrap gap-1.5">
                  {badges.map((b, i) => (
                    <span key={i} className="rounded-full bg-blush px-3 py-1 text-sm font-medium text-roseDark">{b}</span>
                  ))}
                </div>
              </div>

              <p className="text-sm text-ink/60">נציג/ה מלווה: {rep ? `${rep.name}${rep.institution ? ` · ${rep.institution}` : ""}` : "ללא שיוך"}</p>

              {/* טלפון אישי - למורשים בלבד */}
              {canSeeSensitive && candidate.phone && (
                <div className="flex flex-wrap gap-2">
                  <a className="btn-soft" href={`tel:${phoneDigits}`}>📞 {candidate.phone}</a>
                  <a className="btn-soft" href={`sms:${phoneDigits}`}>💬 SMS</a>
                  <a className="btn-soft" href={`https://wa.me/${phoneDigits}`} target="_blank" rel="noreferrer">🟢 וואטסאפ</a>
                </div>
              )}

              {/* הטלפון האישי מוסתר משאר הנציגים - יצירת קשר דרך הנציג/ה */}
              {!canSeeSensitive && rep && (
                <div className="rounded-2xl bg-blush/60 p-4">
                  <p className="mb-2 text-base font-semibold text-roseDark">לפרטים ולבירורים — דרך הנציג/ה: {rep.name}</p>
                  {rep.phone ? (
                    <div className="flex flex-wrap gap-2">
                      <a className="btn-soft" href={`tel:${rep.phone}`}>📞 שיחה</a>
                      <a className="btn-soft" href={`sms:${rep.phone}`}>💬 SMS</a>
                      <a className="btn-soft" href={`https://wa.me/${rep.phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer">🟢 וואטסאפ</a>
                    </div>
                  ) : (
                    <p className="text-sm text-ink/60">לא הוגדר טלפון לנציג זה.</p>
                  )}
                </div>
              )}

              {/* הנרטיב האישי - כל התוכן והעומק בגוש אחד זורם ונעים לעין */}
              {hasNarrative && (
                <div className="space-y-3 rounded-2xl bg-blush/40 p-4">
                  <p className="text-base font-bold text-roseDark">{aboutTitle}</p>
                  {candidate.description && (
                    <p className="whitespace-pre-wrap text-lg leading-relaxed text-ink/90">{candidate.description}</p>
                  )}
                  {candidate.parentsWork && (
                    <p className="text-lg leading-relaxed text-ink/90">רקע משפחתי: {candidate.parentsWork}</p>
                  )}
                  {(openQuestions || []).map((q) =>
                    candidate.answers?.[q.key] ? (
                      <div key={q.key}>
                        <p className="mb-0.5 text-xs text-ink/45">{genderLabel(q, candidate.gender)}</p>
                        <p className="whitespace-pre-wrap text-lg leading-relaxed text-ink/90">{candidate.answers[q.key]}</p>
                      </div>
                    ) : null
                  )}
                </div>
              )}

              {candidate.references?.length > 0 && (
                <div className="border-t border-sand pt-3">
                  <p className="mb-1 text-base font-bold text-roseDark">אנשי קשר</p>
                  {candidate.references.map((r, i) => (
                    <p key={i} className="text-lg text-ink/90">{i + 1}. {r.name} — {r.relation} {canSeeSensitive ? `(${r.phone})` : ""}</p>
                  ))}
                </div>
              )}

              {/* מידע רגיש - גלוי רק לנציג ולמנהלת */}
              {canSeeSensitive && (
                <div className="rounded-2xl bg-rose/10 p-3">
                  <p className="mb-1 text-sm font-semibold text-roseDark">🔒 מידע רגיש (לנציג ולמנהלת בלבד)</p>
                  <p className="whitespace-pre-wrap text-sm text-ink/80">{candidate.sensitiveInfo || "—"}</p>
                </div>
              )}

              {/* הקלטות קוליות - כל הצוות מאזין; רק הנציג של המועמד והמנהלת מקליטים/מוחקים */}
              <Recorder candidateId={candidate.id} repId={currentRepId} canRecord={canEdit} />

              {/* ייצוא נתונים */}
              <div className="flex flex-wrap gap-2 border-t border-sand pt-3">
                <button className="btn-soft" onClick={handleCopy}>📋 {copied ? "הועתק!" : "העתקה ללוח"}</button>
                <button className="btn-soft" onClick={() => downloadPdf(candidate, openQuestions, canSeeSensitive)}>📄 הורדת PDF</button>
                {canEdit && <button className="btn-soft" onClick={() => setEditing(true)}>✏️ עריכה</button>}
                {onDelete && (
                  <button
                    className="btn-soft text-roseDark"
                    onClick={() => { if (confirm(`⚠️ למחוק לצמיתות את "${candidate.fullName}"?\nהפעולה אינה ניתנת לשחזור.`)) { onDelete(candidate.id); setOpen(false); } }}
                  >🗑️ מחיקה</button>
                )}
              </div>
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
