"use client";

import { useState } from "react";
import Modal from "./Modal";
import CandidateEditor from "./CandidateEditor";
import DateField from "./DateField";
import { updateIntake, approveIntake, deleteIntake, addTask } from "../lib/store";
import { ClipboardCheck, Check, X, Pencil, Phone, MessageSquare, Crown, UserPlus, ListPlus } from "lucide-react";
import WhatsApp from "./icons/WhatsApp";

// תור קליטה (intakeSubmissions) ככלי CRM: יצירת קשר מהירה, שיוך נציג, פתיחת משימה, סיווג ואישור.
export default function IntakePanel({ data }) {
  const items = [...(data.intake || [])].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

  if (items.length === 0) {
    return (
      <div className="card text-center text-sm text-ink/50">
        אין כרגע הרשמות הממתינות לאישור. הרשמות חדשות מהטופס יופיעו כאן.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-blush/50 px-4 py-3">
        <p className="flex items-center gap-2 text-base font-bold text-roseDark">
          <ClipboardCheck className="h-5 w-5" strokeWidth={1.75} /> ממתינים לאישור ({items.length})
        </p>
        <p className="mt-0.5 text-xs text-ink/60">צרו קשר לקביעת שיחת קליטה, שייכו לנציג/ה, פתחו משימה, סווגו, ואשרו למאגר.</p>
      </div>
      {items.map((c) => (
        <IntakeRow key={c.id} c={c} reps={data.reps} openQuestions={data.openQuestions} />
      ))}
    </div>
  );
}

function trackInfo(t) {
  if (t === "personal") return { label: "מסלול אישי", cls: "bg-rose/15 text-roseDark" };
  if (t === "callback") return { label: "נא לחזור אליי", cls: "bg-blue-100 text-blue-700" };
  return { label: "טרם נבחר מסלול", cls: "bg-sand text-ink/50" };
}

function IntakeRow({ c, reps, openQuestions }) {
  const [editing, setEditing] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("שיחת קליטה");
  const [taskRep, setTaskRep] = useState(c.assignedRep || "admin");
  const [taskDue, setTaskDue] = useState("");
  const [flash, setFlash] = useState("");

  const ti = trackInfo(c.track);
  const digits = (c.phone || "").replace(/[^0-9]/g, "");
  const waNum = digits.startsWith("972") ? digits : digits.startsWith("0") ? "972" + digits.slice(1) : digits;
  const waMsg = encodeURIComponent(`שלום ${c.fullName || ""}, מדברים מ"הקהילה איתך" בנוגע להרשמתך 🌸 אפשר לתאם שיחת קליטה קצרה?`);
  const repName = (id) => (id === "admin" ? "מנהלת" : reps.find((r) => r.id === id)?.name || "");

  function note(t) { setFlash(t); setTimeout(() => setFlash(""), 1800); }

  function createTask() {
    addTask({ title: taskTitle.trim() || "שיחת קליטה", repId: taskRep || "admin", dueDate: taskDue, intakeId: c.id });
    setTaskOpen(false);
    setTaskDue("");
    setTaskTitle("שיחת קליטה");
    note("המשימה נפתחה ✓");
  }

  return (
    <div className="space-y-2.5 rounded-2xl border border-sand bg-white/80 p-3">
      {/* שם + מסלול */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-bold text-ink">{c.fullName || "ללא שם"}</span>
        <span className="text-sm text-ink/60">· {c.gender === "female" ? "בחורה" : "בחור"}{c.age ? ` · גיל ${c.age}` : ""}</span>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${ti.cls}`}>{ti.label}</span>
        {c.goldFrame && <span className="flex items-center gap-1 rounded-full bg-amber-200 px-2.5 py-0.5 text-xs font-bold text-amber-800"><Crown className="h-3.5 w-3.5" strokeWidth={2} /> מסגרת זהב</span>}
      </div>

      {/* יצירת קשר מהירה */}
      {digits ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-ink/70" dir="ltr">{c.phone}</span>
          <a className="btn-soft !px-3 !py-1.5 text-xs" href={`https://wa.me/${waNum}?text=${waMsg}`} target="_blank" rel="noreferrer"><WhatsApp size={15} className="text-green-600" /> וואטסאפ</a>
          <a className="btn-soft !px-3 !py-1.5 text-xs" href={`tel:${digits}`}><Phone className="h-3.5 w-3.5" strokeWidth={1.75} /> חיוג</a>
          <a className="btn-soft !px-3 !py-1.5 text-xs" href={`sms:${digits}`}><MessageSquare className="h-3.5 w-3.5" strokeWidth={1.75} /> SMS</a>
        </div>
      ) : (
        <p className="text-xs text-ink/40">לא נמסר טלפון.</p>
      )}

      {/* שיוך לנציג/ה */}
      <div className="flex items-center gap-2">
        <UserPlus className="h-4 w-4 shrink-0 text-ink/40" strokeWidth={1.75} />
        <select
          className="field-input !py-2 text-sm"
          value={c.assignedRep || ""}
          onChange={(e) => { updateIntake(c.id, { assignedRep: e.target.value }); note("השיוך עודכן ✓"); }}
        >
          <option value="">ללא שיוך נציג/ה</option>
          {reps.map((r) => <option key={r.id} value={r.id}>{r.name}{r.institution ? ` · ${r.institution}` : ""}</option>)}
        </select>
      </div>

      {/* פעולות */}
      <div className="flex flex-wrap gap-2 pt-0.5">
        <button className="btn-primary !py-2" onClick={() => approveIntake(c.id)}><Check className="h-4 w-4" strokeWidth={2} /> אשר והכנס למאגר</button>
        <button className="btn-soft !py-2" onClick={() => setTaskOpen((v) => !v)}><ListPlus className="h-4 w-4" strokeWidth={1.75} /> פתח משימה</button>
        <button className="btn-soft !py-2" onClick={() => setEditing(true)}><Pencil className="h-4 w-4" strokeWidth={1.75} /> צפייה / עריכה</button>
        <button className="btn-soft !py-2" onClick={() => { updateIntake(c.id, { goldFrame: !c.goldFrame }); }}><Crown className="h-4 w-4" strokeWidth={1.75} /> {c.goldFrame ? "הסר מסגרת זהב" : "סמן מסגרת זהב"}</button>
        <button className="btn-soft !py-2 text-roseDark" onClick={() => { if (confirm(`לדחות ולמחוק את ההרשמה של "${c.fullName}"?`)) deleteIntake(c.id); }}><X className="h-4 w-4" strokeWidth={2} /> דחייה</button>
      </div>

      {flash && <p className="text-sm font-semibold text-green-600">{flash}</p>}

      {/* טופס פתיחת משימה */}
      {taskOpen && (
        <div className="space-y-2 rounded-2xl bg-blush/40 p-3">
          <p className="text-sm font-bold text-roseDark">פתיחת משימה</p>
          <input className="field-input !py-2 text-sm" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="תיאור המשימה" />
          <select className="field-input !py-2 text-sm" value={taskRep} onChange={(e) => setTaskRep(e.target.value)}>
            <option value="admin">לעצמי (מנהלת)</option>
            {reps.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <DateField value={taskDue} onChange={setTaskDue} />
          <div className="flex gap-2">
            <button className="btn-primary !py-2 text-sm" onClick={createTask}>יצירת המשימה</button>
            <button className="btn-soft !py-2 text-sm" onClick={() => setTaskOpen(false)}>ביטול</button>
          </div>
          <p className="text-[11px] text-ink/50">המשימה תכלול כפתור "צפייה בכרטיס" כדי לראות את פרטי המועמד/ת בזמן השיחה.</p>
        </div>
      )}

      {/* צפייה / עריכה מלאה */}
      {editing && (
        <Modal title={`קליטה — ${c.fullName || ""}`} onClose={() => setEditing(false)}>
          <CandidateEditor
            initial={c}
            openQuestions={openQuestions}
            reps={reps}
            isAdmin
            onSave={(form) => updateIntake(c.id, form).then(() => setEditing(false))}
            onCancel={() => setEditing(false)}
          />
        </Modal>
      )}
    </div>
  );
}
