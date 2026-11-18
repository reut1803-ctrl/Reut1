"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRows, useTripCtx, useTripToday } from "@/lib/tripContext";
import { useAuth } from "@/lib/auth";
import { heDate } from "@/lib/time";
import Icon from "../app/Icon";
import DayStrip from "./DayStrip";

type Expense = { id: string; date: string; amount: number; category: string; note?: string; byName?: string; createdAt?: number };
const CATS = ["אוכל", "תחבורה", "לינה", "אטרקציות", "קניות", "אחר"];
const usd = (n: number) => "$" + n.toLocaleString("en-US", { maximumFractionDigits: 2 });

/** כוס קפה פסטלית: הקפה יורד ככל שההוצאות מתקרבות לתקציב היומי */
function CoffeeCup({ left }: { left: number }) {
  const level = Math.max(0, Math.min(1, left));
  const top = 40;
  const bottom = 152;
  const y = bottom - (bottom - top) * level;
  const color = level > 0.5 ? "#a9744f" : level > 0.2 ? "#c48a5a" : "#d9a37a";
  return (
    <svg className="cup" viewBox="0 0 220 200" role="img" aria-label={`נשארו ${Math.round(level * 100)} אחוז מהתקציב היומי`}>
      <defs>
        <clipPath id="cupInside">
          <path d="M42 40 L178 40 L164 152 Q160 170 140 170 L80 170 Q60 170 56 152 Z" />
        </clipPath>
      </defs>
      <ellipse cx="110" cy="186" rx="88" ry="10" className="cup-saucer" />
      <path d="M178 66 q34 0 34 30 t-40 34" className="cup-handle" />
      <path d="M38 36 L182 36 L167 154 Q162 176 140 176 L80 176 Q58 176 53 154 Z" className="cup-body" />
      <g clipPath="url(#cupInside)">
        <g className="cup-liquid" style={{ transform: `translateY(${y}px)` }}>
          <rect x="30" y="0" width="170" height="170" style={{ fill: color }} />
          <path d="M30 0 q20 -6 40 0 t40 0 t40 0 t40 0 t40 0 v8 h-200 z" className="cup-foam" />
        </g>
      </g>
      {level > 0.05 && (
        <g className="steam">
          <path d="M92 26 q-8 -10 0 -20" />
          <path d="M110 24 q-8 -10 0 -20" />
          <path d="M128 26 q-8 -10 0 -20" />
        </g>
      )}
    </svg>
  );
}

export default function BudgetView() {
  const { tripDoc, store } = useTripCtx();
  const { user } = useAuth();
  const today = useTripToday(tripDoc);
  const [day, setDay] = useState(today);
  useEffect(() => { setDay(today); }, [today]);
  const all = useRows<Expense>("expenses");
  const [amount, setAmount] = useState("");
  const [cat, setCat] = useState(CATS[0]);
  const [note, setNote] = useState("");
  const [budgetEdit, setBudgetEdit] = useState(false);
  const [budgetVal, setBudgetVal] = useState("");

  const budget = tripDoc.dailyBudget ?? 0;
  const list = (all ?? []).filter((e) => e.date === day).sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  const spent = list.reduce((s, e) => s + Number(e.amount || 0), 0);
  const left = budget > 0 ? (budget - spent) / budget : 1;
  const tripTotal = (all ?? []).reduce((s, e) => s + Number(e.amount || 0), 0);
  const byCat = CATS.map((c) => ({ c, v: (all ?? []).filter((e) => e.category === c).reduce((s, e) => s + Number(e.amount || 0), 0) })).filter((x) => x.v > 0);
  const maxCat = Math.max(1, ...byCat.map((x) => x.v));

  async function add(e: FormEvent) {
    e.preventDefault();
    const n = Number(amount.replace(",", "."));
    if (!n || n <= 0) return;
    await store.add("expenses", { date: day, amount: Math.round(n * 100) / 100, category: cat, note: note.trim(), byName: user?.name ?? "" });
    setAmount("");
    setNote("");
  }

  async function saveBudget(e: FormEvent) {
    e.preventDefault();
    const n = Number(budgetVal);
    if (n > 0) await store.updateTrip({ dailyBudget: Math.round(n) });
    setBudgetEdit(false);
  }

  return (
    <div className="stack">
      <DayStrip start={tripDoc.startDate} end={tripDoc.endDate} value={day} onChange={setDay} />

      <div className="panel glass cup-panel">
        <CoffeeCup left={left} />
        <div className="cup-text">
          {budget > 0 ? (
            spent <= budget ? (
              <>
                <span className="label">נשארו להיום</span>
                <strong className="big-num">{usd(budget - spent)}</strong>
                <span className="hint">הוצאנו {usd(spent)} מתוך {usd(budget)}</span>
              </>
            ) : (
              <>
                <span className="label">חרגנו מהתקציב היומי ב־</span>
                <strong className="big-num big-num--over">{usd(spent - budget)}</strong>
                <span className="hint">הוצאנו {usd(spent)} מתוך {usd(budget)}</span>
              </>
            )
          ) : (
            <span className="hint">קבעו תקציב יומי, והכוס תתחיל להתרוקן לפי ההוצאות.</span>
          )}
          {budgetEdit ? (
            <form className="row-form" onSubmit={saveBudget}>
              <input id="budget-val" className="field" type="number" inputMode="decimal" min="1" value={budgetVal} onChange={(e) => setBudgetVal(e.target.value)} placeholder="דולר ליום" aria-label="תקציב יומי בדולרים" />
              <button className="pill-btn pill-btn--dark" type="submit">שמירה</button>
            </form>
          ) : (
            <button type="button" className="text-btn" onClick={() => { setBudgetVal(budget ? String(budget) : ""); setBudgetEdit(true); }}>
              {budget ? `תקציב יומי: ${usd(budget)} · שינוי` : "קביעת תקציב יומי"}
            </button>
          )}
        </div>
      </div>

      <form className="panel glass" onSubmit={add}>
        <h2 className="panel-title">הוצאה חדשה · {heDate(day, { day: "numeric", month: "long" })}</h2>
        <div className="chips-row" role="radiogroup" aria-label="קטגוריה">
          {CATS.map((c) => (
            <button key={c} type="button" role="radio" aria-checked={cat === c} className={`chip-btn ${cat === c ? "chip-btn--on" : ""}`} onClick={() => setCat(c)}>{c}</button>
          ))}
        </div>
        <div className="row-form">
          <input id="exp-amount" className="field field--amount" type="number" inputMode="decimal" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="סכום ($)" aria-label="סכום בדולרים" required />
          <input id="exp-note" className="field" value={note} onChange={(e) => setNote(e.target.value)} placeholder="על מה? (לא חובה)" aria-label="הערה" />
          <button className="icon-btn icon-btn--dark" type="submit" aria-label="הוספה"><Icon name="plus" /></button>
        </div>
      </form>

      {list.length > 0 && (
        <section className="panel glass">
          <h3 className="group-title">ההוצאות של היום</h3>
          <ul className="exp-list">
            {list.map((e) => (
              <li key={e.id}>
                <span className="exp-cat">{e.category}</span>
                <span className="exp-note">{e.note || "—"}{e.byName ? <small> · {e.byName}</small> : null}</span>
                <strong className="exp-amt">{usd(Number(e.amount))}</strong>
                <button type="button" className="icon-btn icon-btn--ghost" aria-label="מחיקה" onClick={() => store.remove("expenses", e.id)}><Icon name="trash" /></button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {byCat.length > 0 && (
        <section className="panel glass">
          <div className="pack-head">
            <h3 className="group-title">כל הטיול עד עכשיו</h3>
            <strong>{usd(tripTotal)}</strong>
          </div>
          <ul className="cat-bars">
            {byCat.map((x) => (
              <li key={x.c}>
                <span>{x.c}</span>
                <span className="cat-bar"><i style={{ width: `${(x.v / maxCat) * 100}%` }} /></span>
                <b>{usd(x.v)}</b>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
