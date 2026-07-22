"use client";

import { useEffect, useState } from "react";
import { Check, ListTodo } from "lucide-react";
import { useAuth } from "@/lib/supabase/AuthProvider";
import { fetchTasks, createTask, toggleTaskDone } from "@/lib/queries";

export default function TasksPage() {
  const { supabase, user, profile } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(true);

  const canAccess = profile?.role === "staff" || profile?.role === "admin";

  useEffect(() => {
    if (!canAccess) return;
    fetchTasks(supabase).then((t) => {
      setTasks(t);
      setLoading(false);
    });
  }, [supabase, canAccess]);

  const add = async () => {
    if (!title.trim()) return;
    await createTask(supabase, { title: title.trim(), dueDate, createdBy: user.id });
    setTasks(await fetchTasks(supabase));
    setTitle("");
    setDueDate("");
  };

  const toggle = async (task) => {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t)));
    await toggleTaskDone(supabase, task.id, !task.done);
  };

  if (!canAccess) {
    return <p className="px-1 py-10 text-center text-sm text-muted">אזור זה זמין לצוות בלבד</p>;
  }

  const open = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="px-1 text-lg font-extrabold text-ink">משימות</h1>
      <p className="px-1 text-xs text-muted">{open.length} משימות פתוחות</p>

      <div className="card flex flex-col gap-3 p-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder='למשל: "לחזור לאמא של יעל"'
          className="w-full rounded-2xl border border-black/10 bg-white p-3 text-sm outline-none focus:border-pink-400"
        />
        <div className="flex gap-2">
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="flex-1 rounded-2xl border border-black/10 bg-white p-3 text-sm outline-none focus:border-pink-400"
          />
          <button onClick={add} className="btn-pink px-6">
            הוספה
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card py-10 text-center text-sm text-muted">טוען...</div>
      ) : open.length === 0 && done.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 py-10 text-center">
          <ListTodo size={22} className="text-pink-300" />
          <p className="text-sm text-muted">אין משימות עדיין</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {[...open, ...done].map((t) => (
            <div key={t.id} className="card flex items-center gap-3 p-3.5">
              <button
                onClick={() => toggle(t)}
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition ${
                  t.done ? "border-mint-500 bg-mint-500 text-white" : "border-black/15"
                }`}
              >
                {t.done && <Check size={14} />}
              </button>
              <div className="flex-1">
                <p className={`text-sm font-medium ${t.done ? "text-muted line-through" : "text-ink"}`}>{t.title}</p>
                {(t.due_date || t.candidate) && (
                  <p className="text-[11px] text-muted">
                    {t.candidate?.name}
                    {t.candidate && t.due_date ? " · " : ""}
                    {t.due_date}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
