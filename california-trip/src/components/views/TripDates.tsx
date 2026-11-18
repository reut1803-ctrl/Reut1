"use client";

import { useState, type FormEvent } from "react";
import { useTripCtx } from "@/lib/tripContext";
import { heDate } from "@/lib/time";

export default function TripDates() {
  const { tripDoc, store } = useTripCtx();
  const [editing, setEditing] = useState(false);
  const [start, setStart] = useState(tripDoc.startDate ?? "");
  const [end, setEnd] = useState(tripDoc.endDate ?? "");
  const [err, setErr] = useState<string | null>(null);
  const has = tripDoc.startDate && tripDoc.endDate;

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!start || !end || end < start) { setErr("תאריך החזרה צריך להיות אחרי תאריך היציאה"); return; }
    await store.updateTrip({ startDate: start, endDate: end });
    setEditing(false);
    setErr(null);
  }

  if (has && !editing) {
    return (
      <div className="panel glass trip-dates">
        <div>
          <span className="label">תאריכי הטיול</span>
          <strong>{heDate(tripDoc.startDate!, { day: "numeric", month: "long" })} – {heDate(tripDoc.endDate!, { day: "numeric", month: "long" })}</strong>
        </div>
        <button className="text-btn" type="button" onClick={() => { setStart(tripDoc.startDate ?? ""); setEnd(tripDoc.endDate ?? ""); setEditing(true); }}>שינוי</button>
      </div>
    );
  }
  return (
    <form className="panel glass" onSubmit={save}>
      <h2 className="panel-title">מתי טסים?</h2>
      <div className="grid2">
        <label className="fld"><span>יוצאים</span><input id="trip-start" className="field" type="date" value={start} onChange={(e) => setStart(e.target.value)} required /></label>
        <label className="fld"><span>חוזרים</span><input id="trip-end" className="field" type="date" value={end} onChange={(e) => setEnd(e.target.value)} required /></label>
      </div>
      {err && <p className="gate-error">{err}</p>}
      <div className="row-end">
        {has && <button className="text-btn" type="button" onClick={() => setEditing(false)}>ביטול</button>}
        <button className="pill-btn pill-btn--dark" type="submit">שמירה</button>
      </div>
    </form>
  );
}
