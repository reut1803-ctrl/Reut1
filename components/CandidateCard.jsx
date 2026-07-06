"use client";

import { useState } from "react";
import Modal from "./Modal";
import CandidateEditor from "./CandidateEditor";
import { PERSONAL_FIELDS, genderLabel } from "../lib/questions";
import { toHebrewDate } from "../lib/dates";
import { copyClean, downloadPdf } from "../lib/export";

// כרטיס מועמד: תצוגה מקוצרת + תצוגה מורחבת (טופס מלא).
export default function CandidateCard({ candidate, openQuestions, reps, canEdit, canSeeSensitive, onUpdate, onDelete }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  const rep = reps.find((r) => r.id === candidate.assignedRep);

  async function handleCopy() {
    await copyClean(candidate, openQuestions, canSeeSensitive);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <>
      {/* כרטיס מקוצר */}
      <div className="card cursor-pointer transition hover:shadow-lg" onClick={() => setOpen(true)}>
        <div className="flex items-center gap-3">
          {candidate.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={candidate.photo} alt={candidate.fullName} className="h-14 w-14 rounded-2xl object-cover" />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blush text-2xl">👤</div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-ink">{candidate.fullName}</p>
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
          {editing ? (
            <CandidateEditor
              initial={candidate}
              openQuestions={openQuestions}
              reps={reps}
              onSave={(form) => onUpdate(candidate.id, form).then(() => setEditing(false))}
              onCancel={() => setEditing(false)}
            />
          ) : (
            <div className="space-y-4">
              {candidate.photo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={candidate.photo} alt={candidate.fullName} className="h-32 w-32 rounded-2xl object-cover" />
              )}
              <div className="space-y-2">
                {PERSONAL_FIELDS.filter((f) => f.key !== "phone" || canSeeSensitive).map((f) => (
                  <p key={f.key} className="text-lg">
                    <span className="font-bold">{genderLabel(f, candidate.gender)}:</span> {candidate[f.key]}
                    {f.key === "birthDate" && candidate[f.key] && (
                      <span className="text-roseDark"> · {toHebrewDate(candidate[f.key])}</span>
                    )}
                  </p>
                ))}
                <p className="text-lg"><span className="font-bold">שיוך נציג:</span> {rep ? `${rep.name} (${rep.institution})` : "ללא שיוך"}</p>
              </div>

              {/* הטלפון האישי של המועמד מוסתר משאר הנציגים. ליצירת קשר - דרך הנציג שלו. */}
              {!canSeeSensitive && rep && (
                <div className="rounded-2xl bg-blush/60 p-4">
                  <p className="mb-2 text-base font-semibold text-roseDark">לפרטים ולבירורים — דרך הנציג: {rep.name}</p>
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

              <div className="space-y-4 border-t border-sand pt-3">
                {(openQuestions || []).map((q) => (
                  <div key={q.key}>
                    <p className="mb-1.5 text-base font-bold text-roseDark">{genderLabel(q, candidate.gender)}</p>
                    <div className="whitespace-pre-wrap rounded-2xl bg-blush/50 p-4 text-lg leading-relaxed text-ink/90">
                      {candidate.answers?.[q.key]}
                    </div>
                  </div>
                ))}
              </div>

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
