// חיפוש מקומות דרך השרת שלנו ב-Vercel (ולא ישירות מהטלפון):
// שירותי החיפוש החינמיים חוסמים לעיתים קרובות בקשות מדפדפנים ומדפדפנים מובנים של אפליקציות.
// מהשרת אפשר להזדהות כראוי, ויש גיבוי אם שירות אחד לא עונה. רק חברי הטיול יכולים להשתמש בו.

import { firebaseConfig } from "@/lib/firebase-config";
import { TRIP_ID } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const UA = "CaliforniaShelanuTripApp/1.0 (private family trip planner; https://reut1-k5zj.vercel.app)";

type Place = { name: string; address: string; lat: number; lng: number };
type Poi = Place & { id: string; kind: "kosher" | "jewish" };
type Bbox = { s: number; w: number; n: number; e: number };

const ok = (body: unknown) => new Response(JSON.stringify(body), { headers: { "Content-Type": "application/json; charset=utf-8" } });
const fail = (status: number, code: string) => new Response(JSON.stringify({ code }), { status, headers: { "Content-Type": "application/json" } });

async function isMember(token: string) {
  const r = await fetch(`https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/trips/${TRIP_ID}`, {
    headers: { Authorization: `Bearer ${token}` }, cache: "no-store",
  });
  return r.ok;
}

async function withTimeout(url: string, init: RequestInit = {}, ms = 9000) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  try { return await fetch(url, { ...init, signal: ac.signal, cache: "no-store" }); } finally { clearTimeout(t); }
}

async function nominatim(q: string, b?: Bbox): Promise<Place[]> {
  const vb = b ? `&viewbox=${b.w},${b.n},${b.e},${b.s}&bounded=0` : "";
  const r = await withTimeout(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=7&accept-language=he,en&countrycodes=us${vb}&q=${encodeURIComponent(q)}`, { headers: { "User-Agent": UA, Accept: "application/json" } });
  if (!r.ok) throw new Error(`nominatim ${r.status}`);
  const d = (await r.json()) as { name?: string; display_name: string; lat: string; lon: string }[];
  return d.map((x) => ({ name: x.name || x.display_name.split(",")[0], address: x.display_name, lat: +x.lat, lng: +x.lon }));
}

async function photon(q: string, b?: Bbox): Promise<Place[]> {
  const bias = b ? `&lat=${((b.n + b.s) / 2).toFixed(4)}&lon=${((b.e + b.w) / 2).toFixed(4)}` : "&lat=37.7749&lon=-122.4194";
  const r = await withTimeout(`https://photon.komoot.io/api/?limit=7&lang=en${bias}&q=${encodeURIComponent(q)}`, { headers: { "User-Agent": UA } });
  if (!r.ok) throw new Error(`photon ${r.status}`);
  const d = (await r.json()) as { features: { geometry: { coordinates: [number, number] }; properties: Record<string, string> }[] };
  return d.features
    .filter((f) => !f.properties.countrycode || f.properties.countrycode === "US")
    .map((f) => {
      const p = f.properties;
      const address = [p.name, [p.housenumber, p.street].filter(Boolean).join(" "), p.city, p.state].filter(Boolean).join(", ");
      return { name: p.name || p.street || p.city || q, address, lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0] };
    });
}

const OVERPASS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter", "https://maps.mail.ru/osm/tools/overpass/api/interpreter"];

async function area(kind: Poi["kind"], b: Bbox): Promise<Poi[]> {
  const bb = `(${b.s.toFixed(4)},${b.w.toFixed(4)},${b.n.toFixed(4)},${b.e.toFixed(4)})`;
  const query = kind === "kosher"
    ? `[out:json][timeout:20];(nwr["diet:kosher"~"yes|only"]${bb};nwr["cuisine"~"kosher"]${bb};);out center 60;`
    : `[out:json][timeout:20];(nwr["amenity"="place_of_worship"]["religion"="jewish"]${bb};nwr["name"~"Chabad",i]${bb};);out center 60;`;
  let lastErr: unknown;
  for (const url of OVERPASS) {
    try {
      const r = await withTimeout(url, { method: "POST", body: "data=" + encodeURIComponent(query), headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": UA } }, 15000);
      if (!r.ok) throw new Error(`overpass ${r.status}`);
      const d = (await r.json()) as { elements: { type: string; id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> }[] };
      const seen = new Set<string>();
      return d.elements.flatMap((el) => {
        const lat = el.lat ?? el.center?.lat;
        const lng = el.lon ?? el.center?.lon;
        if (typeof lat !== "number" || typeof lng !== "number") return [];
        const t = el.tags ?? {};
        const name = t["name:he"] || t.name || (kind === "kosher" ? "מקום כשר" : "בית כנסת");
        const key = name + lat.toFixed(3);
        if (seen.has(key)) return [];
        seen.add(key);
        const address = [[t["addr:housenumber"], t["addr:street"]].filter(Boolean).join(" "), t["addr:city"]].filter(Boolean).join(", ");
        return [{ id: `${el.type}/${el.id}`, name, lat, lng, kind, address }];
      });
    } catch (e) { lastErr = e; }
  }
  throw lastErr;
}

// ---------- פרטי מקום: תמונה (ויקיפדיה/ויקימדיה) + שעות, טלפון ואתר (OpenStreetMap) ----------

type Details = { image: string | null; imageFull: string | null; extract: string | null; hours: string | null; fee: string | null; website: string | null; phone: string | null };
const detailsCache = new Map<string, { at: number; v: Details }>();

async function wikiSummary(title: string) {
  const r = await withTimeout(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`, { headers: { "User-Agent": UA, Accept: "application/json" } }, 8000);
  if (!r.ok) return null;
  const d = (await r.json()) as { thumbnail?: { source: string }; originalimage?: { source: string }; extract?: string };
  const thumb = d.thumbnail?.source ?? null;
  // מבקשים גרסה ברוחב 960 — חדה גם בטלפון ועדיין קלה
  const big = thumb ? thumb.replace(/\/(\d+)px-/, "/960px-") : null;
  return { image: big ?? d.originalimage?.source ?? null, imageFull: d.originalimage?.source ?? big, extract: d.extract ?? null };
}

function rxEscape(s: string) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

async function osmTags(name: string, lat: number, lng: number) {
  const core = name.split(/[(,]/)[0].trim();
  const query = `[out:json][timeout:15];nwr(around:450,${lat.toFixed(5)},${lng.toFixed(5)})["name"~"${rxEscape(core).replace(/"/g, "")}",i];out tags 5;`;
  for (const url of OVERPASS) {
    try {
      const r = await withTimeout(url, { method: "POST", body: "data=" + encodeURIComponent(query), headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": UA } }, 12000);
      if (!r.ok) continue;
      const d = (await r.json()) as { elements: { tags?: Record<string, string> }[] };
      const tags = d.elements.map((e) => e.tags ?? {}).sort((a, b) => Number(!!b.opening_hours) - Number(!!a.opening_hours))[0];
      return tags ?? null;
    } catch { /* המראה הבאה */ }
  }
  return null;
}

async function details(b: { name: string; enName?: string; wiki?: string; lat: number; lng: number }): Promise<Details> {
  const key = `${b.wiki ?? ""}|${b.enName ?? b.name}|${b.lat.toFixed(4)}`;
  const hit = detailsCache.get(key);
  if (hit && Date.now() - hit.at < 6 * 3600_000) return hit.v;
  const [w, t] = await Promise.allSettled([
    b.wiki ? wikiSummary(b.wiki) : Promise.resolve(null),
    osmTags(b.enName || b.name, b.lat, b.lng),
  ]);
  const wiki = w.status === "fulfilled" ? w.value : null;
  const tags = t.status === "fulfilled" ? t.value : null;
  const v: Details = {
    image: wiki?.image ?? null,
    imageFull: wiki?.imageFull ?? null,
    extract: wiki?.extract ?? null,
    hours: tags?.opening_hours ?? null,
    fee: tags?.fee ?? tags?.charge ?? null,
    website: tags?.website ?? tags?.["contact:website"] ?? null,
    phone: tags?.phone ?? tags?.["contact:phone"] ?? null,
  };
  detailsCache.set(key, { at: Date.now(), v });
  return v;
}

export async function POST(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token || !(await isMember(token))) return fail(401, "not_member");

  let body: { action?: string; q?: string; bbox?: Bbox; kind?: Poi["kind"]; name?: string; enName?: string; wiki?: string; lat?: number; lng?: number };
  try { body = await req.json(); } catch { return fail(400, "bad_request"); }

  try {
    if (body.action === "details" && body.name && typeof body.lat === "number" && typeof body.lng === "number") {
      return ok({ results: await details({ name: body.name.slice(0, 120), enName: body.enName?.slice(0, 120), wiki: body.wiki?.slice(0, 120), lat: body.lat, lng: body.lng }) });
    }
    if (body.action === "area" && body.bbox && (body.kind === "kosher" || body.kind === "jewish")) {
      return ok({ results: await area(body.kind, body.bbox) });
    }
    const q = (body.q ?? "").trim().slice(0, 200);
    if (!q) return fail(400, "empty");
    try {
      const r = await nominatim(q, body.bbox);
      if (r.length) return ok({ results: r, source: "nominatim" });
    } catch { /* ננסה את הגיבוי */ }
    return ok({ results: await photon(q, body.bbox), source: "photon" });
  } catch {
    return fail(502, "upstream");
  }
}
