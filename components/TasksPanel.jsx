"use client";

import { useState } from "react";
import Modal from "./Modal";
import DateField from "./DateField";
import SearchSelect from "./SearchSelect";
import CandidateCard from "./CandidateCard";
import { toHebrewDate } from "../lib/dates";
import { addTask, updateTask, deleteTask, updateCandidate } from "../lib/store";

export default function TasksPanel({ data, user, readOnly = false }) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assignRep, setAssignRep] = useState(user.repId || "admin");
  const [candidateId, setCandidateId] = useState("");

  const isAdmin = user.role === "admin";
  const managedByMe = (c) => {
    if (!user.repId || !c) return false;
    if (c.assignedRep === user.repId) return true;
    const owner = data.reps.find((r) => r.id === c.assignedRep);
    return !!(owner && (owner.coveredBy || []).includes(user.repId));
  };

  // מנהלת רואה הכל; נציג רואה משימות המשויכות אליו (כולל כאלה שהמנהלת שייכה לו).
  const visibleTasks = data.tasks.filter((t) =>
    isAdmin ? true : t.repId === user.repId
  );

  function create() {
    if (!title.trim()) return;
    addTask({ title: title.trim(), dueDate, repId: (isAdmin ? assignRep : user.repId) || "admin", candidateId: candidateId || "" });
    setTitle("");
    setDueDate("");
    setCandidateId("");
    setAssignRep(user.repId || "admin");
    setAdding(false);
  }

  const candById = (id) => data.candidates.find((c) => c.id === id);
  const repName = (id) => (id === "admin" ? "מנהלת" : data.reps.find((r) => r.id === id)?.name || "—");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-roseDark">📝 משימות</h2>
        {!readOnly && <button className="btn-soft" onClick={() => setAdding(true)}>+ משימה חדשה</button>}
      </div>

      {visibleTasks.length === 0 && <p className="text-sm text-ink/50">אין משימות עדיין.</p>}

      {visibleTasks.map((t) => {
        const cand = t.candidateId ? candById(t.candidateId) : null;
        const canSee = isAdmin || managedByMe(cand);
        const rep = cand ? data.reps.find((r) => r.id === cand.assignedRep) : null;
        const phone = ((canSee && cand?.phone) ? cand.phone : rep?.phone || "").replace(/[^0-9]/g, "");
        return (
          <div key={t.id} className="card space-y-2">
            <div className="flex items-center gap-3">
              <input type="checkbox" checked={t.done} disabled={readOnly} onChange={(e) => updateTask(t.id, { done: e.target.checked })} className="h-5 w-5 accent-rose" />
              <div className="flex-1">
                <p className={`font-medium ${t.done ? "text-ink/40 line-through" : "text-ink"}`}>{t.title}</p>
                {t.dueDate && <p className="text-xs text-ink/50">תאריך יעד: {t.dueDate} · {toHebrewDate(t.dueDate)}</p>}
                {isAdmin && <p className="text-xs text-ink/50">משויך ל: {repName(t.repId)}</p>}
              </div>
              {!readOnly && <button className="text-roseDark" onClick={() => { if (confirm("למחוק משימה?")) deleteTask(t.id); }}>🗑️</button>}
            </div>

            {/* משימה משויכת למועמד - פרטים בולטים + פעולות מהירות + צפייה בכרטיס */}
            {cand && (
              <div className="rounded-2xl bg-blush/40 p-3">
                <p className="text-sm font-bold text-roseDark">👤 {cand.fullName}</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {phone && <a className="btn-soft !px-2.5 !py-1 text-xs" href={`tel:${phone}`}>📞 חיוג</a>}
                  {phone && <a className="btn-soft !px-2.5 !py-1 text-xs" href={`https://wa.me/${phone}`} target="_blank" rel="noreferrer">🟢 וואטסאפ</a>}
                  {!phone && <span className="text-xs text-ink/40">אין טלפון זמין</span>}
                </div>
                <div className="mt-2">
                  <CandidateCard
                    candidate={cand}
                    openQuestions={data.openQuestions}
                    reps={data.reps}
                    canEdit={isAdmin || (managedByMe(cand) && !readOnly)}
                    canSeeSensitive={canSee}
                    currentRepId={user.repId || "admin"}
                    isAdmin={isAdmin}
                    locked={!!cand.restricted && !(isAdmin || managedByMe(cand))}
                    onUpdate={updateCandidate}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}

      {adding && (
        <Modal title="משימה חדשה" onClose={() => setAdding(false)}>
          <div className="space-y-4">
            <div>
              <label className="field-label">תיאור המשימה</label>
              <input className="field-input" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            {isAdmin && (
              <div>
                <label className="field-label">שיוך לנציג/ה</label>
                <select className="field-input" value={assignRep} onChange={(e) => setAssignRep(e.target.value)}>
                  <option value="admin">כללי / לעצמי (מנהלת)</option>
                  {data.reps.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="field-label">שיוך למועמד/ת (לא חובה)</label>
              <SearchSelect
                value={candidateId}
                placeholder="ללא מועמד/ת מקושר/ת"
                options={[{ id: "", label: "— ללא —" }, ...data.candidates.map((c) => ({ id: c.id, label: c.fullName }))]}
                onChange={(id) => setCandidateId(id)}
              />
            </div>
            <div>
              <label className="field-label">תאריך יעד</label>
              <DateField value={dueDate} onChange={(v) => setDueDate(v)} />
            </div>
            <button className="btn-primary w-full" onClick={create}>הוספה</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
