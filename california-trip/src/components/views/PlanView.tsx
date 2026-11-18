"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRows, useTripCtx, useTripToday } from "@/lib/tripContext";
import { caNow, caToDate, heDate } from "@/lib/time";
import { wazeUrl, type Place } from "@/lib/places";
import Icon from "../app/Icon";
import PlaceSearch from "../app/PlaceSearch";
import DayStrip from "./DayStrip";
import TripDates from "./TripDates";

export type Activity = {
  id: string; date: string; time: string; title: string;
  address?: string; lat?: number; lng?: number;
  status?: "planned" | "paused" | "done"; reminder?: number; notes?: string;
};

const STATUS: Record<string, string> = { planned: "מתוכנן", paused: "מושהה", done: "בוצע" };

function LiveClock() {
  const [n, setN] = useState(caNow());
  useEffect(() => { const t = setInterval(() => setN(caNow()), 15000); return () => clearInterval(t); }, []);
  return (
    <div className="ca-clock">
      <span className="label">עכשיו בקליפורניה</span>
      <strong>{n.time}</strong>
      <span className="label">{heDate(n.date)}</span>
    </div>
  );
}

function ActivityForm({ date, initial, onDone }: { date: string; initial?: Activity; onDone: () => void }) {
  const { store } = useTripCtx();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [d, setD] = useState(initial?.date ?? date);
  const [time, setTime] = useState(initial?.time ?? "10:00");
  const [place, setPlace] = useState<Partial<Place>>({ address: initial?.address, lat: initial?.lat, lng: initial?.lng });
  const [reminder, setReminder] = useState(String(initial?.reminder ?? 30));
  const [busy, setBusy] = useState(false);
  const pre = initial ? `edit-${initial.id}` : "new";

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const data = {
      title: title.trim(), date: d, time, reminder: Number(reminder),
      address: place.address ?? "", lat: place.lat ?? null, lng: place.lng ?? null,
    };
    if (initial) await store.update("activities", initial.id, data);
    else await store.add("activities", { ...data, status: "planned" });
    setBusy(false);
    onDone();
  }

  return (
    <form className="panel glass act-form" onSubmit={save}>
      <h2 className="panel-title">{initial ? "עריכה והזזה" : "פעילות חדשה"}</h2>
      <label className="fld"><span>מה עושים?</span>
        <input id={`${pre}-title`} className="field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="למשל: שקיעה בחוף מליבו" required />
      </label>
      <div className="grid2">
        <label className="fld"><span>יום</span><input id={`${pre}-date`} className="field" type="date" value={d} onChange={(e) => setD(e.target.value)} required /></label>
        <label className="fld"><span>שעה (קליפורניה)</span><input id={`${pre}-time`} className="field" type="time" value={time} onChange={(e) => setTime(e.target.value)} required /></label>
      </div>
      <div className="fld"><span>לאן?</span>
        {place.address ? (
          <div className="picked"><Icon name="pin" /><span>{place.address}</span><button type="button" className="text-btn" onClick={() => setPlace({})}>החלפה</button></div>
        ) : (
          <PlaceSearch idPrefix={`${pre}-place`} onPick={(p) => setPlace(p)} />
        )}
      </div>
      <label className="fld"><span>תזכורת</span>
        <select id={`${pre}-rem`} className="field" value={reminder} onChange={(e) => setReminder(e.target.value)}>
          <option value="0">בלי תזכורת</option>
          <option value="15">רבע שעה לפני</option>
          <option value="30">חצי שעה לפני</option>
          <option value="60">שעה לפני</option>
          <option value="120">שעתיים לפני</option>
        </select>
      </label>
      <div className="row-end">
        <button className="text-btn" type="button" onClick={onDone}>ביטול</button>
        <button className="pill-btn pill-btn--dark" type="submit" disabled={busy}>{busy ? "שומרים…" : "שמירה"}</button>
      </div>
    </form>
  );
}

export default function PlanView() {
  const { tripDoc, store } = useTripCtx();
  const today = useTripToday(tripDoc);
  const [day, setDay] = useState(today);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const acts = useRows<Activity>("activities");
  const lodging = useRows<{ id: string; lodging?: string; lodgingAddress?: string }>("days");

  useEffect(() => { setDay(today); }, [today]);

  const list = (acts ?? []).filter((a) => a.date === day).sort((a, b) => a.time.localeCompare(b.time));
  const sleep = (lodging ?? []).find((l) => l.id === day);
  const now = Date.now();
  const nextId = list.find((a) => a.status !== "done" && a.status !== "paused" && caToDate(a.date, a.time).getTime() > now)?.id;

  return (
    <div className="stack">
      <div className="split">
        <LiveClock />
        <TripDates />
      </div>

      <DayStrip start={tripDoc.startDate} end={tripDoc.endDate} value={day} onChange={setDay} />

      <div className="panel glass sleep-line">
        <Icon name="home" />
        <span>{sleep?.lodging ? <>ישנים ב<strong>{sleep.lodging}</strong></> : "עוד לא נקבע איפה ישנים בלילה הזה"}</span>
        {sleep?.lodging ? null : <Link className="text-btn" href="/packing">הוספה</Link>}
      </div>

      <section className="timeline" aria-label={`פעילויות ב${heDate(day)}`}>
        {acts === null && <p className="hint">טוען…</p>}
        {acts !== null && list.length === 0 && !adding && (
          <div className="empty glass">
            <p>אין עדיין פעילויות ב{heDate(day)}.</p>
          </div>
        )}
        {list.map((a) =>
          editing === a.id ? (
            <ActivityForm key={a.id} date={day} initial={a} onDone={() => setEditing(null)} />
          ) : (
            <article key={a.id} className={`act glass act--${a.status ?? "planned"} ${a.id === nextId ? "act--next" : ""}`}>
              <div className="act-time">{a.time}</div>
              <div className="act-body">
                <h3>{a.title}</h3>
                {a.address && <p className="act-place"><Icon name="pin" />{a.address.split(",").slice(0, 2).join(",")}</p>}
                <div className="act-meta">
                  <span className={`status status--${a.status ?? "planned"}`}>{a.id === nextId ? "הבא בתור" : STATUS[a.status ?? "planned"]}</span>
                  {!!a.reminder && a.status !== "done" && <span className="status"><Icon name="bell" />{a.reminder} דק׳ לפני</span>}
                </div>
                <div className="act-actions">
                  {wazeUrl(a) && (
                    <a className="chip-btn chip-btn--waze" href={wazeUrl(a)!} target="_blank" rel="noopener noreferrer"><Icon name="waze" />ניווט ב-Waze</a>
                  )}
                  {a.status !== "done" && (
                    <button type="button" className="chip-btn" onClick={() => store.update("activities", a.id, { status: "done" })}><Icon name="check" />בוצע</button>
                  )}
                  {a.status === "paused" ? (
                    <button type="button" className="chip-btn" onClick={() => store.update("activities", a.id, { status: "planned" })}><Icon name="play" />חידוש</button>
                  ) : a.status !== "done" ? (
                    <button type="button" className="chip-btn" onClick={() => store.update("activities", a.id, { status: "paused" })}><Icon name="pause" />השהיה</button>
                  ) : (
                    <button type="button" className="chip-btn" onClick={() => store.update("activities", a.id, { status: "planned" })}>החזרה</button>
                  )}
                  <button type="button" className="chip-btn" onClick={() => setEditing(a.id)}><Icon name="move" />הזזה / שינוי</button>
                  <button type="button" className="chip-btn chip-btn--danger" onClick={() => store.remove("activities", a.id)} aria-label="מחיקה"><Icon name="trash" /></button>
                </div>
              </div>
            </article>
          ),
        )}
        {adding ? (
          <ActivityForm date={day} onDone={() => setAdding(false)} />
        ) : (
          <button type="button" className="add-btn glass" onClick={() => setAdding(true)}><Icon name="plus" />הוספת פעילות</button>
        )}
      </section>
    </div>
  );
}
