"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRows } from "@/lib/tripContext";
import { caToDate } from "@/lib/time";
import Icon from "./Icon";

type Act = { id: string; date: string; time: string; title: string; status?: string; reminder?: number };

const KEY = "ct-dismissed";
function readDismissed(): string[] {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}

// שעון מעורר פנימי: כשמגיע הזמן להתכונן לפעילות — קופצת הודעה בתוך האפליקציה.
export default function Reminders() {
  const acts = useRows<Act>("activities");
  const [now, setNow] = useState(Date.now());
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    setDismissed(readDismissed());
    const t = setInterval(() => setNow(Date.now()), 20000);
    return () => clearInterval(t);
  }, []);

  const due = (acts ?? []).filter((a) => {
    if (!a.reminder || a.status === "done" || a.status === "paused" || !a.date || !a.time) return false;
    const at = caToDate(a.date, a.time).getTime();
    const key = `${a.id}@${a.date}T${a.time}`;
    return now >= at - a.reminder * 60000 && now < at + 15 * 60000 && !dismissed.includes(key);
  });

  useEffect(() => {
    if (due.length && "vibrate" in navigator) navigator.vibrate?.([120, 80, 120]);
  }, [due.length]);

  if (!due.length) return null;
  const a = due[0];
  const mins = Math.round((caToDate(a.date, a.time).getTime() - now) / 60000);
  const dismiss = () => {
    const key = `${a.id}@${a.date}T${a.time}`;
    const next = [...dismissed, key].slice(-200);
    setDismissed(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* */ }
  };
  return (
    <div className="toast glass" role="alert">
      <span className="toast-icon"><Icon name="bell" /></span>
      <div className="toast-body">
        <strong>{a.title}</strong>
        <span>{mins > 0 ? `בעוד ${mins} דקות (${a.time})` : `עכשיו (${a.time})`}</span>
      </div>
      <Link className="toast-link" href="/plan" onClick={dismiss}>למסלול</Link>
      <button type="button" className="toast-x" onClick={dismiss} aria-label="סגירה">×</button>
    </div>
  );
}
