"use client";

import { useState } from "react";
import Modal from "./Modal";
import DateField from "./DateField";
import SearchSelect from "./SearchSelect";
import CandidateCard from "./CandidateCard";
import { toHebrewDate } from "../lib/dates";
import { addTask, updateTask, deleteTask, updateCandidate, updateIntake, teamRepIds } from "../lib/store";
import { ClipboardList, Trash2, UserRound, Phone, MessageSquare } from "lucide-react";
import WhatsApp from "./icons/WhatsApp";

// ===== שליטה בהדגשה: משימות המשויכות למזהה הזה יודגשו בבירור בלוח =====
// "admin2" = המנהלת הנוספת · "admin" = המנהלת הראשית · מזהה נציג/ה · "" = בלי הדגשה.
const HIGHLIGHT_REP_ID = "admin2";

export default function TasksPanel({ data, user, readOnly = false }) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assignRep, setAssignRep] = useState(user.repId || "admin");
  const [candidateId, setCandidateId] = useState("");

  const isAdmin = user.role === "admin";
  // מרחב עבודה משותף לצוות: המזהים ש"נחשבים אני" (הנציג/ה + חברי הצוות לפי agency_name).
  // בלי שם צוות זה בדיוק { user.repId } — ההתנהגות הקיימת ללא שינוי.
  const myTeamIds = teamRepIds(user.repId, data.reps);
  const managedByMe = (c) => {
    if (!user.repId || !c) return false;
    if (myTeamIds.has(c.assignedRep)) return true;
    const owner = data.reps.find((r) => r.id === c.assignedRep);
    return !!(owner && (owner.coveredBy || []).includes(user.repId));
  };

  // מנהלת רואה הכל; נציג רואה משימות המשויכות אליו או לחבר/ת צוות שלו (agency_name).
  // משימות המשויכות למנהלת/מנהלת-נוספת (admin/admin2) נשארות אצלן בלבד.
  const visibleTasks = data.tasks.filter((t) =>
    isAdmin ? true : myTeamIds.has(t.repId)
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
  const hasAdmin2 = !!(data.admin2Name || data.admin2Password);
  const admin2Label = data.admin2Name || "מנהלת נוספת";
  const repName = (id) =>
    id === "admin" ? "מנהלת" : id === "admin2" ? admin2Label : data.reps.find((r) => r.id === id)?.name || "—";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold text-roseDark"><ClipboardList className="h-5 w-5" strokeWidth={1.75} /> משימות</h2>
        {!readOnly && <button className="btn-soft" onClick={() => setAdding(true)}>+ משימה חדשה</button>}
      </div>

      {visibleTasks.length === 0 && <p className="text-sm text-ink/50">אין משימות עדיין.</p>}

      {visibleTasks.map((t) => {
        const cand = t.candidateId ? candById(t.candidateId) : null;
        // משימת קליטה - משויכת לנרשם/ת שעדיין בתור הממתינים (intakeSubmissions).
        const intakeItem = t.intakeId ? (data.intake || []).find((x) => x.id === t.intakeId) : null;
        const person = cand || intakeItem;
        const isIntake = !cand && !!intakeItem;
        const canSee = isAdmin || managedByMe(person);
        const rep = person ? data.reps.find((r) => r.id === person.assignedRep) : null;
        const phone = ((canSee && person?.phone) ? person.phone : rep?.phone || "").replace(/[^0-9]/g, "");
        const waNum = phone.startsWith("972") ? phone : phone.startsWith("0") ? "972" + phone.slice(1) : phone;
        // הדגשה: משימה המשויכת למזהה שבחרנו ב-HIGHLIGHT_REP_ID (למשל המנהלת הנוספת).
        const highlighted = !!HIGHLIGHT_REP_ID && t.repId === HIGHLIGHT_REP_ID;
        return (
          <div
            key={t.id}
            className={`card space-y-2 transition-shadow ${
              highlighted
                ? "ring-2 ring-[#7a2e3b]/55 shadow-[0_0_0_4px_rgba(231,166,122,0.3),0_10px_26px_rgba(122,46,59,0.16)]"
                : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <input type="checkbox" checked={t.done} disabled={readOnly} onChange={(e) => updateTask(t.id, { done: e.target.checked })} className="h-5 w-5 accent-rose" />
              <div className="flex-1">
                <p className={`font-medium ${t.done ? "text-ink/40 line-through" : "text-ink"}`}>{t.title}</p>
                {t.dueDate && <p className="text-xs text-ink/50">תאריך יעד: {t.dueDate} · {toHebrewDate(t.dueDate)}</p>}
                {isAdmin && (
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-ink/50">
                    <span className="shrink-0">משויך ל:</span>
                    {readOnly ? (
                      <span>{repName(t.repId)}</span>
                    ) : (
                      <select
                        value={t.repId || "admin"}
                        onChange={(e) => updateTask(t.id, { repId: e.target.value })}
                        className="rounded-lg border border-sand bg-white/80 px-1.5 py-0.5 text-xs text-ink outline-none focus:border-rose"
                      >
                        <option value="admin">מנהלת</option>
                        {hasAdmin2 && <option value="admin2">{admin2Label}</option>}
                        {data.reps.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                      </select>
                    )}
                  </div>
                )}
              </div>
              {!readOnly && <button className="text-roseDark" onClick={() => { if (confirm("למחוק משימה?")) deleteTask(t.id); }}><Trash2 className="h-4 w-4" strokeWidth={1.75} /></button>}
            </div>

            {/* משימה משויכת לאדם (מועמד/ת במאגר או נרשם/ת בקליטה) - פרטים + קשר מהיר + צפייה בכרטיס */}
            {person && (
              <div className="rounded-2xl bg-blush/40 p-3">
                <p className="flex flex-wrap items-center gap-1.5 text-sm font-bold text-roseDark">
                  <UserRound className="h-4 w-4" strokeWidth={1.75} /> {person.fullName}
                  {isIntake && <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[11px] font-bold text-amber-800">בקליטה</span>}
                </p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {phone && <a className="btn-soft !px-2.5 !py-1 text-xs" href={`tel:${phone}`}><Phone className="h-3.5 w-3.5" strokeWidth={1.75} /> חיוג</a>}
                  {phone && <a className="btn-soft !px-2.5 !py-1 text-xs" href={`sms:${phone}`}><MessageSquare className="h-3.5 w-3.5" strokeWidth={1.75} /> SMS</a>}
                  {phone && <a className="btn-soft !px-2.5 !py-1 text-xs" href={`https://wa.me/${waNum}`} target="_blank" rel="noreferrer"><WhatsApp size={14} className="text-green-600" /> וואטסאפ</a>}
                  {!phone && <span className="text-xs text-ink/40">אין טלפון זמין</span>}
                </div>
                <div className="mt-2">
                  <CandidateCard
                    candidate={person}
                    openQuestions={data.openQuestions}
                    reps={data.reps}
                    canEdit={isAdmin || (managedByMe(person) && !readOnly)}
                    canSeeSensitive={canSee}
                    currentRepId={user.repId || "admin"}
                    isAdmin={isAdmin}
                    locked={!isIntake && !!person.restricted && !(isAdmin || managedByMe(person))}
                    onUpdate={isIntake ? updateIntake : updateCandidate}
                  />
                </div>
              </div>
            )}
            {!person && (t.candidateId || t.intakeId) && (
              <p className="rounded-2xl bg-sand/40 p-3 text-xs text-ink/40">הכרטיס אינו זמין (ייתכן שאושר למאגר או נמחק).</p>
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
                  {hasAdmin2 && <option value="admin2">{admin2Label} (מנהלת נוספת)</option>}
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
            <div className="modal-footer">
              <button className="btn-primary w-full" onClick={create}>הוספה</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
