"use client";

import { useEffect, useState } from "react";
import { currentWeekKey } from "../lib/store";

// יעדים שבועיים (לצורך פס ההתקדמות). ניתן לעדכן בעתיד.
const VIEWS_TARGET = 20;
const PLAYS_TARGET = 10;

// צבע הבורדו של המותג למילוי הפעיל (זהה לכפתור ההקלטה). נשמר כ-style ישיר
// כדי שהמילוי תמיד יוצג, ללא תלות במחלקות Tailwind שעלולות להיחסם.
const BRAND_BURGUNDY = "#7a2e3b";

function Metric({ label, actual, target }) {
  // חישוב בטוח: מגינים מפני ערכים חסרים/לא-מספריים, יעד 0, וחריגה מ-100%.
  const safeActual = Number(actual) || 0;
  const safeTarget = Number(target) > 0 ? Number(target) : 1;
  const pct = Math.max(0, Math.min(100, Math.round((safeActual / safeTarget) * 100)));

  // אנימציית מילוי בטעינת המסך: הפס מתחיל מ-0 ומתמלא בחלקות לרוחב האמיתי.
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 80);
    return () => clearTimeout(t);
  }, [pct]);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-bold text-ink">{target} / {actual}</span>
        <span className="text-ink/60">{label}</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-sand">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${width}%`, backgroundColor: BRAND_BURGUNDY }}
        />
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
