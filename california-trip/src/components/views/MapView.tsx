"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type * as Leaflet from "leaflet";
import { useRows, useTripCtx } from "@/lib/tripContext";
import {
  mapsSearchUrl, searchArea, searchPlacesNear, shabbatTimes, wazeUrl,
  type Bbox, type Place, type Poi, type ShabbatTimes,
} from "@/lib/places";
import { driveHours, formatDrive, useOrigin } from "@/lib/context";
import { SPOTS } from "@/content/sfGuide";
import Icon from "../app/Icon";
import type { Activity } from "./PlanView";
import type { Photo } from "./JournalView";

type Cat = "attraction" | "chabad" | "kosher" | "torah" | "candles" | "lodging";
type SavedPlace = { id: string; name: string; category: Cat; lat: number; lng: number; address?: string; price?: number | null };

const CATS: Record<Cat, { label: string; mark: string; layer: Layer }> = {
  attraction: { label: "אטרקציה", mark: "★", layer: "attractions" },
  chabad: { label: "בית חב״ד", mark: "✡", layer: "jewish" },
  kosher: { label: "אוכל כשר", mark: "K", layer: "jewish" },
  torah: { label: "שיעור תורה", mark: "ת", layer: "jewish" },
  candles: { label: "הדלקת נרות", mark: "🕯", layer: "jewish" },
  lodging: { label: "לינה", mark: "⌂", layer: "lodging" },
};

type Layer = "must" | "attractions" | "jewish" | "lodging" | "plan" | "photos";
const LAYERS: { id: Layer; label: string }[] = [
  { id: "must", label: "אסור לפספס" },
  { id: "attractions", label: "אטרקציות ששמרנו" },
  { id: "jewish", label: "יהדות וכשרות" },
  { id: "lodging", label: "לינה" },
  { id: "plan", label: "המסלול שלנו" },
  { id: "photos", label: "התמונות שלנו" },
];

const REGIONS: { name: string; lat: number; lng: number; z: number }[] = [
  { name: "סן פרנסיסקו", lat: 37.7749, lng: -122.4194, z: 12 },
  { name: "המפרץ", lat: 37.75, lng: -122.3, z: 9 },
  { name: "מרין ומיור וודס", lat: 37.92, lng: -122.58, z: 11 },
  { name: "סנטה קרוז ומונטריי", lat: 36.8, lng: -121.95, z: 9 },
  { name: "ביג סור", lat: 36.2704, lng: -121.8081, z: 10 },
  { name: "יוסמיטי", lat: 37.7456, lng: -119.5936, z: 11 },
  { name: "לייק טאהו", lat: 39.0968, lng: -120.0324, z: 10 },
  { name: "לוס אנג׳לס", lat: 34.0522, lng: -118.2437, z: 10 },
  { name: "כל קליפורניה", lat: 36.9, lng: -119.6, z: 6 },
];

const DEFAULT_VIEW = { lat: 37.7749, lng: -122.4194, z: 11 };
const PREF_KEY = "ct-map-v1";
const usd = (n: number) => (n === 0 ? "חינם" : "$" + n.toLocaleString("en-US"));

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

type MapPrefs = { layers: Record<Layer, boolean>; view: { lat: number; lng: number; z: number } };
function readPrefs(): MapPrefs {
  const base: MapPrefs = { layers: { must: true, attractions: true, jewish: true, lodging: true, plan: true, photos: true }, view: DEFAULT_VIEW };
  try {
    const raw = localStorage.getItem(PREF_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      return { layers: { ...base.layers, ...(p.layers ?? {}) }, view: p.view ?? base.view };
    }
  } catch { /* */ }
  return base;
}
function writePrefs(p: MapPrefs) {
  try { localStorage.setItem(PREF_KEY, JSON.stringify(p)); } catch { /* */ }
}

/** מה שנבחר במפה — כל סוגי הנקודות מוצגים באותו כרטיס */
type Sel = {
  name: string; lat: number; lng: number; label: string;
  text?: string; address?: string; price?: number | null; photo?: string;
  savedId?: string; canSave?: boolean;
};

type Hit = { key: string; name: string; sub: string; lat: number; lng: number; address?: string; local: boolean };

export default function MapView() {
  const { store } = useTripCtx();
  const places = useRows<SavedPlace>("places");
  const photos = useRows<Photo>("photos");
  const acts = useRows<Activity>("activities");
  const { origin, locate } = useOrigin();

  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const LRef = useRef<typeof Leaflet | null>(null);
  const groupRef = useRef<Leaflet.LayerGroup | null>(null);
  const tempRef = useRef<Leaflet.LayerGroup | null>(null);
  const [ready, setReady] = useState(false);
  const [prefs, setPrefs] = useState<MapPrefs>(() => (typeof window === "undefined" ? { layers: { must: true, attractions: true, jewish: true, lodging: true, plan: true, photos: true }, view: DEFAULT_VIEW } : readPrefs()));
  const [bbox, setBbox] = useState<Bbox | null>(null);
  const [zoom, setZoom] = useState(DEFAULT_VIEW.z);
  const [layersOpen, setLayersOpen] = useState(false);

  // חיפוש
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchErr, setSearchErr] = useState<string | null>(null);

  // תוצאות אזור (כשר / בתי כנסת)
  const [pois, setPois] = useState<Poi[]>([]);
  const [areaBusy, setAreaBusy] = useState<Poi["kind"] | null>(null);
  const [areaMsg, setAreaMsg] = useState<string | null>(null);

  const [sel, setSel] = useState<Sel | null>(null);
  const selRef = useRef<HTMLDivElement>(null);
  const [saveCat, setSaveCat] = useState<Cat>("attraction");
  const [savePrice, setSavePrice] = useState("");
  const [shabbat, setShabbat] = useState<ShabbatTimes | null>(null);
  const [shabbatErr, setShabbatErr] = useState<string | null>(null);
  const [shabbatBusy, setShabbatBusy] = useState(false);

  const center = bbox ? { lat: (bbox.n + bbox.s) / 2, lng: (bbox.e + bbox.w) / 2 } : { lat: prefs.view.lat, lng: prefs.view.lng };

  // יצירת המפה — עם תיקון מידות (בלי זה המפה "זזה" למקום אחר כשהמסך עוד לא סיים להיטען)
  useEffect(() => {
    let map: Leaflet.Map | null = null;
    let ro: ResizeObserver | null = null;
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !el.current) return;
      const v = readPrefs().view;
      map = L.map(el.current, { zoomControl: false, attributionControl: true }).setView([v.lat, v.lng], v.z);
      L.control.zoom({ position: "bottomright" }).addTo(map);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" }).addTo(map);
      groupRef.current = L.layerGroup().addTo(map);
      tempRef.current = L.layerGroup().addTo(map);
      const sync = () => {
        const b = map!.getBounds();
        setBbox({ s: b.getSouth(), w: b.getWest(), n: b.getNorth(), e: b.getEast() });
        setZoom(map!.getZoom());
        const c = map!.getCenter();
        const cur = readPrefs();
        writePrefs({ ...cur, view: { lat: c.lat, lng: c.lng, z: map!.getZoom() } });
      };
      map.on("moveend", sync);
      ro = new ResizeObserver(() => map?.invalidateSize());
      ro.observe(el.current);
      setTimeout(() => { map?.invalidateSize(); map?.setView([v.lat, v.lng], v.z); sync(); }, 120);
      LRef.current = L;
      mapRef.current = map;
      setReady(true);
    })();
    return () => {
      cancelled = true;
      ro?.disconnect();
      map?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => { writePrefs({ ...readPrefs(), layers: prefs.layers }); }, [prefs.layers]);

  // נעצים קבועים (מהטיול)
  useEffect(() => {
    const L = LRef.current;
    const g = groupRef.current;
    if (!ready || !L || !g) return;
    g.clearLayers();
    const icon = (cls: string, html: string, size = 34) =>
      L.divIcon({ className: "pin-wrap", html: `<span class="pin ${cls}">${html}</span>`, iconSize: [size, size], iconAnchor: [size / 2, size] });
    const L_ = prefs.layers;

    if (L_.must) {
      for (const sp of SPOTS) {
        L.marker([sp.lat, sp.lng], { icon: icon("pin--must", "★"), title: sp.name })
          .on("click", () => setSel({ name: sp.name, lat: sp.lat, lng: sp.lng, label: "אסור לפספס", text: sp.why + (sp.tip ? ` · ${sp.tip}` : "") }))
          .addTo(g);
      }
    }
    for (const p of places ?? []) {
      const c = CATS[p.category] ?? CATS.attraction;
      if (!L_[c.layer] || typeof p.lat !== "number") continue;
      L.marker([p.lat, p.lng], { icon: icon(`pin--${p.category}`, esc(c.mark)), title: p.name })
        .on("click", () => setSel({ name: p.name, lat: p.lat, lng: p.lng, label: c.label, address: p.address, price: p.price, savedId: p.id }))
        .addTo(g);
    }
    if (L_.plan) {
      for (const a of acts ?? []) {
        if (typeof a.lat !== "number" || typeof a.lng !== "number") continue;
        L.marker([a.lat, a.lng], { icon: icon("pin--plan", esc(a.time || "•")), title: a.title })
          .on("click", () => setSel({ name: a.title, lat: a.lat!, lng: a.lng!, label: `מהמסלול · ${a.time}`, address: a.address }))
          .addTo(g);
      }
    }
    if (L_.photos) {
      for (const ph of photos ?? []) {
        if (typeof ph.lat !== "number" || typeof ph.lng !== "number") continue;
        L.marker([ph.lat, ph.lng], { icon: L.divIcon({ className: "pin-wrap", html: `<span class="pin pin--photo"><img src="${ph.thumb}" alt=""/></span>`, iconSize: [44, 44], iconAnchor: [22, 44] }) })
          .on("click", () => setSel({ name: ph.caption || "תמונה", lat: ph.lat!, lng: ph.lng!, label: `תמונה · ${ph.byName}`, photo: ph.thumb }))
          .addTo(g);
      }
    }
  }, [ready, places, photos, acts, prefs.layers]);

  // נעצים זמניים: תוצאות אזור + המקום שנבחר בחיפוש + המיקום שלי
  useEffect(() => {
    const L = LRef.current;
    const t = tempRef.current;
    if (!ready || !L || !t) return;
    t.clearLayers();
    for (const p of pois) {
      L.marker([p.lat, p.lng], {
        icon: L.divIcon({ className: "pin-wrap", html: `<span class="pin pin--${p.kind === "kosher" ? "kosher" : "chabad"} pin--found">${p.kind === "kosher" ? "K" : "✡"}</span>`, iconSize: [34, 34], iconAnchor: [17, 34] }),
        title: p.name,
      })
        .on("click", () => setSel({ name: p.name, lat: p.lat, lng: p.lng, label: p.kind === "kosher" ? "כשר (OpenStreetMap)" : "בית כנסת / חב״ד (OpenStreetMap)", address: p.address, canSave: true }))
        .addTo(t);
    }
    if (sel?.canSave && !pois.some((p) => p.lat === sel.lat && p.lng === sel.lng)) {
      L.marker([sel.lat, sel.lng], { icon: L.divIcon({ className: "pin-wrap", html: `<span class="pin pin--search">●</span>`, iconSize: [34, 34], iconAnchor: [17, 34] }) }).addTo(t);
    }
    if (origin.source === "gps") {
      L.circleMarker([origin.lat, origin.lng], { radius: 8, color: "#fff", weight: 3, fillColor: "#0a84ff", fillOpacity: 1 }).addTo(t);
    }
  }, [ready, pois, sel, origin]);

  // כשבוחרים מקום — הכרטיס שלו נגלל לתצוגה (אם הוא מתחת למסך)
  useEffect(() => {
    if (!sel || !selRef.current) return;
    const r = selRef.current.getBoundingClientRect();
    if (r.top > window.innerHeight - 140) {
      setTimeout(() => selRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 450);
    }
  }, [sel?.lat, sel?.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  function fly(lat: number, lng: number, z: number) {
    mapRef.current?.flyTo([lat, lng], z, { duration: 1.1 });
  }

  // ---- חיפוש: קודם במקומות שלנו, אחר כך בכל הכתובות, עם העדפה לאזור שעל המפה
  const localIndex = useMemo<Hit[]>(() => [
    ...SPOTS.map((s) => ({ key: `g-${s.id}`, name: s.name, sub: "אסור לפספס", lat: s.lat, lng: s.lng, local: true, search: `${s.name} ${s.en}` })),
    ...(places ?? []).map((p) => ({ key: `p-${p.id}`, name: p.name, sub: CATS[p.category]?.label ?? "", lat: p.lat, lng: p.lng, address: p.address, local: true, search: `${p.name} ${p.address ?? ""}` })),
    ...(acts ?? []).filter((a) => typeof a.lat === "number").map((a) => ({ key: `a-${a.id}`, name: a.title, sub: `מהמסלול · ${a.time}`, lat: a.lat!, lng: a.lng!, address: a.address, local: true, search: `${a.title} ${a.address ?? ""}` })),
  ] as (Hit & { search: string })[], [places, acts]);

  async function runSearch(e?: FormEvent) {
    e?.preventDefault();
    const term = q.trim();
    if (!term) return;
    setSearching(true);
    setSearchErr(null);
    const low = term.toLowerCase();
    const local = (localIndex as (Hit & { search: string })[]).filter((h) => h.search.toLowerCase().includes(low)).slice(0, 4);
    setHits(local);
    try {
      const remote = await searchPlacesNear(term, bbox ?? undefined);
      const merged = [...local, ...remote.map((r, i) => ({ key: `r-${i}`, name: r.name, sub: r.address.split(",").slice(1, 3).join(","), lat: r.lat, lng: r.lng, address: r.address, local: false }))];
      setHits(merged);
      if (!merged.length) setSearchErr("לא נמצא. נסו באנגלית, למשל Chabad Berkeley או Pier 39.");
      else if (merged.length === 1) pick(merged[0]);
    } catch {
      if (!local.length) setSearchErr("החיפוש לא זמין כרגע. בדקו את החיבור לאינטרנט.");
    } finally {
      setSearching(false);
    }
  }

  function pick(h: Hit) {
    setHits(null);
    setQ(h.name);
    fly(h.lat, h.lng, 15);
    const saved = (places ?? []).find((p) => Math.abs(p.lat - h.lat) < 1e-5 && Math.abs(p.lng - h.lng) < 1e-5);
    setSel({ name: h.name, lat: h.lat, lng: h.lng, label: h.sub || "תוצאת חיפוש", address: h.address, savedId: saved?.id, canSave: !h.local });
  }

  async function findArea(kind: Poi["kind"]) {
    if (!bbox) return;
    if (zoom < 10) {
      setAreaMsg("התקרבו קצת במפה (לעיר או לשכונה), ואז חפשו שוב.");
      return;
    }
    setAreaBusy(kind);
    setAreaMsg(null);
    try {
      const r = await searchArea(kind, bbox);
      setPois((cur) => [...cur.filter((p) => p.kind !== kind), ...r]);
      setAreaMsg(r.length ? `נמצאו ${r.length} מקומות באזור שעל המפה. מקור: OpenStreetMap — כדאי לוודא כשרות ושעות במקום.` : "לא נמצאו מקומות באזור הזה במפה הפתוחה. אפשר לנסות את גוגל מפות.");
    } catch {
      setAreaMsg("החיפוש באזור לא זמין כרגע. נסו שוב בעוד רגע.");
    } finally {
      setAreaBusy(null);
    }
  }

  async function saveSel(e: FormEvent) {
    e.preventDefault();
    if (!sel) return;
    const price = saveCat === "lodging" && savePrice !== "" ? Math.max(0, Number(savePrice)) : null;
    const id = await store.add("places", { name: sel.name, address: sel.address ?? "", lat: sel.lat, lng: sel.lng, category: saveCat, price });
    setSel({ ...sel, savedId: id, canSave: false, label: CATS[saveCat].label, price });
    setSavePrice("");
  }

  async function loadShabbat() {
    setShabbatBusy(true);
    setShabbatErr(null);
    try { setShabbat(await shabbatTimes(center.lat, center.lng)); } catch { setShabbatErr("לא הצלחנו להביא את הזמנים כרגע."); } finally { setShabbatBusy(false); }
  }

  const fromLabel = origin.source === "gps" ? "ממך" : "ממרכז סן פרנסיסקו";
  const lodging = (places ?? []).filter((p) => p.category === "lodging").sort((a, b) => (a.price ?? 9999) - (b.price ?? 9999));
  const maxPrice = Math.max(1, ...lodging.map((p) => p.price ?? 0));
  const activeLayers = LAYERS.filter((l) => prefs.layers[l.id]).length;

  return (
    <div className="stack">
      <div className="chips-row chips-row--scroll" aria-label="קפיצה לאזור">
        {REGIONS.map((r) => (
          <button key={r.name} type="button" className="chip-btn" onClick={() => fly(r.lat, r.lng, r.z)}>{r.name}</button>
        ))}
      </div>

      <div className="map-wrap glass">
        <div ref={el} className="map" />

        <div className="map-search">
          <form className="map-search-bar" onSubmit={runSearch} role="search">
            <Icon name="search" />
            <input
              id="map-q"
              value={q}
              onChange={(e) => { setQ(e.target.value); if (!e.target.value) setHits(null); }}
              placeholder="כתובת, אטרקציה, בית חב״ד…"
              aria-label="חיפוש במפה"
              enterKeyHint="search"
              autoComplete="off"
            />
            {q && <button type="button" className="map-search-x" aria-label="ניקוי" onClick={() => { setQ(""); setHits(null); setSearchErr(null); }}>×</button>}
            <button type="submit" className="map-search-go" disabled={searching}>{searching ? <span className="spinner spinner--light" /> : "חיפוש"}</button>
          </form>
          {(hits || searchErr) && (
            <div className="map-results">
              {searchErr && <p className="hint">{searchErr}</p>}
              {hits?.map((h) => (
                <button key={h.key} type="button" onClick={() => pick(h)}>
                  <strong>{h.name}</strong>
                  <span>{h.local ? "★ " : ""}{h.sub}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="map-tools">
          <button type="button" className="map-tool" onClick={() => setLayersOpen((v) => !v)} aria-expanded={layersOpen}>
            שכבות <span className="map-tool-n">{activeLayers}</span>
          </button>
          <button type="button" className="map-tool" onClick={() => { locate(); if (origin.source === "gps") fly(origin.lat, origin.lng, 13); }} aria-label="המיקום שלי">
            <Icon name="pin" />המיקום שלי
          </button>
          {layersOpen && (
            <div className="layers-pop glass" role="group" aria-label="מה מוצג על המפה">
              {LAYERS.map((l) => (
                <label key={l.id} className="layer-row">
                  <input type="checkbox" checked={prefs.layers[l.id]} onChange={() => setPrefs((p) => ({ ...p, layers: { ...p.layers, [l.id]: !p.layers[l.id] } }))} />
                  {l.label}
                </label>
              ))}
              <p className="hint">הבחירה נשמרת לפעם הבאה.</p>
            </div>
          )}
        </div>
      </div>

      {sel && (
        <div className="panel glass sel-panel" ref={selRef}>
          <button type="button" className="toast-x" onClick={() => setSel(null)} aria-label="סגירה">×</button>
          <span className="label">{sel.label}</span>
          <h2 className="panel-title">{sel.name}</h2>
          {sel.photo && <img className="sel-photo" src={sel.photo} alt={sel.name} />}
          {sel.text && <p className="hint">{sel.text}</p>}
          {sel.address && <p className="hint">{sel.address.split(",").slice(0, 3).join(",")}</p>}
          {sel.price != null && <p className="price-tag">{usd(sel.price)} ללילה</p>}
          <p className="sel-dist"><Icon name="route" />{formatDrive(driveHours(origin, sel))} נסיעה {fromLabel}</p>
          <div className="act-actions">
            {wazeUrl(sel) && <a className="chip-btn chip-btn--waze" href={wazeUrl(sel)!} target="_blank" rel="noopener noreferrer"><Icon name="waze" />ניווט ב-Waze</a>}
            <a className="chip-btn" href={mapsSearchUrl(sel.name, sel.lat, sel.lng)} target="_blank" rel="noopener noreferrer">שעות וטלפון</a>
            {sel.savedId && (
              <button type="button" className="chip-btn chip-btn--danger" onClick={async () => { await store.remove("places", sel.savedId!); setSel(null); }}><Icon name="trash" />הסרה מהמפה</button>
            )}
          </div>
          {sel.canSave && !sel.savedId && (
            <form className="stack-sm save-place" onSubmit={saveSel}>
              <span className="label">לשמור במפה שלנו בתור:</span>
              <div className="chips-row">
                {(Object.keys(CATS) as Cat[]).map((c) => (
                  <button key={c} type="button" aria-pressed={saveCat === c} className={`chip-btn ${saveCat === c ? "chip-btn--on" : ""}`} onClick={() => setSaveCat(c)}>{CATS[c].label}</button>
                ))}
              </div>
              {saveCat === "lodging" && (
                <label className="fld"><span>מחיר ללילה בדולרים (0 = חינם)</span>
                  <input id="sel-price" className="field" type="number" inputMode="decimal" min="0" value={savePrice} onChange={(e) => setSavePrice(e.target.value)} />
                </label>
              )}
              <button type="submit" className="pill-btn pill-btn--dark">שמירה במפה</button>
            </form>
          )}
        </div>
      )}

      <div className="panel glass">
        <h2 className="panel-title">יהדות וכשרות באזור שעל המפה</h2>
        <div className="act-actions">
          <button type="button" className="chip-btn" onClick={() => findArea("kosher")} disabled={!!areaBusy}>{areaBusy === "kosher" ? "מחפשים…" : "K · כשר כאן"}</button>
          <button type="button" className="chip-btn" onClick={() => findArea("jewish")} disabled={!!areaBusy}>{areaBusy === "jewish" ? "מחפשים…" : "✡ בתי כנסת וחב״ד כאן"}</button>
          {pois.length > 0 && <button type="button" className="text-btn" onClick={() => { setPois([]); setAreaMsg(null); }}>ניקוי מהמפה</button>}
        </div>
        {areaMsg && <p className="hint">{areaMsg}</p>}
        <div className="act-actions">
          <a className="chip-btn" href={mapsSearchUrl("kosher restaurant", center.lat, center.lng)} target="_blank" rel="noopener noreferrer">כשר בגוגל מפות</a>
          <a className="chip-btn" href={mapsSearchUrl("Chabad", center.lat, center.lng)} target="_blank" rel="noopener noreferrer">חב״ד בגוגל מפות</a>
        </div>
        <div className="shabbat">
          <button type="button" className="pill-btn pill-btn--dark" onClick={loadShabbat} disabled={shabbatBusy}>
            <Icon name="candle" />{shabbatBusy ? "בודקים…" : "זמני שבת במקום הזה"}
          </button>
          {shabbatErr && <p className="gate-error">{shabbatErr}</p>}
          {shabbat && (
            <div className="shabbat-times">
              {shabbat.parasha && <span className="label">{shabbat.parasha}</span>}
              {shabbat.candles && <p><span>הדלקת נרות</span><strong>{shabbat.candles.time}</strong><small>{shabbat.candles.date}</small></p>}
              {shabbat.havdalah && <p><span>צאת שבת</span><strong>{shabbat.havdalah.time}</strong><small>{shabbat.havdalah.date}</small></p>}
              <small className="hint">לפי מרכז המפה · מקור: Hebcal</small>
            </div>
          )}
        </div>
      </div>

      <div className="panel glass">
        <h2 className="panel-title">השוואת לינה</h2>
        {lodging.length === 0 ? (
          <p className="hint">חפשו אכסניה בשורת החיפוש, ושמרו אותה בתור ״לינה״ עם מחיר — והיא תופיע כאן בהשוואה.</p>
        ) : (
          <ul className="lodge-list">
            {lodging.map((p) => (
              <li key={p.id}>
                <button type="button" className="link-like" onClick={() => { fly(p.lat, p.lng, 14); setSel({ name: p.name, lat: p.lat, lng: p.lng, label: "לינה", address: p.address, price: p.price, savedId: p.id }); }}>{p.name}</button>
                <span className="cat-bar"><i style={{ width: `${((p.price ?? 0) / maxPrice) * 100}%` }} /></span>
                <b>{p.price == null ? "—" : usd(p.price)}</b>
                <small>{formatDrive(driveHours(origin, p))}</small>
              </li>
            ))}
          </ul>
        )}
        <div className="act-actions">
          <a className="chip-btn" href={mapsSearchUrl("hostel", center.lat, center.lng)} target="_blank" rel="noopener noreferrer">אכסניות באזור שעל המפה</a>
        </div>
      </div>
    </div>
  );
}

// לשימוש עתידי בבחירת מקום מתוך החיפוש בדפים אחרים
export type { Place };
