"use client";

import { useData } from "../lib/useData";
import { CalendarHeart, MapPin } from "lucide-react";

// אזור "אירועים קרובים" לעמוד התודה. נערך מלוח הבקרה (הגדרות דף ההרשמה).
export default function UpcomingEvents() {
  const data = useData();
  const events = (data?.registration?.events || []).filter((e) => e && (e.title || "").trim());

  return (
    <div className="mt-10 w-full text-right">
      <div className="mb-3 flex items-center justify-center gap-2 text-roseDark">
        <CalendarHeart className="h-5 w-5" strokeWidth={1.75} />
        <h2 className="text-lg font-bold">אירועים קרובים</h2>
      </div>

      {events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-sand bg-white/60 p-5 text-center text-sm text-ink/50">
          בקרוב נעדכן כאן על מפגשים ואירועים שהציבור מוזמן אליהם. 💫
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((e, i) => (
            <div key={i} className="card text-right">
              <p className="font-bold text-ink">{e.title}</p>
              {e.when && <p className="mt-0.5 text-sm text-roseDark">{e.when}</p>}
              {e.place && (
                <p className="mt-0.5 flex items-center justify-end gap-1 text-sm text-ink/60">
                  {e.place} <MapPin className="h-4 w-4" strokeWidth={1.75} />
                </p>
              )}
              {e.note && <p className="mt-1 whitespace-pre-wrap text-sm text-ink/70">{e.note}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
