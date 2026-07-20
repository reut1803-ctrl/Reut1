"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Check, Megaphone } from "lucide-react";
import { useCrmStore } from "@/lib/crm/store";
import { STAFF_USERS } from "@/lib/crm/mockData";
import Button from "@/components/crm/ui/Button";

export default function TasksPage() {
  const role = useCrmStore((s) => s.role);
  const currentStaffId = useCrmStore((s) => s.currentStaffId);
  const tasks = useCrmStore((s) => s.tasks);
  const toggleTaskDone = useCrmStore((s) => s.toggleTaskDone);
  const addTask = useCrmStore((s) => s.addTask);
  const pushTaskToStaff = useCrmStore((s) => s.pushTaskToStaff);
  const markTasksSeenByStaff = useCrmStore((s) => s.markTasksSeenByStaff);
  const allCandidates = useCrmStore((s) => s.allCandidates);
  const customCandidates = useCrmStore((s) => s.customCandidates);
  const candidates = useMemo(
    () => [...allCandidates("male"), ...allCandidates("female")],
    [allCandidates, customCandidates]
  );
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [owner, setOwner] = useState("");
  const [assigneeId, setAssigneeId] = useState(STAFF_USERS[0].id);
  const [candidateId, setCandidateId] = useState("");

  useEffect(() => {
    if (role === "staff") markTasksSeenByStaff(currentStaffId);
  }, [role, currentStaffId, markTasksSeenByStaff]);

  if (role !== "staff" && role !== "admin") {
    return <p className="px-4 py-10 text-center text-sm text-[#8A8285]">אזור זה זמין לצוות בלבד</p>;
  }

  const open = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);
  const pushedToMe = role === "staff" ? open.filter((t) => t.pushedByAdmin && t.assigneeId === currentStaffId) : [];
  const otherOpen = role === "staff" ? open.filter((t) => !(t.pushedByAdmin && t.assigneeId === currentStaffId)) : open;

  const handleAdd = () => {
    if (!title.trim()) return;
    if (role === "admin") {
      pushTaskToStaff(title.trim(), dueDate || null, assigneeId, candidateId || null);
    } else {
      addTask({ title: title.trim(), dueDate: dueDate || null, owner: owner.trim() || "לא משויך" });
    }
    setTitle("");
    setDueDate("");
    setOwner("");
    setCandidateId("");
  };

  return (
    <div className="px-4 py-6">
      <h1 className="text-xl font-bold text-[#3A3335]">משימות</h1>
      <p className="mt-1 text-[13px] text-[#8A8285]">{open.length} משימות פתוחות</p>

      <div className="mt-4 rounded-3xl border border-[#EAE5E3] bg-white p-4 shadow-[0_4px_18px_rgba(58,51,53,0.06)]">
        <p className="mb-2 text-[13px] font-semibold text-[#3A3335]">{role === "admin" ? "משימה חדשה - שיוך לצוות" : "משימה חדשה"}</p>
        <div className="space-y-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="מה צריך לעשות?"
            className="w-full rounded-xl border border-[#EAE5E3] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#8C4A55]"
          />
          <div className="flex gap-2">
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="flex-1 rounded-xl border border-[#EAE5E3] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#8C4A55]"
            />
            {role === "admin" ? (
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="flex-1 rounded-xl border border-[#EAE5E3] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#8C4A55]"
              >
                {STAFF_USERS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="אחראי/ת"
                className="flex-1 rounded-xl border border-[#EAE5E3] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#8C4A55]"
              />
            )}
          </div>
          {role === "admin" && (
            <select
              value={candidateId}
              onChange={(e) => setCandidateId(e.target.value)}
              className="w-full rounded-xl border border-[#EAE5E3] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#8C4A55]"
            >
              <option value="">ללא מועמד/ת מקושר/ת</option>
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  בנוגע ל: {c.name}
                </option>
              ))}
            </select>
          )}
          <Button variant="primary" className="w-full" onClick={handleAdd}>
            {role === "admin" ? <Megaphone size={16} /> : <Plus size={16} />}
            {role === "admin" ? "שיוך משימה לנציגה" : "הוספת משימה"}
          </Button>
        </div>
      </div>

      {pushedToMe.length > 0 && (
        <div className="mt-6">
          <p className="mb-2 flex items-center gap-1.5 text-[13px] font-bold text-[#8C4A55]">
            <Megaphone size={14} /> משימות מהמנהלת
          </p>
          <div className="space-y-2">
            {pushedToMe.map((t) => (
              <TaskRow key={t.id} task={t} onToggle={() => toggleTaskDone(t.id)} highlighted />
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 space-y-2">
        {otherOpen.map((t) => (
          <TaskRow key={t.id} task={t} onToggle={() => toggleTaskDone(t.id)} />
        ))}
        {open.length === 0 && <p className="py-6 text-center text-sm text-[#8A8285]">אין משימות פתוחות 🎉</p>}
      </div>

      {done.length > 0 && (
        <div className="mt-6">
          <p className="mb-2 text-[13px] font-semibold text-[#B5AEB0]">הושלמו</p>
          <div className="space-y-2">
            {done.map((t) => (
              <div key={t.id} className="flex items-center gap-3 rounded-2xl border border-[#EAE5E3] bg-[#F6F5F4] p-3 opacity-70">
                <button
                  onClick={() => toggleTaskDone(t.id)}
                  aria-label="סימון כפתוח"
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#20A66B] text-white"
                >
                  <Check size={14} />
                </button>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#3A3335] line-through">{t.title}</p>
                  <p className="text-[11px] text-[#B5AEB0]">
                    {t.owner} {t.dueDate && `· ${t.dueDate}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TaskRow({ task, onToggle, highlighted }) {
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border p-3 ${
        highlighted ? "border-[#8C4A55] bg-[#F6E4E6]" : "border-[#EAE5E3] bg-white"
      }`}
    >
      <button
        onClick={onToggle}
        aria-label="סימון כהושלם"
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-[#8C4A55]"
      />
      <div className="flex-1">
        <p className="text-sm font-semibold text-[#3A3335]">{task.title}</p>
        <p className="text-[11px] text-[#8A8285]">
          {task.owner} {task.dueDate && `· ${task.dueDate}`} {task.candidateName && `· בנוגע ל${task.candidateName}`}
        </p>
      </div>
    </div>
  );
}
