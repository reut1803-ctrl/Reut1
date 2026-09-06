"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Check, Megaphone, Phone, ChevronLeft } from "lucide-react";
import { useCrmStore, allowlistEmail } from "@/lib/crm/store";
import Button from "@/components/crm/ui/Button";
import SearchableSelect from "@/components/crm/ui/SearchableSelect";

export default function TasksPage() {
  const role = useCrmStore((s) => s.role);
  const currentStaffEmail = useCrmStore((s) => s.currentStaffEmail);
  const tasks = useCrmStore((s) => s.tasks);
  const toggleTaskDone = useCrmStore((s) => s.toggleTaskDone);
  const addTask = useCrmStore((s) => s.addTask);
  const pushTaskToStaff = useCrmStore((s) => s.pushTaskToStaff);
  const markTasksSeenByStaff = useCrmStore((s) => s.markTasksSeenByStaff);
  const allCandidates = useCrmStore((s) => s.allCandidates);
  const candidates_ = useCrmStore((s) => s.candidates);
  const staffList = useCrmStore((s) => s.staffList());
  const currentUser = useCrmStore((s) => s.currentUser);
  const showToast = useCrmStore((s) => s.showToast);
  const candidates = useMemo(
    () => [...allCandidates("male"), ...allCandidates("female")],
    [allCandidates, candidates_]
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [owner, setOwner] = useState("");
  const [assigneeId, setAssigneeId] = useState(allowlistEmail(staffList[0]) || "");
  const [candidateId, setCandidateId] = useState("");

  useEffect(() => {
    if (role === "staff") markTasksSeenByStaff(currentStaffEmail);
  }, [role, currentStaffEmail, markTasksSeenByStaff]);

  // רשימת הצוות נטענת מהשרת אחרי הרינדור הראשון, ולכן בוחרים נציגה ראשונה כשהיא מגיעה
  useEffect(() => {
    if (!assigneeId && staffList.length > 0) setAssigneeId(allowlistEmail(staffList[0]));
  }, [assigneeId, staffList]);

  if (role !== "staff" && role !== "admin") {
    return <p className="px-4 py-10 text-center text-sm text-[#8C7B6B]">אזור זה זמין לצוות בלבד</p>;
  }

  // המנהלת רואה את כל המשימות. אשת צוות רואה אך ורק את המשימות שמשויכות אליה -
  // גם בשאילתה מול השרת וגם כאן בתצוגה, כדי שמשימות של אחרות לא יתערבבו לעולם.
  const visibleTasks = role === "admin" ? tasks : tasks.filter((t) => t.assigneeId === currentStaffEmail);
  const open = visibleTasks.filter((t) => !t.done);
  const done = visibleTasks.filter((t) => t.done);
  const pushedToMe = role === "staff" ? open.filter((t) => t.pushedByAdmin && t.assigneeId === currentStaffEmail) : [];
  const otherOpen = role === "staff" ? open.filter((t) => !(t.pushedByAdmin && t.assigneeId === currentStaffEmail)) : open;

  const handleAdd = () => {
    if (!title.trim()) return;
    if (role === "admin") {
      // בלי נציגה משויכת המשימה לא תגיע לאף אחת, ולכן חוסמים יצירה כזו
      if (!assigneeId) {
        showToast("יש לבחור נציגה לשיוך המשימה");
        return;
      }
      pushTaskToStaff(title.trim(), dueDate.trim() || null, assigneeId, candidateId || null, description.trim());
    } else {
      // משימה שאשת צוות יוצרת לעצמה משויכת אליה, כדי שתראה אותה במסך שלה
      addTask({
        title: title.trim(),
        description: description.trim(),
        dueDate: dueDate.trim() || null,
        owner: owner.trim() || currentUser().name,
        assigneeId: currentStaffEmail || "",
      });
    }
    setTitle("");
    setDescription("");
    setDueDate("");
    setOwner("");
    setCandidateId("");
  };

  return (
    <div className="px-4 py-6">
      <h1 className="text-xl font-bold text-[#5A4A3C]">משימות</h1>
      <p className="mt-1 text-[13px] text-[#8C7B6B]">{open.length} משימות פתוחות</p>

      <div className="mt-4 rounded-3xl border border-[#EADCCB] bg-white p-4 shadow-[0_4px_18px_rgba(58,51,53,0.06)]">
        <p className="mb-2 text-[13px] font-semibold text-[#5A4A3C]">{role === "admin" ? "משימה חדשה - שיוך לצוות" : "משימה חדשה"}</p>
        <div className="space-y-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="מה צריך לעשות?"
            className="w-full rounded-xl border border-[#EADCCB] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#C06E5E]"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="פירוט ודגשים (לא חובה)"
            className="w-full resize-y rounded-xl border border-[#EADCCB] bg-white px-3 py-2.5 text-sm leading-relaxed outline-none focus:border-[#C06E5E]"
          />
          <div className="flex gap-2">
            <input
              type="text"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              placeholder="תאריך (למשל: כ' בחשוון)"
              className="flex-1 rounded-xl border border-[#EADCCB] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#C06E5E]"
            />
            {role === "admin" ? (
              <SearchableSelect
                className="flex-1"
                value={assigneeId}
                onChange={setAssigneeId}
                placeholder="בחירת נציגה..."
                emptyText="לא נמצאה נציגה בשם הזה"
                options={staffList.map((s) => ({ value: allowlistEmail(s), label: s.name || allowlistEmail(s) }))}
              />
            ) : (
              <input
                type="text"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="אחראי/ת"
                className="flex-1 rounded-xl border border-[#EADCCB] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#C06E5E]"
              />
            )}
          </div>
          {role === "admin" && (
            <SearchableSelect
              value={candidateId}
              onChange={setCandidateId}
              placeholder="ללא מועמד/ת מקושר/ת"
              emptyText="לא נמצא מועמד/ת בשם הזה"
              options={candidates.map((c) => ({ value: c.id, label: `בנוגע ל: ${c.name}` }))}
            />
          )}
          <Button variant="primary" className="w-full" onClick={handleAdd}>
            {role === "admin" ? <Megaphone size={16} /> : <Plus size={16} />}
            {role === "admin" ? "שיוך משימה לנציגה" : "הוספת משימה"}
          </Button>
        </div>
      </div>

      {pushedToMe.length > 0 && (
        <div className="mt-6">
          <p className="mb-2 flex items-center gap-1.5 text-[13px] font-bold text-[#C06E5E]">
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
        {open.length === 0 && <p className="py-6 text-center text-sm text-[#8C7B6B]">אין משימות פתוחות 🎉</p>}
      </div>

      {done.length > 0 && (
        <div className="mt-6">
          <p className="mb-2 text-[13px] font-semibold text-[#C3B5A5]">הושלמו</p>
          <div className="space-y-2">
            {done.map((t) => (
              <div key={t.id} className="flex items-center gap-3 rounded-2xl border border-[#EADCCB] bg-[#FBF3EA] p-3 opacity-70">
                <button
                  onClick={() => toggleTaskDone(t.id)}
                  aria-label="סימון כפתוח"
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#8C9A78] text-white"
                >
                  <Check size={14} />
                </button>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#5A4A3C] line-through">{t.title}</p>
                  {t.description && <p className="mt-0.5 text-[12px] text-[#C3B5A5]">{t.description}</p>}
                  <p className="text-[11px] text-[#C3B5A5]">
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
  const findCandidateById = useCrmStore((s) => s.findCandidateById);
  const candidate = task.candidateId ? findCandidateById(task.candidateId) : null;

  return (
    <div
      className={`rounded-2xl border p-3 ${highlighted ? "border-[#C06E5E] bg-[#F7DFD8]" : "border-[#EADCCB] bg-white"}`}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onToggle}
          aria-label="סימון כהושלם"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-[#C06E5E]"
        />
        <div className="flex-1">
          <p className="text-sm font-semibold text-[#5A4A3C]">{task.title}</p>
          {task.description && (
            <p className="mt-0.5 whitespace-pre-line text-[12px] leading-relaxed text-[#6B6265]">{task.description}</p>
          )}
          <p className="mt-0.5 text-[11px] text-[#8C7B6B]">
            {task.owner} {task.dueDate && `· ${task.dueDate}`} {candidate && `· בנוגע ל${candidate.name}`}
          </p>
        </div>
      </div>

      {candidate && (
        <div className="mt-2 flex items-center justify-between gap-2 rounded-xl bg-white px-3 py-2 text-[12px] shadow-sm">
          <Link href={`/crm?openCandidate=${candidate.id}`} className="flex items-center gap-1.5 font-semibold text-[#C06E5E]">
            צפייה בכרטיס {candidate.name} <ChevronLeft size={13} />
          </Link>
          {candidate.phone && (
            <a
              href={`tel:${candidate.phone}`}
              dir="ltr"
              className="flex items-center gap-1 rounded-lg bg-[#FBF3EA] px-2 py-1 font-semibold text-[#5A4A3C]"
            >
              <Phone size={12} /> {candidate.phone}
            </a>
          )}
        </div>
      )}
    </div>
  );
}
