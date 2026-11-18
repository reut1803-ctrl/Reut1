"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type * as Leaflet from "leaflet";
import { useRows, useTripCtx } from "@/lib/tripContext";
import { mapsSearchUrl, shabbatTimes, wazeUrl, type Place, type ShabbatTimes } from "@/lib/places";
import Icon from "../app/Icon";
import PlaceSearch from "../app/PlaceSearch";
import type { Activity } from "./PlanView";
import type { Photo } from "./JournalView";

type Cat = "attraction" | "chabad" | "kosher" | "torah" | "candles" | "lodging";
type SavedPlace = { id: string; name: string; category: Cat; lat: number; lng: number; address?: string; price?: number | null; notes?: string };

const CATS: Record<Cat, { label: string; mark: string; layer: Layer }> = {
  attraction: { label: "אטרקציה", mark: "★", layer: "attractions" },
  chabad: { label: "בית חב״ד", mark: "✡", layer: "jewish" },
  kosher: { label: "אוכל כשר", mark: "K", layer: "jewish" },
  torah: { label: "שיעור תורה", mark: "ת", layer: "jewish" },
  candles: { label: "הדלקת נרות", mark: "🕯", layer: "jewish" },
  lodging: { label: "לינה", mark: "⌂", layer: "lodging" },
};

type Layer = "attractions" | "jewish" | "lodging" | "photos" | "plan";
const LAYERS: { id: Layer; label: string }[] = [
  { id: "attractions", label: "אטרקציות" },
  { id: "jewish", label: "יהדות וכשרות" },
  { id: "lodging", label: "לינה" },
  { id: "plan", label: "המסלול שלנו" },
  { id: "photos", label: "תמונות" },
];

// אזורי הטיול המרכזיים — לחיצה מעיפה את המפה לשם
const REGIONS: { name: string; lat: number; lng: number; z: number }[] = [
  { name: "כל קליפורניה", lat: 36.7, lng: -119.4, z: 6 },
  { name: "לוס אנג׳לס", lat: 34.0522, lng: -118.2437, z: 10 },
  { name: "סן דייגו", lat: 32.7157, lng: -117.1611, z: 11 },
  { name: "פאלם ספרינגס", lat: 33.8303, lng: -116.5453, z: 11 },
  { name: "סנטה ברברה", lat: 34.4208, lng: -119.6982, z: 11 },
  { name: "ביג סור", lat: 36.2704, lng: -121.8081, z: 10 },
  { name: "יוסמיטי", lat: 37.7456, lng: -119.5936, z: 11 },
  { name: "סן פרנסיסקו", lat: 37.7749, lng: -122.4194, z: 11 },
  { name: "לייק טאהו", lat: 39.0968, lng: -120.0324, z: 10 },
];

const usd = (n: number) => (n === 0 ? "חינם" : "$" + n.toLocaleString("en-US"));

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

type Selected =
  | { kind: "place"; p: SavedPlace }
  | { kind: "photo"; p: Photo }
  | { kind: "act"; p: Activity };

export default function MapView() {
  const { store } = useTripCtx();
  const places = useRows<SavedPlace>("places");
  const photos = useRows<Photo>("photos");
  const acts = useRows<Activity>("activities");
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const LRef = useRef<typeof Leaflet | null>(null);
  const groupRef = useRef<Leaflet.LayerGroup | null>(null);
  const [ready, setReady] = useState(false);
  const [center, setCenter] = useState({ lat: 36.7, lng: -119.4 });
  const [layers, setLayers] = useState<Record<Layer, boolean>>({ attractions: true, jewish: true, lodging: true, photos: true, plan: true });
  const [sel, setSel] = useState<Selected | null>(null);
  const [adding, setAdding] = useState<Place | null>(null);
  const [addCat, setAddCat] = useState<Cat>("attraction");
  const [addPrice, setAddPrice] = useState("");
  const [shabbat, setShabbat] = useState<ShabbatTimes | null>(null);
  const [shabbatErr, setShabbatErr] = useState<string | null>(null);
  const [shabbatBusy, setShabbatBusy] = useState(false);

  // יצירת המפה פעם אחת
  useEffect(() => {
    let map: Leaflet.Map | null = null;
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !el.current) return;
      map = L.map(el.current, { zoomControl: true, attributionControl: true }).setView([36.7, -119.4], 6);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap",
      }).addTo(map);
      groupRef.current = L.layerGroup().addTo(map);
      map.on("moveend", () => {
        const c = map!.getCenter();
        setCenter({ lat: c.lat, lng: c.lng });
      });
      LRef.current = L;
      mapRef.current = map;
      setReady(true);
    })();
    return () => {
      cancelled = true;
      map?.remove();
      mapRef.current = null;
    };
  }, []);

  // נעצים
  useEffect(() => {
    const L = LRef.current;
    const g = groupRef.current;
    if (!ready || !L || !g) return;
    g.clearLayers();
    const icon = (cls: string, html: string) =>
      L.divIcon({ className: "pin-wrap", html: `<span class="pin ${cls}">${html}</span>`, iconSize: [34, 34], iconAnchor: [17, 34] });

    for (const p of places ?? []) {
      const c = CATS[p.category] ?? CATS.attraction;
      if (!layers[c.layer] || typeof p.lat !== "number") continue;
      L.marker([p.lat, p.lng], { icon: icon(`pin--${p.category}`, esc(c.mark)), title: p.name })
        .on("click", () => setSel({ kind: "place", p }))
        .addTo(g);
    }
    if (layers.photos) {
      for (const ph of photos ?? []) {
        if (typeof ph.lat !== "number" || typeof ph.lng !== "number") continue;
        L.marker([ph.lat, ph.lng], {
          icon: L.divIcon({ className: "pin-wrap", html: `<span class="pin pin--photo"><img src="${ph.thumb}" alt=""/></span>`, iconSize: [44, 44], iconAnchor: [22, 44] }),
        })
          .on("click", () => setSel({ kind: "photo", p: ph }))
          .addTo(g);
      }
    }
    if (layers.plan) {
      for (const a of acts ?? []) {
        if (typeof a.lat !== "number" || typeof a.lng !== "number") continue;
        L.marker([a.lat, a.lng], { icon: icon("pin--plan", esc(a.time || "•")), title: a.title })
          .on("click", () => setSel({ kind: "act", p: a }))
          .addTo(g);
      }
    }
  }, [ready, places, photos, acts, layers]);

  const lodgingLA = useMemo(
    () =>
      (places ?? [])
        .filter((p) => p.category === "lodging")
        .sort((a, b) => (a.price ?? 9999) - (b.price ?? 9999)),
    [places],
  );
  const maxPrice = Math.max(1, ...lodgingLA.map((p) => p.price ?? 0));

  function fly(lat: number, lng: number, z: number) {
    mapRef.current?.flyTo([lat, lng], z, { duration: 1.2 });
  }

  async function savePlace(e: FormEvent) {
    e.preventDefault();
    if (!adding) return;
    const price = addCat === "lodging" && addPrice !== "" ? Math.max(0, Number(addPrice)) : null;
    await store.add("places", { name: adding.name, address: adding.address, lat: adding.lat, lng: adding.lng, category: addCat, price });
    fly(adding.lat, adding.lng, 14);
    setAdding(null);
    setAddPrice("");
  }

  async function loadShabbat() {
    setShabbatBusy(true);
    setShabbatErr(null);
    try {
      setShabbat(await shabbatTimes(center.lat, center.lng));
    } catch {
      setShabbatErr("לא הצלחנו להביא את הזמנים כרגע. בדקו את החיבור לאינטרנט.");
    } finally {
      setShabbatBusy(false);
    }
  }

  return (
    <div className="stack">
      <div className="chips-row chips-row--scroll" aria-label="אזורי הטיול">
        {REGIONS.map((r) => (
          <button key={r.name} type="button" className="chip-btn" onClick={() => fly(r.lat, r.lng, r.z)}>{r.name}</button>
        ))}
      </div>

      <div className="map-wrap glass">
        <div ref={el} className="map" />
      </div>

      <div className="chips-row" aria-label="שכבות במפה">
        {LAYERS.map((l) => (
          <button key={l.id} type="button" aria-pressed={layers[l.id]} className={`chip-btn ${layers[l.id] ? "chip-btn--on" : ""}`}
            onClick={() => setLayers((s) => ({ ...s, [l.id]: !s[l.id] }))}>{l.label}</button>
        ))}
      </div>

      {sel && (
        <div className="panel glass sel-panel">
          <button type="button" className="toast-x" onClick={() => setSel(null)} aria-label="סגירה">×</button>
          {sel.kind === "place" && (
            <>
              <span className="label">{CATS[sel.p.category]?.label}</span>
              <h2 className="panel-title">{sel.p.name}</h2>
              {sel.p.address && <p className="hint">{sel.p.address.split(",").slice(0, 3).join(",")}</p>}
              {sel.p.category === "lodging" && sel.p.price != null && <p className="price-tag">{usd(sel.p.price)} ללילה</p>}
              <div className="act-actions">
                {wazeUrl(sel.p) && <a className="chip-btn chip-btn--waze" href={wazeUrl(sel.p)!} target="_blank" rel="noopener noreferrer"><Icon name="waze" />ניווט ב-Waze</a>}
                <button type="button" className="chip-btn chip-btn--danger" onClick={async () => { await store.remove("places", sel.p.id); setSel(null); }}><Icon name="trash" />הסרה מהמפה</button>
              </div>
            </>
          )}
          {sel.kind === "photo" && (
            <>
              <img className="sel-photo" src={sel.p.thumb} alt={sel.p.caption || "תמונה מהטיול"} />
              <p className="hint">{sel.p.caption || "תמונה"} · {sel.p.byName}</p>
            </>
          )}
          {sel.kind === "act" && (
            <>
              <span className="label">מהמסלול · {sel.p.time}</span>
              <h2 className="panel-title">{sel.p.title}</h2>
              {wazeUrl(sel.p) && <a className="chip-btn chip-btn--waze" href={wazeUrl(sel.p)!} target="_blank" rel="noopener noreferrer"><Icon name="waze" />ניווט ב-Waze</a>}
            </>
          )}
        </div>
      )}

      <div className="panel glass">
        <h2 className="panel-title">הוספת מקום למפה</h2>
        {adding ? (
          <form onSubmit={savePlace} className="stack-sm">
            <div className="picked"><Icon name="pin" /><span><strong>{adding.name}</strong> · {adding.address.split(",").slice(1, 3).join(",")}</span></div>
            <div className="chips-row" role="radiogroup" aria-label="סוג המקום">
              {(Object.keys(CATS) as Cat[]).map((c) => (
                <button key={c} type="button" role="radio" aria-checked={addCat === c} className={`chip-btn ${addCat === c ? "chip-btn--on" : ""}`} onClick={() => setAddCat(c)}>{CATS[c].label}</button>
              ))}
            </div>
            {addCat === "lodging" && (
              <label className="fld"><span>מחיר ללילה בדולרים (0 = חינם)</span>
                <input id="place-price" className="field" type="number" inputMode="decimal" min="0" value={addPrice} onChange={(e) => setAddPrice(e.target.value)} />
              </label>
            )}
            <div className="row-end">
              <button type="button" className="text-btn" onClick={() => setAdding(null)}>ביטול</button>
              <button type="submit" className="pill-btn pill-btn--dark">נעיצה במפה</button>
            </div>
          </form>
        ) : (
          <PlaceSearch idPrefix="map-add" onPick={(p) => { setAdding(p); fly(p.lat, p.lng, 14); }} placeholder="שם מקום, למשל Chabad of Santa Monica" />
        )}
      </div>

      <div className="panel glass">
        <h2 className="panel-title">יהדות וכשרות באזור שעל המפה</h2>
        <p className="hint">החיפושים נפתחים בגוגל מפות, סביב המקום שבמרכז המפה כרגע.</p>
        <div className="act-actions">
          <a className="chip-btn" href={mapsSearchUrl("Chabad", center.lat, center.lng)} target="_blank" rel="noopener noreferrer">✡ בתי חב״ד קרובים</a>
          <a className="chip-btn" href={mapsSearchUrl("kosher restaurant", center.lat, center.lng)} target="_blank" rel="noopener noreferrer">מסעדות כשרות</a>
          <a className="chip-btn" href={mapsSearchUrl("Chabad Torah class", center.lat, center.lng)} target="_blank" rel="noopener noreferrer">שיעורי תורה</a>
          <a className="chip-btn" href={mapsSearchUrl("kosher grocery", center.lat, center.lng)} target="_blank" rel="noopener noreferrer">מכולת כשרה</a>
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
              <small className="hint">לפי המיקום שבמרכז המפה · מקור: Hebcal</small>
            </div>
          )}
        </div>
      </div>

      <div className="panel glass">
        <h2 className="panel-title">השוואת לינה</h2>
        {lodgingLA.length === 0 ? (
          <p className="hint">עוד אין מקומות לינה. חפשו אכסניה למעלה, סמנו ״לינה״ והוסיפו מחיר, והיא תופיע כאן בהשוואה.</p>
        ) : (
          <ul className="cat-bars">
            {lodgingLA.map((p) => (
              <li key={p.id}>
                <button type="button" className="link-like" onClick={() => { fly(p.lat, p.lng, 14); setSel({ kind: "place", p }); }}>{p.name}</button>
                <span className="cat-bar"><i style={{ width: `${((p.price ?? 0) / maxPrice) * 100}%` }} /></span>
                <b>{p.price == null ? "—" : usd(p.price)}</b>
              </li>
            ))}
          </ul>
        )}
        <div className="act-actions">
          <a className="chip-btn" href={mapsSearchUrl("hostel", center.lat, center.lng)} target="_blank" rel="noopener noreferrer">אכסניות באזור</a>
          <a className="chip-btn" href={mapsSearchUrl("hostel Los Angeles")} target="_blank" rel="noopener noreferrer">אכסניות בלוס אנג׳לס</a>
        </div>
      </div>
    </div>
  );
}
