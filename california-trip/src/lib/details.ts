"use client";

import { viaServer } from "./places";

export type PlaceDetails = { image: string | null; imageFull: string | null; extract: string | null; hours: string | null; fee: string | null; website: string | null; phone: string | null };
export type DetailsQuery = { name: string; enName?: string; wiki?: string; lat: number; lng: number };

const mem = new Map<string, PlaceDetails>();

async function direct(q: DetailsQuery): Promise<PlaceDetails> {
  const out: PlaceDetails = { image: null, imageFull: null, extract: null, hours: null, fee: null, website: null, phone: null };
  if (q.wiki) {
    try {
      const r = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q.wiki)}`);
      if (r.ok) {
        const d = await r.json();
        const thumb: string | undefined = d.thumbnail?.source;
        out.image = thumb ? thumb.replace(/\/(\d+)px-/, "/960px-") : d.originalimage?.source ?? null;
        out.imageFull = d.originalimage?.source ?? out.image;
        out.extract = d.extract ?? null;
      }
    } catch { /* */ }
  }
  return out;
}

/** פרטי מקום — דרך השרת שלנו, ואם אין חיבור לשרת: ישירות מוויקיפדיה (תמונה בלבד) */
export async function placeDetails(q: DetailsQuery): Promise<PlaceDetails> {
  const key = `${q.wiki ?? ""}|${q.enName ?? q.name}|${q.lat.toFixed(4)}`;
  const cached = mem.get(key);
  if (cached) return cached;
  try {
    const raw = sessionStorage.getItem("pd:" + key);
    if (raw) { const v = JSON.parse(raw); mem.set(key, v); return v; }
  } catch { /* */ }
  let v: PlaceDetails | null = null;
  try { v = await viaServer<PlaceDetails>({ action: "details", ...q }); } catch { /* */ }
  if (!v) v = await direct(q);
  mem.set(key, v);
  try { sessionStorage.setItem("pd:" + key, JSON.stringify(v)); } catch { /* */ }
  return v;
}

const DAYS: [RegExp, string][] = [[/\bMo\b/g, "ב׳"], [/\bTu\b/g, "ג׳"], [/\bWe\b/g, "ד׳"], [/\bTh\b/g, "ה׳"], [/\bFr\b/g, "ו׳"], [/\bSa\b/g, "ש׳"], [/\bSu\b/g, "א׳"], [/\bPH\b/g, "חגים"]];

/** הופך שעות בפורמט OpenStreetMap ("Mo-Fr 09:00-17:00; Sa off") לשורות בעברית */
export function hoursLines(raw: string): string[] {
  if (/^24\/7$/.test(raw.trim())) return ["פתוח 24 שעות, כל יום"];
  return raw.split(";").map((part) => {
    let t = part.trim();
    for (const [re, he] of DAYS) t = t.replace(re, he);
    return t.replace(/\boff\b|\bclosed\b/gi, "סגור").replace(/,/g, ", ").replace(/-/g, "–");
  }).filter(Boolean);
}
