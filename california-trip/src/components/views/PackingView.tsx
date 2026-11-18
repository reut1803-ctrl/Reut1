"use client";

import { useState, type FormEvent } from "react";
import { useRows, useTripCtx, useTripToday } from "@/lib/tripContext";
import { useAuth } from "@/lib/auth";
import { heDate } from "@/lib/time";
import { wazeUrl, type Place } from "@/lib/places";
import Icon from "../app/Icon";
import PlaceSearch from "../app/PlaceSearch";
import DayStrip from "./DayStrip";

type Item = { id: string; label: string; category: string; checked?: boolean; checkedBy?: string };
type Day = { id: string; lodging?: string; lodgingAddress?: string; lat?: number; lng?: number };

const CATS = ["מסמכים", "בגדים", "טואלטיקה", "חשמל", "שבת", "תרופות", "לדרך", "אחר"];

const STARTER: [string, string][] = [
  ["דרכונים", "מסמכים"], ["ויזה / ESTA מודפס", "מסמכים"], ["ביטוח נסיעות", "מסמכים"], ["רישיון נהיגה בינלאומי", "מסמכים"], ["כרטיס אשראי", "מסמכים"],
  ["חולצות", "בגדים"], ["מכנסיים / חצאיות", "בגדים"], ["בגדי שבת", "בגדים"], ["מעיל קל לערב", "בגדים"], ["נעלי הליכה", "בגדים"], ["כובע שמש", "בגדים"],
  ["מברשות שיניים", "טואלטיקה"], ["קרם הגנה", "טואלטיקה"], ["משקפי שמש", "טואלטיקה"],
  ["מטענים", "חשמל"], ["מתאם חשמל אמריקאי", "חשמל"], ["סוללה ניידת", "חשמל"], ["מטען לרכב", "חשמל"],
  ["נרות שבת", "שבת"], ["גפרורים", "שבת"], ["כוס קידוש", "שבת"], ["סידורים", "שבת"], ["תפילין", "שבת"],
  ["תרופות קבועות", "תרופות"], ["משכך כאבים", "תרופות"], ["פלסטרים", "תרופות"],
  ["בקבוקי מים", "לדרך"], ["חטיפים כשרים", "לדרך"], ["אוזניות", "לדרך"],
];

function Lodging({ day }: { day: string }) {
  const { store } = useTripCtx();
  const days = useRows<Day>("days");
  const d = (days ?? []).find((x) => x.id === day);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [place, setPlace] = useState<Place | null>(null);

  async function save(e: FormEvent) {
    e.preventDefault();
    await store.set("days", day, {
      lodging: name.trim() || place?.name || "",
      lodgingAddress: place?.address ?? "",
      lat: place?.lat ?? null, lng: place?.lng ?? null,
    });
    setEditing(false);
  }

  if (!editing && d?.lodging) {
    const w = wazeUrl({ lat: d.lat, lng: d.lng, address: d.lodgingAddress || d.lodging });
    return (
      <div className="panel glass sleep-card">
        <span className="label">איפה ישנים · {heDate(day)}</span>
        <h2 className="sleep-name">{d.lodging}</h2>
        {d.lodgingAddress && <p className="hint">{d.lodgingAddress.split(",").slice(0, 3).join(",")}</p>}
        <div className="act-actions">
          {w && <a className="chip-btn chip-btn--waze" href={w} target="_blank" rel="noopener noreferrer"><Icon name="waze" />ניווט ב-Waze</a>}
          <button type="button" className="chip-btn" onClick={() => { setName(d.lodging ?? ""); setPlace(null); setEditing(true); }}>שינוי</button>
        </div>
      </div>
    );
  }
  return (
    <form className="panel glass" onSubmit={save}>
      <span className="label">איפה ישנים · {heDate(day)}</span>
      <label className="fld"><span>שם המקום</span>
        <input id="lodging-name" className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="למשל: בית חב״ד, אכסניה, חברים" />
      </label>
      <div className="fld"><span>כתובת (בשביל הניווט)</span>
        {place ? (
          <div className="picked"><Icon name="pin" /><span>{place.address}</span><button type="button" className="text-btn" onClick={() => setPlace(null)}>החלפה</button></div>
        ) : <PlaceSearch idPrefix="lodging" onPick={(p) => { setPlace(p); if (!name) setName(p.name); }} />}
      </div>
      <div className="row-end">
        {d?.lodging && <button type="button" className="text-btn" onClick={() => setEditing(false)}>ביטול</button>}
        <button className="pill-btn pill-btn--dark" type="submit">שמירה</button>
      </div>
    </form>
  );
}

function Burst() {
  return (
    <span className="burst" aria-hidden="true">
      {Array.from({ length: 8 }, (_, i) => <i key={i} style={{ ["--a" as string]: `${i * 45}deg` }} />)}
    </span>
  );
}

export default function PackingView() {
  const { tripDoc, store } = useTripCtx();
  const { user } = useAuth();
  const today = useTripToday(tripDoc);
  const [day, setDay] = useState(today);
  const items = useRows<Item>("packing");
  const [label, setLabel] = useState("");
  const [cat, setCat] = useState(CATS[0]);
  const [justChecked, setJustChecked] = useState<string | null>(null);
  const [hideDone, setHideDone] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const all = items ?? [];
  const done = all.filter((i) => i.checked).length;
  const pct = all.length ? Math.round((done / all.length) * 100) : 0;

  async function toggle(i: Item) {
    const next = !i.checked;
    if (next) {
      setJustChecked(i.id);
      setTimeout(() => setJustChecked((c) => (c === i.id ? null : c)), 900);
      navigator.vibrate?.(30);
    }
    await store.update("packing", i.id, { checked: next, checkedBy: next ? user?.name ?? "" : "" });
  }

  async function add(e: FormEvent) {
    e.preventDefault();
    if (!label.trim()) return;
    await store.add("packing", { label: label.trim(), category: cat, checked: false });
    setLabel("");
  }

  async function seed() {
    setSeeding(true);
    const existing = new Set(all.map((i) => i.label));
    for (const [l, c] of STARTER) if (!existing.has(l)) await store.add("packing", { label: l, category: c, checked: false });
    setSeeding(false);
  }

  const groups = CATS.map((c) => ({ c, list: all.filter((i) => (i.category || "אחר") === c && (!hideDone || !i.checked)) })).filter((g) => g.list.length);

  return (
    <div className="stack">
      <DayStrip start={tripDoc.startDate} end={tripDoc.endDate} value={day} onChange={setDay} />
      <Lodging day={day} />

      <div className="panel glass pack-progress">
        <div className="pack-head">
          <h2 className="panel-title">מה לארוז</h2>
          <span className="pack-count">{done} מתוך {all.length}</span>
        </div>
        <div className="bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${pct}%` }} /></div>
        {all.length > 0 && pct === 100 && <p className="all-done">הכול ארוז. אפשר לצאת לדרך! ✈️</p>}
        <div className="row-between">
          <label className="toggle"><input id="hide-done" type="checkbox" checked={hideDone} onChange={(e) => setHideDone(e.target.checked)} /> להסתיר מה שכבר ארוז</label>
          {done > 0 && <button type="button" className="text-btn" onClick={() => all.filter((i) => i.checked).forEach((i) => store.update("packing", i.id, { checked: false, checkedBy: "" }))}>לאפס סימונים</button>}
        </div>
      </div>

      {items !== null && all.length < 8 && (
        <button type="button" className="add-btn glass" onClick={seed} disabled={seeding}>
          <Icon name="bag" />{seeding ? "מוסיפים…" : "הוספת רשימה מוכנה לטיסה (30 פריטים)"}
        </button>
      )}

      {groups.map((g) => (
        <section key={g.c} className="panel glass">
          <h3 className="group-title">{g.c}</h3>
          <ul className="checklist">
            {g.list.map((i) => (
              <li key={i.id} className={`check ${i.checked ? "check--on" : ""} ${justChecked === i.id ? "check--pop" : ""}`}>
                <button type="button" className="check-box" onClick={() => toggle(i)} aria-pressed={!!i.checked} aria-label={i.label}>
                  <Icon name="check" />
                  {justChecked === i.id && <Burst />}
                </button>
                <span className="check-label" onClick={() => toggle(i)}>{i.label}</span>
                {i.checked && i.checkedBy && <span className="check-by">{i.checkedBy}</span>}
                <button type="button" className="icon-btn icon-btn--ghost" onClick={() => store.remove("packing", i.id)} aria-label={`מחיקת ${i.label}`}><Icon name="trash" /></button>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <form className="panel glass" onSubmit={add}>
        <h2 className="panel-title">פריט חדש</h2>
        <div className="row-form">
          <input id="pack-label" className="field" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="מה להוסיף?" aria-label="שם הפריט" />
          <select id="pack-cat" className="field field--narrow" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="קטגוריה">
            {CATS.map((c) => <option key={c}>{c}</option>)}
          </select>
          <button className="icon-btn icon-btn--dark" type="submit" aria-label="הוספה"><Icon name="plus" /></button>
        </div>
      </form>
    </div>
  );
}
