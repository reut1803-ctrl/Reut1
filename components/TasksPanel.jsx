"use client";

import { useState } from "react";
import Modal from "./Modal";
import DateField from "./DateField";
import { toHebrewDate } from "../lib/dates";
import { addTask, updateTask, deleteTask } from "../lib/store";

export default function TasksPanel({ data, user }) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");

  const visibleTasks = data.tasks.filter((t) =>
    user.role === "admin" ? true : t.repId === user.repId
  );

  function create() {
    if (!title.trim()) return;
    addTask({ title, dueDate, repId: user.repId || "admin" });
    setTitle("");
    setDueDate("");
    setAdding(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-roseDark">📝 משימות</h2>
        <button className="btn-soft" onClick={() => setAdding(true)}>+ משימה חדשה</button>
      </div>

      {visibleTasks.length === 0 && <p className="text-sm text-ink/50">אין משימות עדיין.</p>}

      {visibleTasks.map((t) => (
        <div key={t.id} className="card flex items-center gap-3">
          <input type="checkbox" checked={t.done} onChange={(e) => updateTask(t.id, { done: e.target.checked })} className="h-5 w-5 accent-rose" />
          <div className="flex-1">
            <p className={`font-medium ${t.done ? "text-ink/40 line-through" : "text-ink"}`}>{t.title}</p>
            {t.dueDate && <p className="text-xs text-ink/50">תאריך יעד: {t.dueDate} · {toHebrewDate(t.dueDate)}</p>}
          </div>
          <button className="text-roseDark" onClick={() => deleteTask(t.id)}>🗑️</button>
        </div>
      ))}

      {adding && (
        <Modal title="משימה חדשה" onClose={() => setAdding(false)}>
          <div className="space-y-4">
            <div>
              <label className="field-label">תיאור המשימה</label>
              <input className="field-input" value={title} onChange={(e) => setTitle(e.target.value)} />
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
