"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { prefsOf, useRows, useTripCtx, useTripToday } from "@/lib/tripContext";
import { formatDrive, jewishCalendar, driveHours, useOrigin, useShabbat, useWeather, type JewishDay } from "@/lib/context";
import { rank, freeHours, isShabbatNow, type Prefs, type Rec } from "@/lib/recommend";
import { CATS, INTERESTS, KIDS, SPOTS, type GuideCat, type Spot } from "@/content/sfGuide";
import { mapsSearchUrl, wazeUrl } from "@/lib/places";
import { addDays, heDate, caNow } from "@/lib/time";
import Icon from "../app/Icon";

type Saved = { id: string };

const PACES: { id: Prefs["pace"]; label: string }[] = [
  { id: "calm", label: "רגוע" },
  { id: "balanced", label: "מאוזן" },
  { id: "active", label: "הרבה חוויות" },
];

function AddToPlan({ spot, onDone }: { spot: Spot; onDone: () => void }) {
  const { store, tripDoc } = useTripCtx();
  const today = useTripToday(tripDoc);
  const [date, setDate] = useState(today);
  const [time, setTime] = useState("10:00");
  async function save(e: FormEvent) {
    e.preventDefault();
    await store.add("activities", { title: spot.name, date, time, address: spot.en, lat: spot.lat, lng: spot.lng, status: "planned", reminder: 30 });
    onDone();
  }
  return (
    <form className="add-plan" onSubmit={save}>
      <input id={`ap-d-${spot.id}`} className="field" type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="יום" required />
      <input id={`ap-t-${spot.id}`} className="field" type="time" value={time} onChange={(e) => setTime(e.target.value)} aria-label="שעה" required />
      <button className="pill-btn pill-btn--dark" type="submit">הוספה</button>
    </form>
  );
}

function SpotCard({ spot, drive, reasons, saved, rank: n }: { spot: Spot; drive: number; reasons?: string[]; saved: boolean; rank?: number }) {
  const { store } = useTripCtx();
  const [planning, setPlanning] = useState(false);
  const [added, setAdded] = useState(false);
  const w = wazeUrl({ lat: spot.lat, lng: spot.lng });
  return (
    <article className={`spot glass ${n === 1 ? "spot--top" : ""}`}>
      <div className="spot-head">
        {n ? <span className="spot-n">{n}</span> : null}
        <div className="spot-title">
          <h3>{spot.name}</h3>
          <span className="spot-meta">{formatDrive(drive)} נסיעה · כ-{spot.hours >= 1 ? `${spot.hours} שע׳` : `${Math.round(spot.hours * 60)} דק׳`} במקום{spot.indoor ? " · מקורה" : ""}</span>
        </div>
        <button
          type="button"
          className={`heart ${saved ? "heart--on" : ""}`}
          aria-pressed={saved}
          aria-label={saved ? "הסרה מהשמורים" : "שמירה"}
          onClick={() => (saved ? store.remove("saved", spot.id) : store.set("saved", spot.id, { savedAt: Date.now() }))}
        >
          <Icon name="heart" />
        </button>
      </div>
      <p className="spot-why">{spot.why}</p>
      {reasons && reasons.length > 0 && (
        <div className="reasons">{reasons.filter((r) => !r.startsWith("נסיעה")).slice(0, 3).map((r) => <span key={r} className="reason">{r}</span>)}</div>
      )}
      {spot.tip && <p className="spot-tip"><strong>טיפ:</strong> {spot.tip}</p>}
      <div className="act-actions">
        {w && <a className="chip-btn chip-btn--waze" href={w} target="_blank" rel="noopener noreferrer"><Icon name="waze" />Waze</a>}
        <button type="button" className="chip-btn" onClick={() => setPlanning((v) => !v)}><Icon name="plus" />{added ? "נוסף למסלול ✓" : "למסלול"}</button>
        <a className="chip-btn" href={mapsSearchUrl(spot.en)} target="_blank" rel="noopener noreferrer"><Icon name="pin" />מידע ושעות</a>
      </div>
      {planning && <AddToPlan spot={spot} onDone={() => { setPlanning(false); setAdded(true); }} />}
    </article>
  );
}

function PrefsPanel({ prefs, onChange }: { prefs: Prefs; onChange: (p: Prefs) => void }) {
  const toggle = <T extends string>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  return (
    <div className="stack-sm">
      <div className="fld"><span>מה אנחנו אוהבים</span>
        <div className="chips-row">
          {INTERESTS.map((i) => (
            <button key={i.id} type="button" aria-pressed={prefs.interests.includes(i.id)} className={`chip-btn ${prefs.interests.includes(i.id) ? "chip-btn--on" : ""}`}
              onClick={() => onChange({ ...prefs, interests: toggle(prefs.interests, i.id) })}>{i.label}</button>
          ))}
        </div>
      </div>
      <div className="fld"><span>מה הבנות מחפשות עכשיו</span>
        <div className="chips-row">
          {KIDS.map((k) => (
            <button key={k.id} type="button" aria-pressed={prefs.kids.includes(k.id)} className={`chip-btn ${prefs.kids.includes(k.id) ? "chip-btn--on" : ""}`}
              onClick={() => onChange({ ...prefs, kids: toggle(prefs.kids, k.id) })}>{k.label}</button>
          ))}
        </div>
      </div>
      <div className="fld"><span>הקצב שלנו</span>
        <div className="seg" role="radiogroup" aria-label="קצב">
          {PACES.map((p) => (
            <button key={p.id} type="button" role="radio" aria-checked={prefs.pace === p.id} className={`seg-btn ${prefs.pace === p.id ? "seg-btn--on" : ""}`} onClick={() => onChange({ ...prefs, pace: p.id })}>{p.label}</button>
          ))}
        </div>
      </div>
      <label className="fld"><span>עד כמה רחוק: {formatDrive(prefs.maxDrive)} נסיעה</span>
        <input id="pref-drive" className="range" type="range" min={0.5} max={4} step={0.5} value={prefs.maxDrive} onChange={(e) => onChange({ ...prefs, maxDrive: Number(e.target.value) })} />
      </label>
    </div>
  );
}

function Events() {
  const { tripDoc } = useTripCtx();
  const start = tripDoc.startDate ?? caNow().date;
  const end = tripDoc.endDate ?? addDays(start, 14);
  const [items, setItems] = useState<JewishDay[] | null>(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    let off = false;
    setItems(null);
    jewishCalendar(start, end).then((v) => { if (!off) setItems(v); }).catch(() => { if (!off) setErr(true); });
    return () => { off = true; };
  }, [start, end]);
  const holidays = (items ?? []).filter((i) => i.kind === "holiday");
  const candles = (items ?? []).filter((i) => i.kind === "candles");
  const range = `${heDate(start, { day: "numeric", month: "long" })} – ${heDate(end, { day: "numeric", month: "long" })}`;
  const q = (t: string) => `https://www.google.com/search?q=${encodeURIComponent(`${t} ${start} ${end}`)}`;
  return (
    <section className="panel glass">
      <h2 className="panel-title">מה קורה בימים שלנו</h2>
      <p className="hint">{range}{tripDoc.startDate ? "" : " · כשתקבעו תאריכים בעמוד המסלול, הרשימה תתעדכן לפיהם"}</p>
      {err && <p className="hint">לוח השנה העברי לא זמין כרגע.</p>}
      {items === null && !err && <p className="hint">טוען…</p>}
      {holidays.length > 0 && (
        <ul className="ev-list">
          {holidays.map((h) => <li key={h.date + h.title}><span className="ev-date">{heDate(h.date, { weekday: "short", day: "numeric", month: "numeric" })}</span><strong>{h.title}</strong></li>)}
        </ul>
      )}
      {candles.length > 0 && (
        <ul className="ev-list">
          {candles.map((c) => <li key={c.date}><span className="ev-date">{heDate(c.date, { weekday: "short", day: "numeric", month: "numeric" })}</span><span>הדלקת נרות בסן פרנסיסקו</span><strong className="ev-time">{c.time}</strong></li>)}
        </ul>
      )}
      {items && holidays.length === 0 && <p className="hint">אין חגים בימים האלה.</p>}
      <div className="act-actions">
        <a className="chip-btn" href={q("events festivals San Francisco")} target="_blank" rel="noopener noreferrer">אירועים ופסטיבלים בעיר</a>
        <a className="chip-btn" href={q("family kids events San Francisco Bay Area")} target="_blank" rel="noopener noreferrer">אירועים לילדים</a>
        <a className="chip-btn" href={q("Chabad San Francisco events")} target="_blank" rel="noopener noreferrer">אירועי חב״ד</a>
        <a className="chip-btn" href="https://sf.funcheap.com/" target="_blank" rel="noopener noreferrer">אירועים בחינם (Funcheap)</a>
      </div>
    </section>
  );
}

export default function DiscoverView() {
  const { tripDoc, store } = useTripCtx();
  const savedRows = useRows<Saved>("saved");
  const saved = useMemo(() => new Set((savedRows ?? []).map((r) => r.id)), [savedRows]);
  const { origin, locate } = useOrigin();
  const { weather, failed } = useWeather(origin.lat, origin.lng);
  const shabbat = useShabbat(origin.lat, origin.lng);
  const [prefs, setPrefs] = useState<Prefs>(prefsOf(tripDoc));
  const [showPrefs, setShowPrefs] = useState(!tripDoc.prefs);
  const [cat, setCat] = useState<GuideCat | "saved">("city");
  const [now, setNow] = useState(Date.now());
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 60000); return () => clearInterval(t); }, []);
  useEffect(() => { setPrefs(prefsOf(tripDoc)); }, [tripDoc.prefs]); // eslint-disable-line react-hooks/exhaustive-deps

  // שמירה אוטומטית של ההעדפות, חצי שנייה אחרי השינוי האחרון
  function changePrefs(p: Prefs) {
    setPrefs(p);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => { void store.updateTrip({ prefs: p }); }, 600);
  }

  const situation = { now, origin, weather, shabbat };
  const recs: Rec[] = rank(prefs, situation, saved);
  const free = freeHours(situation);
  const shabbatNow = isShabbatNow(situation);
  const list = cat === "saved" ? SPOTS.filter((s) => saved.has(s.id)) : SPOTS.filter((s) => s.cat === cat);

  return (
    <div className="stack">
      <div className="ctx-strip glass">
        <span className="ctx-item">{weather ? <><strong>{weather.temp}°</strong> {weather.label}{weather.rainSoon && weather.kind !== "rain" ? " · גשם בקרוב" : ""}</> : failed ? "מזג אוויר לא זמין" : "בודקים מזג אוויר…"}</span>
        <span className="ctx-item">{free.limit === "shabbat" ? `עד שבת: ${formatDrive(free.hours)}` : `זמן פנוי היום: ${formatDrive(free.hours)}`}</span>
        <button type="button" className="ctx-item ctx-btn" onClick={locate}>
          <Icon name="pin" />{origin.source === "gps" ? "לפי המיקום שלכם" : "סביב סן פרנסיסקו · מיקום שלי"}
        </button>
      </div>

      <section className="stack-sm" aria-labelledby="now-title">
        <div className="row-between">
          <h2 id="now-title" className="panel-title big-title">{shabbatNow ? "שבת שלום" : "בשבילכם, עכשיו"}</h2>
          <button type="button" className="text-btn" onClick={() => setShowPrefs((v) => !v)}>{showPrefs ? "סגירת ההעדפות" : "כיוון ההמלצות"}</button>
        </div>
        {showPrefs && <div className="panel glass"><PrefsPanel prefs={prefs} onChange={changePrefs} /></div>}
        {shabbatNow ? (
          <div className="empty glass"><p>ההמלצות יחזרו במוצאי שבת. שבת של מנוחה.</p></div>
        ) : recs.length === 0 ? (
          <div className="empty glass"><p>אין מקומות בטווח הנסיעה שבחרתם. הגדילו את ״עד כמה רחוק״.</p></div>
        ) : (
          recs.slice(0, 4).map((r, i) => <SpotCard key={r.spot.id} spot={r.spot} drive={r.drive} reasons={r.reasons} saved={saved.has(r.spot.id)} rank={i + 1} />)
        )}
      </section>

      <section className="stack-sm" aria-labelledby="must-title">
        <h2 id="must-title" className="panel-title big-title">אסור לפספס</h2>
        <div className="chips-row chips-row--scroll" role="tablist" aria-label="סוג">
          {CATS.map((c) => (
            <button key={c.id} type="button" role="tab" aria-selected={cat === c.id} className={`chip-btn ${cat === c.id ? "chip-btn--on" : ""}`} onClick={() => setCat(c.id)}>{c.label}</button>
          ))}
          <button type="button" role="tab" aria-selected={cat === "saved"} className={`chip-btn ${cat === "saved" ? "chip-btn--on" : ""}`} onClick={() => setCat("saved")}>♥ שמורים ({saved.size})</button>
        </div>
        {list.length === 0 && <div className="empty glass"><p>עוד לא שמרתם מקומות. לחצו על הלב בכל מקום שאהבתם.</p></div>}
        {list
          .map((s) => ({ s, d: driveHours(origin, s) }))
          .sort((a, b) => a.d - b.d)
          .map(({ s, d }) => <SpotCard key={s.id} spot={s} drive={d} saved={saved.has(s.id)} />)}
        <div className="act-actions">
          <a className="chip-btn" href={mapsSearchUrl("kosher restaurant", origin.lat, origin.lng)} target="_blank" rel="noopener noreferrer">מסעדות כשרות קרובות</a>
          <a className="chip-btn" href={mapsSearchUrl("Chabad", origin.lat, origin.lng)} target="_blank" rel="noopener noreferrer">✡ בית חב״ד קרוב</a>
        </div>
      </section>

      <Events />
    </div>
  );
}
