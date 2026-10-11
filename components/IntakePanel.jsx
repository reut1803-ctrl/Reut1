"use client";

import { useState } from "react";
import Modal from "./Modal";
import CandidateEditor from "./CandidateEditor";
import { updateIntake, approveIntake, deleteIntake } from "../lib/store";
import { ClipboardCheck, Check, X, Pencil, Phone, Crown } from "lucide-react";

// תור הממתינים להנהלה: הרשמות מהטופס הציבורי (intakeSubmissions).
// תג מסלול לכל שורה, סיווג פנימי "מסגרת זהב", עריכה מלאה, ואישור/דחייה.
export default function IntakePanel({ data }) {
  const [editId, setEditId] = useState(null);
  const items = [...(data.intake || [])].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  if (items.length === 0) return null;

  const editing = items.find((x) => x.id === editId);

  function trackInfo(t) {
    if (t === "personal") return { label: "מסלול אישי", cls: "bg-rose/15 text-roseDark" };
    if (t === "callback") return { label: "נא לחזור אליי", cls: "bg-blue-100 text-blue-700" };
    return { label: "טרם נבחר מסלול", cls: "bg-sand text-ink/50" };
  }

  return (
    <section className="space-y-3 rounded-3xl border-2 border-rose/40 bg-rose/5 p-4">
      <p className="flex items-center gap-2 text-base font-bold text-roseDark">
        <ClipboardCheck className="h-5 w-5" strokeWidth={1.75} /> ממתינים לאישור ({items.length})
      </p>
      <p className="text-xs text-ink/60">הרשמות חדשות מהטופס. אפשר לערוך כל פרט, לסווג פנימית, לאשר למאגר או לדחות.</p>

      {items.map((c) => {
        const ti = trackInfo(c.track);
        return (
          <div key={c.id} className="space-y-2 rounded-2xl bg-white/80 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-ink">{c.fullName || "ללא שם"}</span>
              <span className="text-sm text-ink/60">· {c.gender === "female" ? "בחורה" : "בחור"}{c.age ? ` · גיל ${c.age}` : ""}</span>
              {c.phone && <a href={`tel:${c.phone}`} className="flex items-center gap-1 text-sm text-roseDark"><Phone className="h-3.5 w-3.5" strokeWidth={1.75} /> {c.phone}</a>}
            </div>

            {/* תגים: מסלול שהמועמד בחר + סיווג פנימי "מסגרת זהב" */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${ti.cls}`}>{ti.label}</span>
              {c.goldFrame && (
                <span className="flex items-center gap-1 rounded-full bg-amber-200 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                  <Crown className="h-3.5 w-3.5" strokeWidth={2} /> מסגרת זהב
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <button className="btn-primary !py-2" onClick={() => approveIntake(c.id)}><Check className="h-4 w-4" strokeWidth={2} /> אשר והכנס למאגר</button>
              <button className="btn-soft !py-2" onClick={() => setEditId(c.id)}><Pencil className="h-4 w-4" strokeWidth={1.75} /> עריכה</button>
              <button
                className="btn-soft !py-2"
                onClick={() => updateIntake(c.id, { goldFrame: !c.goldFrame })}
              >
                <Crown className="h-4 w-4" strokeWidth={1.75} /> {c.goldFrame ? "הסר מסגרת זהב" : "סמן מסגרת זהב"}
              </button>
              <button
                className="btn-soft !py-2 text-roseDark"
                onClick={() => { if (confirm(`לדחות ולמחוק את ההרשמה של "${c.fullName}"?`)) deleteIntake(c.id); }}
              ><X className="h-4 w-4" strokeWidth={2} /> דחייה</button>
            </div>
          </div>
        );
      })}

      {editing && (
        <Modal title={`עריכת הרשמה — ${editing.fullName || ""}`} onClose={() => setEditId(null)}>
          <CandidateEditor
            initial={editing}
            openQuestions={data.openQuestions}
            reps={data.reps}
            isAdmin
            onSave={(form) => updateIntake(editing.id, form).then(() => setEditId(null))}
            onCancel={() => setEditId(null)}
          />
        </Modal>
      )}
    </section>
  );
}
