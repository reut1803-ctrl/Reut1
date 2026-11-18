// חיפוש מקומות (OpenStreetMap, חינם), קישורי Waze וגוגל מפות, וזמני שבת (Hebcal).

export type Place = { name: string; address: string; lat: number; lng: number };

export function wazeUrl(p: { lat?: number | null; lng?: number | null; address?: string | null }): string | null {
  if (typeof p.lat === "number" && typeof p.lng === "number") return `https://waze.com/ul?ll=${p.lat},${p.lng}&navigate=yes`;
  if (p.address) return `https://waze.com/ul?q=${encodeURIComponent(p.address)}&navigate=yes`;
  return null;
}

export function mapsSearchUrl(query: string, lat?: number, lng?: number): string {
  const q = lat != null && lng != null ? `${query} near ${lat.toFixed(4)},${lng.toFixed(4)}` : query;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

export type ShabbatTimes = { candles?: { date: string; time: string }; havdalah?: { date: string; time: string }; parasha?: string; place: string };

export async function shabbatTimes(lat: number, lng: number): Promise<ShabbatTimes> {
  const url = `https://www.hebcal.com/shabbat?cfg=json&latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}&tzid=America/Los_Angeles&M=on&lg=he`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("hebcal failed");
  const data = (await res.json()) as { location?: { title?: string }; items: { category: string; date: string; title: string; hebrew?: string }[] };
  const pick = (cat: string) => {
    const it = data.items.find((i) => i.category === cat);
    if (!it) return undefined;
    const d = new Date(it.date);
    return {
      date: new Intl.DateTimeFormat("he-IL", { timeZone: "America/Los_Angeles", weekday: "long", day: "numeric", month: "long" }).format(d),
      time: new Intl.DateTimeFormat("he-IL", { timeZone: "America/Los_Angeles", hour: "2-digit", minute: "2-digit", hour12: false }).format(d),
    };
  };
  const par = data.items.find((i) => i.category === "parashat");
  return { candles: pick("candles"), havdalah: pick("havdalah"), parasha: par?.hebrew ?? par?.title, place: data.location?.title ?? "" };
}

export function currentPosition(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
    );
  });
}

// ---------- חיפוש באזור שעל המפה (OpenStreetMap / Overpass, חינם) ----------

export type Poi = { id: string; name: string; lat: number; lng: number; kind: "kosher" | "jewish"; address: string };
export type Bbox = { s: number; w: number; n: number; e: number };

/** מקומות כשרים / בתי כנסת וחב״ד בתוך התחום שעל המפה. הנתונים מ-OpenStreetMap — ייתכן שחסרים מקומות. */
async function searchAreaDirect(kind: Poi["kind"], b: Bbox): Promise<Poi[]> {
  const bb = `(${b.s.toFixed(4)},${b.w.toFixed(4)},${b.n.toFixed(4)},${b.e.toFixed(4)})`;
  const body =
    kind === "kosher"
      ? `[out:json][timeout:20];(nwr["diet:kosher"~"yes|only"]${bb};nwr["cuisine"~"kosher"]${bb};);out center 60;`
      : `[out:json][timeout:20];(nwr["amenity"="place_of_worship"]["religion"="jewish"]${bb};nwr["name"~"Chabad",i]${bb};);out center 60;`;
  const res = await fetch("https://overpass-api.de/api/interpreter", { method: "POST", body: "data=" + encodeURIComponent(body), headers: { "Content-Type": "application/x-www-form-urlencoded" } });
  if (!res.ok) throw new Error("overpass");
  const data = (await res.json()) as { elements: { type: string; id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> }[] };
  const seen = new Set<string>();
  return data.elements
    .map((el) => {
      const lat = el.lat ?? el.center?.lat;
      const lng = el.lon ?? el.center?.lon;
      const t = el.tags ?? {};
      const name = t["name:he"] || t.name || (kind === "kosher" ? "מקום כשר" : "בית כנסת");
      const address = [t["addr:housenumber"], t["addr:street"], t["addr:city"]].filter(Boolean).join(" ");
      return { id: `${el.type}/${el.id}`, name, lat: lat!, lng: lng!, kind, address };
    })
    .filter((p) => typeof p.lat === "number" && typeof p.lng === "number" && !seen.has(p.name + p.lat.toFixed(3)) && seen.add(p.name + p.lat.toFixed(3)));
}

/** חיפוש כתובת/מקום עם העדפה לאזור שמוצג על המפה */
async function searchPlacesNearDirect(q: string, b?: Bbox): Promise<Place[]> {
  const vb = b ? `&viewbox=${b.w},${b.n},${b.e},${b.s}&bounded=0` : "";
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&accept-language=he,en&countrycodes=us${vb}&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("search failed");
  const data = (await res.json()) as { name?: string; display_name: string; lat: string; lon: string }[];
  return data.map((d) => ({ name: d.name || d.display_name.split(",")[0], address: d.display_name, lat: Number(d.lat), lng: Number(d.lon) }));
}

// ---------- חיפוש דרך השרת שלנו (עם גיבוי ישיר) ----------

/** מילים נפוצות בעברית ← באנגלית, כדי ששירותי המפה האמריקאיים יבינו */
const HE_TERMS: [RegExp, string][] = [
  [/בית\s*חב["״׳']?ד|חב["״׳']?ד/g, "Chabad"],
  [/בית\s*כנסת/g, "synagogue"],
  [/מסעד(ה|ות)\s*כשר(ה|ות)?/g, "kosher restaurant"],
  [/מכולת\s*כשרה|סופר\s*כשר/g, "kosher grocery"],
  [/כשר(ה|ים|ות)?/g, "kosher"],
  [/מקווה/g, "mikvah"],
  [/סופר(מרקט)?/g, "supermarket"],
  [/בית\s*מרקחת/g, "pharmacy"],
  [/תחנת\s*דלק/g, "gas station"],
  [/חוף/g, "beach"],
  [/פארק/g, "park"],
  // ערים — גם עם אות שימוש לפני (ב/ל/מ/ו)
  [/(^|\s)[בלמו]?סן\s*פרנסיסקו/g, "$1San Francisco"],
  [/(^|\s)[בלמו]?ברקלי/g, "$1Berkeley"],
  [/(^|\s)[בלמו]?אוקלנד/g, "$1Oakland"],
  [/(^|\s)[בלמו]?פאלו\s*אלטו/g, "$1Palo Alto"],
  [/(^|\s)[בלמו]?סן\s*חוזה/g, "$1San Jose"],
  [/(^|\s)[בלמו]?סוסליטו/g, "$1Sausalito"],
  [/(^|\s)[בלמו]?סנטה\s*קרוז/g, "$1Santa Cruz"],
  [/(^|\s)[בלמו]?מונטריי/g, "$1Monterey"],
  [/(^|\s)[בלמו]?לוס\s*אנג׳?'?לס/g, "$1Los Angeles"],
];

export function toSearchTerms(q: string): string {
  let out = q;
  for (const [re, en] of HE_TERMS) out = out.replace(re, en);
  return out.replace(/\s+/g, " ").trim();
}

/** מזהה חיפוש של מקום יהודי/כשר — כדי להפעיל גם חיפוש אזור אמיתי */
export function jewishIntent(q: string): Poi["kind"] | null {
  if (/כשר|kosher/i.test(q)) return "kosher";
  if (/חב["״׳']?ד|chabad|בית\s*כנסת|synagogue|shul|מקווה/i.test(q)) return "jewish";
  return null;
}

async function idToken(): Promise<string | null> {
  try {
    const { fb } = await import("./firebase");
    return (await fb.auth().currentUser?.getIdToken()) ?? null;
  } catch {
    return null; // מצב תצוגה / לא מחובר
  }
}

export async function viaServer<T>(payload: Record<string, unknown>): Promise<T | null> {
  const token = await idToken();
  if (!token) return null;
  const r = await fetch("/api/geo", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
  if (!r.ok) throw new Error(`geo ${r.status}`);
  return ((await r.json()) as { results: T }).results;
}

export async function searchPlacesNear(q: string, b?: Bbox): Promise<Place[]> {
  const terms = toSearchTerms(q);
  try {
    const r = await viaServer<Place[]>({ action: "search", q: terms, bbox: b });
    if (r) return r;
  } catch { /* ננסה ישירות */ }
  return searchPlacesNearDirect(terms, b);
}

export async function searchPlaces(q: string): Promise<Place[]> {
  return searchPlacesNear(q);
}

export async function searchArea(kind: Poi["kind"], b: Bbox): Promise<Poi[]> {
  try {
    const r = await viaServer<Poi[]>({ action: "area", kind, bbox: b });
    if (r) return r;
  } catch { /* ננסה ישירות */ }
  return searchAreaDirect(kind, b);
}
