"use client";

import { useState } from "react";
import Modal from "./Modal";
import CandidateEditor from "./CandidateEditor";
import { PERSONAL_FIELDS } from "../lib/questions";
import { copyClean, downloadPdf } from "../lib/export";

// כרטיס מועמד: תצוגה מקוצרת + תצוגה מורחבת (טופס מלא).
export default function CandidateCard({ candidate, openQuestions, reps, canEdit, canSeeSensitive, onUpdate, onDelete }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  const rep = reps.find((r) => r.id === candidate.assignedRep);

  async function handleCopy() {
    await copyClean(candidate, openQuestions);
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
              onSave={(form) => { onUpdate(candidate.id, form); setEditing(false); }}
              onCancel={() => setEditing(false)}
            />
          ) : (
            <div className="space-y-4">
              {candidate.photo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={candidate.photo} alt={candidate.fullName} className="h-32 w-32 rounded-2xl object-cover" />
              )}
              <div className="space-y-1">
                {PERSONAL_FIELDS.map((f) => (
                  <p key={f.key} className="text-sm"><span className="font-semibold">{f.label}:</span> {candidate[f.key]}</p>
                ))}
                <p className="text-sm"><span className="font-semibold">שיוך נציג:</span> {rep ? `${rep.name} (${rep.institution})` : "ללא שיוך"}</p>
              </div>

              <div className="space-y-3 border-t border-sand pt-3">
                {(openQuestions || []).map((q) => (
                  <div key={q.key}>
                    <p className="text-sm font-semibold text-roseDark">{q.label}</p>
                    <p className="whitespace-pre-wrap text-sm text-ink/80">{candidate.answers?.[q.key]}</p>
                  </div>
                ))}
              </div>

              {candidate.references?.length > 0 && (
                <div className="border-t border-sand pt-3">
                  <p className="mb-1 text-sm font-semibold text-roseDark">אנשי קשר</p>
                  {candidate.references.map((r, i) => (
                    <p key={i} className="text-sm text-ink/80">{i + 1}. {r.name} — {r.relation} {canSeeSensitive ? `(${r.phone})` : ""}</p>
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
                <button className="btn-soft" onClick={() => downloadPdf(candidate, openQuestions)}>📄 הורדת PDF</button>
                {canEdit && <button className="btn-soft" onClick={() => setEditing(true)}>✏️ עריכה</button>}
                {onDelete && (
                  <button
                    className="btn-soft text-roseDark"
                    onClick={() => { if (confirm("למחוק את המועמד?")) { onDelete(candidate.id); setOpen(false); } }}
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
