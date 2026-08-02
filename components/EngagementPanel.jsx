"use client";

import { currentWeekKey } from "../lib/store";

// יעדים שבועיים (לצורך פס ההתקדמות והצבע). ניתן לעדכן בעתיד.
const VIEWS_TARGET = 20;
const PLAYS_TARGET = 10;

function Metric({ label, actual, target }) {
  const pct = target > 0 ? actual / target : 0;
  const width = Math.min(100, Math.round(pct * 100));
  const color = pct >= 1 ? "bg-emerald-500" : pct >= 0.5 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-bold text-ink">{target} / {actual}</span>
        <span className="text-ink/60">{label}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-sand">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

// מעורבות צוות (השבוע) - הרשאת מנהלת בלבד. מציג לכל נציג/ה צפיות בכרטיסים והשמעות הקלטות.
export default function EngagementPanel({ data }) {
  const wk = currentWeekKey();
  const byRep = {};
  (data.engagement || []).forEach((e) => {
    if (e.week === wk) byRep[e.repId] = e;
  });

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-roseDark">📊 מעורבות צוות (השבוע)</h2>
      <p className="text-xs text-ink/60">מספר הצפיות בכרטיסים וההשמעות של כל נציג/ה מתחילת השבוע (יום ראשון).</p>
      {data.reps.length === 0 && <p className="text-sm text-ink/40">אין נציגים.</p>}
      {data.reps.map((rep) => {
        const e = byRep[rep.id] || {};
        return (
          <div key={rep.id} className="card space-y-3">
            <p className="font-bold text-ink">
              {rep.name}
              {rep.readOnly && <span className="mr-1 text-xs font-normal text-amber-700"> · 🔒 בחופשה</span>}
            </p>
            <Metric label="צפיות בכרטיסי מועמדים" actual={e.views || 0} target={VIEWS_TARGET} />
            <Metric label="השמעות הקלטות היכרות" actual={e.plays || 0} target={PLAYS_TARGET} />
          </div>
        );
      })}
    </div>
  );
}
