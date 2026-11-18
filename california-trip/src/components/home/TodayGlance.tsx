"use client";

import Link from "next/link";
import { useRows, useTripCtx, useTripToday } from "@/lib/tripContext";
import { caToDate, heDate } from "@/lib/time";
import { wazeUrl } from "@/lib/places";
import Icon from "../app/Icon";
import type { Activity } from "../views/PlanView";

type Day = { id: string; lodging?: string; lodgingAddress?: string; lat?: number; lng?: number };
type Expense = { id: string; date: string; amount: number };
type Item = { id: string; checked?: boolean };

const usd = (n: number) => "$" + Math.round(n).toLocaleString("en-US");

// "היום שלנו": תמונת מצב חיה של היום — לא תפריט נוסף, אלא מידע.
export default function TodayGlance() {
  const { tripDoc } = useTripCtx();
  const today = useTripToday(tripDoc);
  const acts = useRows<Activity>("activities");
  const days = useRows<Day>("days");
  const expenses = useRows<Expense>("expenses");
  const packing = useRows<Item>("packing");

  const now = Date.now();
  const next = (acts ?? [])
    .filter((a) => a.date === today && a.status !== "done" && a.status !== "paused" && caToDate(a.date, a.time).getTime() > now - 30 * 60000)
    .sort((a, b) => a.time.localeCompare(b.time))[0];
  const sleep = (days ?? []).find((d) => d.id === today);
  const budget = tripDoc.dailyBudget ?? 0;
  const spent = (expenses ?? []).filter((e) => e.date === today).reduce((s, e) => s + Number(e.amount || 0), 0);
  const packed = (packing ?? []).filter((i) => i.checked).length;
  const total = (packing ?? []).length;
  const nextWaze = next ? wazeUrl(next) : null;
  const sleepWaze = sleep?.lodging ? wazeUrl({ lat: sleep.lat, lng: sleep.lng, address: sleep.lodgingAddress || sleep.lodging }) : null;

  return (
    <section className="today section" aria-labelledby="today-title">
      <div className="section-head reveal">
        <p className="eyebrow-home">{heDate(today)}</p>
        <h2 id="today-title" className="section-title">היום שלנו.</h2>
      </div>
      <div className="today-card glass reveal">
        <div className="today-row">
          <span className="today-ic"><Icon name="route" /></span>
          <div className="today-main">
            <span className="today-label">הבא בתור</span>
            {next ? <strong>{next.time} · {next.title}</strong> : <strong className="today-empty">אין עוד פעילויות להיום</strong>}
          </div>
          {nextWaze ? (
            <a className="chip-btn chip-btn--waze" href={nextWaze} target="_blank" rel="noopener noreferrer"><Icon name="waze" />Waze</a>
          ) : (
            <Link className="today-go" href="/plan" aria-label="למסלול">←</Link>
          )}
        </div>
        <div className="today-row">
          <span className="today-ic"><Icon name="home" /></span>
          <div className="today-main">
            <span className="today-label">ישנים הלילה</span>
            {sleep?.lodging ? <strong>{sleep.lodging}</strong> : <strong className="today-empty">עוד לא נקבע</strong>}
          </div>
          {sleepWaze ? (
            <a className="chip-btn chip-btn--waze" href={sleepWaze} target="_blank" rel="noopener noreferrer"><Icon name="waze" />Waze</a>
          ) : (
            <Link className="today-go" href="/packing" aria-label="לקביעת מקום לינה">←</Link>
          )}
        </div>
        <Link className="today-row" href="/budget">
          <span className="today-ic"><Icon name="cup" /></span>
          <div className="today-main">
            <span className="today-label">נשאר בתקציב היום</span>
            {budget > 0 ? (
              <strong className={spent > budget ? "today-over" : ""}>{spent > budget ? `חריגה של ${usd(spent - budget)}` : `${usd(budget - spent)} מתוך ${usd(budget)}`}</strong>
            ) : <strong className="today-empty">עוד לא נקבע תקציב</strong>}
          </div>
          <span className="today-go" aria-hidden="true">←</span>
        </Link>
        <Link className="today-row" href="/packing">
          <span className="today-ic"><Icon name="bag" /></span>
          <div className="today-main">
            <span className="today-label">ארוזים</span>
            {total ? <strong>{packed} מתוך {total} פריטים</strong> : <strong className="today-empty">עוד אין רשימת אריזה</strong>}
          </div>
          <span className="today-go" aria-hidden="true">←</span>
        </Link>
      </div>
    </section>
  );
}
