// חיפוש מקומות (OpenStreetMap, חינם), קישורי Waze וגוגל מפות, וזמני שבת (Hebcal).

export type Place = { name: string; address: string; lat: number; lng: number };

export async function searchPlaces(q: string): Promise<Place[]> {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&accept-language=he,en&countrycodes=us&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("search failed");
  const data = (await res.json()) as { name?: string; display_name: string; lat: string; lon: string }[];
  return data.map((d) => ({
    name: d.name || d.display_name.split(",")[0],
    address: d.display_name,
    lat: Number(d.lat),
    lng: Number(d.lon),
  }));
}

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
