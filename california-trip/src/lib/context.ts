"use client";

import { useCallback, useEffect, useState } from "react";
import { SF_CENTER } from "@/content/sfGuide";

// ---------- מיקום ----------

export type Origin = { lat: number; lng: number; source: "gps" | "sf" };

export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const x = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

/** הערכת זמן נסיעה ברכב (שעות): מרחק בכבישים ≈ 1.25 מהקו הישר; בעיר לאט, בכביש מהיר מהר */
export function driveHours(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const road = distanceKm(a, b) * 1.25;
  const speed = road < 25 ? 32 : road < 80 ? 60 : 82;
  return road / speed + 0.1;
}

export function formatDrive(h: number) {
  if (h < 0.25) return "כמה דקות";
  if (h < 1) return `כ-${Math.round((h * 60) / 5) * 5} דק׳`;
  const r = Math.round(h * 2) / 2;
  const named: Record<number, string> = { 1: "כשעה", 1.5: "כשעה וחצי", 2: "כשעתיים", 2.5: "כשעתיים וחצי" };
  return named[r] ?? `כ-${r} שעות`;
}

/** המיקום שלכם — רק אם כבר אישרתם גישה; אחרת סן פרנסיסקו. לא קופצת בקשת הרשאה בלי לחיצה. */
export function useOrigin() {
  const [origin, setOrigin] = useState<Origin>({ ...SF_CENTER, source: "sf" });
  const locate = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => setOrigin({ lat: p.coords.latitude, lng: p.coords.longitude, source: "gps" }),
      () => {},
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60000 },
    );
  }, []);
  useEffect(() => {
    const perms = (navigator as Navigator & { permissions?: { query: (d: { name: string }) => Promise<{ state: string }> } }).permissions;
    perms?.query({ name: "geolocation" }).then((r) => { if (r.state === "granted") locate(); }).catch(() => {});
  }, [locate]);
  return { origin, locate };
}

// ---------- מטמון קטן לבקשות רשת ----------

async function cached<T>(key: string, ttlMin: number, load: () => Promise<T>): Promise<T> {
  try {
    const raw = sessionStorage.getItem(key);
    if (raw) {
      const { at, v } = JSON.parse(raw);
      if (Date.now() - at < ttlMin * 60000) return v as T;
    }
  } catch { /* */ }
  const v = await load();
  try { sessionStorage.setItem(key, JSON.stringify({ at: Date.now(), v })); } catch { /* */ }
  return v;
}

// ---------- מזג אוויר (Open-Meteo, חינם, בלי מפתח) ----------

export type WeatherKind = "clear" | "cloudy" | "fog" | "rain" | "snow" | "storm";
export type Weather = { temp: number; kind: WeatherKind; label: string; rainSoon: boolean; sunset: number | null; isDay: boolean };

function kindOf(code: number): WeatherKind {
  if (code === 0 || code === 1) return "clear";
  if (code === 2 || code === 3) return "cloudy";
  if (code === 45 || code === 48) return "fog";
  if (code >= 71 && code <= 77) return "snow";
  if (code >= 95) return "storm";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 86)) return "rain";
  return "cloudy";
}
const LABEL: Record<WeatherKind, string> = { clear: "בהיר", cloudy: "מעונן", fog: "ערפל", rain: "גשם", snow: "שלג", storm: "סופה" };

export function useWeather(lat: number, lng: number) {
  const [w, setW] = useState<Weather | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let off = false;
    const key = `wx:${lat.toFixed(2)},${lng.toFixed(2)}`;
    cached(key, 20, async () => {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(3)}&longitude=${lng.toFixed(3)}&current=temperature_2m,weather_code,is_day&hourly=precipitation_probability&daily=sunset&timezone=auto&forecast_days=2`;
      const r = await fetch(url);
      if (!r.ok) throw new Error("weather");
      const d = await r.json();
      const nowLocal = String(d.current.time).slice(0, 13);
      const idx = Math.max(0, (d.hourly.time as string[]).findIndex((t) => t.slice(0, 13) >= nowLocal));
      const probs = (d.hourly.precipitation_probability as number[]).slice(idx, idx + 3);
      const kind = kindOf(d.current.weather_code);
      // השקיעה: זמן מקומי של המקום, ללא אזור — הופכים לרגע אמיתי לפי ההפרש שהשירות מחזיר
      const sunsetLocal = (d.daily.sunset as string[])[0];
      const sunset = sunsetLocal ? Date.parse(sunsetLocal + "Z") - d.utc_offset_seconds * 1000 : null;
      return { temp: Math.round(d.current.temperature_2m), kind, label: LABEL[kind], rainSoon: probs.some((p: number) => p >= 50), sunset, isDay: d.current.is_day === 1 } as Weather;
    })
      .then((v) => { if (!off) setW(v); })
      .catch(() => { if (!off) setFailed(true); });
    return () => { off = true; };
  }, [lat, lng]);
  return { weather: w, failed };
}

// ---------- שבת וחגים (Hebcal, חינם) ----------

export type ShabbatClock = { candles: number | null; havdalah: number | null };

export function useShabbat(lat: number, lng: number) {
  const [s, setS] = useState<ShabbatClock | null>(null);
  useEffect(() => {
    let off = false;
    cached(`shab:${lat.toFixed(1)},${lng.toFixed(1)}`, 180, async () => {
      const r = await fetch(`https://www.hebcal.com/shabbat?cfg=json&latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}&tzid=America/Los_Angeles&M=on`);
      if (!r.ok) throw new Error("hebcal");
      const d = (await r.json()) as { items: { category: string; date: string }[] };
      const at = (c: string) => { const it = d.items.find((i) => i.category === c); return it ? Date.parse(it.date) : null; };
      return { candles: at("candles"), havdalah: at("havdalah") };
    }).then((v) => { if (!off) setS(v); }).catch(() => {});
    return () => { off = true; };
  }, [lat, lng]);
  return s;
}

export type JewishDay = { date: string; title: string; kind: "holiday" | "candles" | "havdalah" | "other"; time?: string };

export async function jewishCalendar(start: string, end: string): Promise<JewishDay[]> {
  return cached(`jcal:${start}:${end}`, 360, async () => {
    const url = `https://www.hebcal.com/hebcal?v=1&cfg=json&maj=on&min=on&mod=on&mf=on&ss=on&c=on&M=on&lg=he&start=${start}&end=${end}&latitude=37.7749&longitude=-122.4194&tzid=America/Los_Angeles`;
    const r = await fetch(url);
    if (!r.ok) throw new Error("hebcal");
    const d = (await r.json()) as { items: { category: string; date: string; hebrew?: string; title: string }[] };
    return d.items.map((i) => {
      const hasTime = i.date.length > 10;
      return {
        date: i.date.slice(0, 10),
        title: i.hebrew || i.title,
        kind: i.category === "holiday" ? "holiday" : i.category === "candles" ? "candles" : i.category === "havdalah" ? "havdalah" : "other",
        time: hasTime ? new Intl.DateTimeFormat("he-IL", { timeZone: "America/Los_Angeles", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(i.date)) : undefined,
      } as JewishDay;
    });
  });
}
