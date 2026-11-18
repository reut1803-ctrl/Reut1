"use client";

import { useEffect, useRef, useState, type FormEvent, type PointerEvent as RPointerEvent } from "react";
import { gsap } from "@/lib/gsap";
import { useRows, useTripCtx, useTripToday } from "@/lib/tripContext";
import { hoursLines, placeDetails, type PlaceDetails } from "@/lib/details";
import { driveHours, formatDrive, type Origin } from "@/lib/context";
import { wazeUrl } from "@/lib/places";
import type { Spot } from "@/content/sfGuide";
import Icon from "./Icon";

export type SheetPlace = { name: string; enName?: string; lat: number; lng: number; spot?: Spot; label?: string; address?: string };

const ENTRY: Record<NonNullable<Spot["entry"]>, { label: string; cls: string }> = {
  free: { label: "כניסה חינם", cls: "entry--free" },
  paid: { label: "בתשלום", cls: "entry--paid" },
  parking: { label: "חינם · חניה בתשלום", cls: "entry--mixed" },
  mixed: { label: "חינם · חלק בתשלום", cls: "entry--mixed" },
};

/** תמונה אמיתית של המקום (ויקימדיה), נטענת רק כשהיא נכנסת למסך */
export function SpotImage({ spot, className = "" }: { spot: Spot; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "ok" | "none">("idle");
  useEffect(() => {
    const el = ref.current;
    if (!el || !spot.wiki) { setState("none"); return; }
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      setState("loading");
      placeDetails({ name: spot.name, enName: spot.titleEn, wiki: spot.wiki, lat: spot.lat, lng: spot.lng })
        .then((d) => { if (d.image) setSrc(d.image); else setState("none"); })
        .catch(() => setState("none"));
    }, { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, [spot]);
  return (
    <div ref={ref} className={`spot-img ${className} spot-img--${state}`} aria-hidden={!src}>
      {src && <img src={src} alt={spot.titleEn ?? spot.name} loading="lazy" onLoad={() => setState("ok")} onError={() => { setSrc(null); setState("none"); }} />}
      {state !== "ok" && <span className="spot-img-mark">★</span>}
    </div>
  );
}

function AddToPlan({ place, onDone }: { place: SheetPlace; onDone: () => void }) {
  const { store, tripDoc } = useTripCtx();
  const today = useTripToday(tripDoc);
  const [date, setDate] = useState(today);
  const [time, setTime] = useState("10:00");
  async function save(e: FormEvent) {
    e.preventDefault();
    await store.add("activities", { title: place.name, date, time, address: place.spot?.en ?? place.enName ?? place.address ?? "", lat: place.lat, lng: place.lng, status: "planned", reminder: 30 });
    onDone();
  }
  return (
    <form className="add-plan" onSubmit={save}>
      <input id="sheet-plan-date" className="field" type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="יום" required />
      <input id="sheet-plan-time" className="field" type="time" value={time} onChange={(e) => setTime(e.target.value)} aria-label="שעה" required />
      <button className="pill-btn pill-btn--dark" type="submit">הוספה</button>
    </form>
  );
}

export default function PlaceSheet({ place, origin, onClose }: { place: SheetPlace | null; origin: Origin; onClose: () => void }) {
  const { store } = useTripCtx();
  const savedRows = useRows<{ id: string }>("saved");
  const [shown, setShown] = useState<SheetPlace | null>(null);
  const [d, setD] = useState<PlaceDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [imgOk, setImgOk] = useState(false);
  const [planning, setPlanning] = useState(false);
  const [added, setAdded] = useState(false);
  const back = useRef<HTMLDivElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const drag = useRef<{ y: number; dy: number } | null>(null);

  // פתיחה: מציגים, טוענים פרטים, ומריצים אנימציה
  useEffect(() => {
    if (!place) return;
    setShown(place);
    setD(null);
    setImgOk(false);
    setPlanning(false);
    setAdded(false);
    setLoading(true);
    placeDetails({ name: place.name, enName: place.enName ?? place.spot?.titleEn, wiki: place.spot?.wiki, lat: place.lat, lng: place.lng })
      .then(setD).catch(() => setD(null)).finally(() => setLoading(false));
  }, [place]);

  useEffect(() => {
    if (!shown || !sheet.current || !back.current) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.documentElement.classList.add("sheet-open");
    closeBtn.current?.focus({ preventScroll: true });
    if (reduce) return;
    const tl = gsap.timeline();
    tl.fromTo(back.current, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power1.out" })
      .fromTo(sheet.current, { yPercent: 100 }, { yPercent: 0, duration: 0.65, ease: "expo.out" }, 0)
      .fromTo(sheet.current.querySelectorAll(".sheet-anim"), { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power3.out", stagger: 0.05 }, 0.18);
    return () => { tl.kill(); };
  }, [shown]);

  function close() {
    const done = () => { document.documentElement.classList.remove("sheet-open"); setShown(null); onClose(); };
    if (!sheet.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { done(); return; }
    gsap.timeline({ onComplete: done })
      .to(sheet.current, { yPercent: 100, duration: 0.35, ease: "power2.in" })
      .to(back.current, { opacity: 0, duration: 0.3 }, 0.05);
  }

  useEffect(() => {
    if (!shown) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // גרירה למטה לסגירה
  function onDown(e: RPointerEvent) { drag.current = { y: e.clientY, dy: 0 }; (e.target as HTMLElement).setPointerCapture?.(e.pointerId); }
  function onMove(e: RPointerEvent) {
    if (!drag.current || !sheet.current) return;
    drag.current.dy = Math.max(0, e.clientY - drag.current.y);
    gsap.set(sheet.current, { y: drag.current.dy });
  }
  function onUp() {
    if (!drag.current || !sheet.current) return;
    const dy = drag.current.dy;
    drag.current = null;
    if (dy > 110) close(); else gsap.to(sheet.current, { y: 0, duration: 0.3, ease: "power3.out" });
  }

  if (!shown) return null;
  const s = shown.spot;
  const enName = shown.enName ?? s?.titleEn;
  const drive = driveHours(origin, shown);
  const saved = !!s && (savedRows ?? []).some((r) => r.id === s.id);
  const w = wazeUrl({ lat: shown.lat, lng: shown.lng });
  const hours = d?.hours ? hoursLines(d.hours) : null;

  return (
    <div className="sheet-root" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
      <div ref={back} className="sheet-back" onClick={close} />
      <div ref={sheet} className="sheet">
        <div className="sheet-grab" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}><span /></div>
        <button ref={closeBtn} type="button" className="sheet-x" onClick={close} aria-label="סגירה">×</button>
        <div className="sheet-body">
          <div className={`sheet-hero sheet-anim ${imgOk ? "sheet-hero--ok" : ""}`}>
            {d?.image && <img src={d.image} alt={enName ?? shown.name} onLoad={() => setImgOk(true)} onError={() => setImgOk(false)} />}
            {!imgOk && <span className="spot-img-mark">{loading ? "" : "★"}</span>}
            {loading && <span className="shimmer" />}
          </div>
          <header className="sheet-head sheet-anim">
            {shown.label && <span className="label">{shown.label}</span>}
            <h2 id="sheet-title">{shown.name}</h2>
            {enName && <p className="sheet-en" dir="ltr">{enName}</p>}
            <div className="sheet-chips">
              <span className="chip-soft"><Icon name="route" />{formatDrive(drive)} נסיעה{origin.source === "gps" ? " ממך" : ""}</span>
              {s && <span className="chip-soft">כ-{s.hours >= 1 ? `${s.hours} שע׳` : `${Math.round(s.hours * 60)} דק׳`} במקום</span>}
              {s?.indoor && <span className="chip-soft">מקורה</span>}
              {s?.entry && <span className={`chip-soft ${ENTRY[s.entry].cls}`}>{ENTRY[s.entry].label}</span>}
            </div>
          </header>

          {s?.why && <p className="sheet-why sheet-anim">{s.why}</p>}
          {s?.kidsWhy && (
            <div className="sheet-card sheet-card--kids sheet-anim">
              <span className="sheet-card-t">לבנות</span>
              <p>{s.kidsWhy}</p>
            </div>
          )}

          <div className="sheet-grid sheet-anim">
            <div className="sheet-card">
              <span className="sheet-card-t">שעות פתיחה</span>
              {loading && !d ? <p className="hint">בודקים…</p> : hours ? (
                <>
                  <ul className="hours">{hours.map((h, i) => <li key={i} dir="auto">{h}</li>)}</ul>
                  <small className="hint">לפי OpenStreetMap — שעות משתנות בחגים ובעונות</small>
                </>
              ) : <p>{s?.hoursNote ?? "לא מצאנו שעות מעודכנות למקום הזה."}</p>}
            </div>
            <div className="sheet-card">
              <span className="sheet-card-t">כניסה</span>
              <p>{s?.entryNote ?? (d?.fee === "no" ? "כניסה חינם." : d?.fee === "yes" ? "בתשלום." : "לא ידוע — כדאי לבדוק לפני.")}</p>
            </div>
          </div>

          {s?.tip && <p className="sheet-tip sheet-anim"><strong>טיפ:</strong> {s.tip}</p>}
          {(d?.phone || shown.address) && (
            <div className="sheet-contact sheet-anim">
              {shown.address && <p><Icon name="pin" />{shown.address.split(",").slice(0, 3).join(",")}</p>}
              {d?.phone && <p dir="ltr" className="phone">{d.phone}</p>}
            </div>
          )}

          <div className="sheet-actions sheet-anim">
            {w && <a className="pill-btn pill-btn--waze" href={w} target="_blank" rel="noopener noreferrer"><Icon name="waze" />ניווט ב-Waze</a>}
            <button type="button" className="pill-btn" onClick={() => setPlanning((v) => !v)}><Icon name="plus" />{added ? "נוסף למסלול ✓" : "למסלול"}</button>
            {s && (
              <button type="button" className={`pill-btn ${saved ? "pill-btn--saved" : ""}`} aria-pressed={saved}
                onClick={() => (saved ? store.remove("saved", s.id) : store.set("saved", s.id, { savedAt: Date.now() }))}>
                <Icon name="heart" />{saved ? "שמור" : "שמירה"}
              </button>
            )}
          </div>
          {planning && <AddToPlan place={shown} onDone={() => { setPlanning(false); setAdded(true); }} />}
          {(d?.image || d?.website) && (
            <p className="sheet-credit">
              {d?.image && "תמונה: Wikimedia Commons"}
              {d?.image && d?.website && " · "}
              {d?.website && <a href={d.website} target="_blank" rel="noopener noreferrer">האתר הרשמי</a>}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
