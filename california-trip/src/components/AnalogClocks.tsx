"use client";

import { useEffect, useState } from "react";
import { TRIP_TIMEZONE } from "@/lib/types";

type Parts = { h: number; m: number; s: number; time: string; day: string };

function partsIn(date: Date, timeZone: string): Parts {
  const p = new Intl.DateTimeFormat("en-GB", {
    timeZone, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  }).formatToParts(date);
  const get = (t: string) => Number(p.find((x) => x.type === t)?.value ?? 0);
  const h = get("hour") % 24;
  const m = get("minute");
  const s = get("second");
  const time = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  const day = new Intl.DateTimeFormat("he-IL", { timeZone, weekday: "long", day: "numeric", month: "long" }).format(date);
  return { h, m, s, time, day };
}

function Dial({ p, accent }: { p: Parts | null; accent: boolean }) {
  const hourDeg = p ? ((p.h % 12) + p.m / 60) * 30 : 0;
  const minDeg = p ? (p.m + p.s / 60) * 6 : 0;
  const secDeg = p ? p.s * 6 : 0;
  return (
    <svg className={`dial ${accent ? "dial--accent" : ""}`} viewBox="-50 -50 100 100" aria-hidden="true">
      <circle className="dial-face" r="47" />
      {Array.from({ length: 12 }, (_, i) => (
        <line
          key={i}
          className={i % 3 === 0 ? "tick tick--major" : "tick"}
          x1="0" y1={i % 3 === 0 ? -40 : -41.5} x2="0" y2="-44"
          transform={`rotate(${i * 30})`}
        />
      ))}
      <line className="hand hand--hour" x1="0" y1="5" x2="0" y2="-22" transform={`rotate(${hourDeg})`} />
      <line className="hand hand--min" x1="0" y1="6" x2="0" y2="-33" transform={`rotate(${minDeg})`} />
      <line className="hand hand--sec" x1="0" y1="9" x2="0" y2="-37" transform={`rotate(${secDeg})`} />
      <circle className="dial-pin" r="2.6" />
    </svg>
  );
}

// שני שעונים מחוגים: קליפורניה (בזהב) וישראל.
export default function AnalogClocks() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const ca = now ? partsIn(now, TRIP_TIMEZONE) : null;
  const il = now ? partsIn(now, "Asia/Jerusalem") : null;
  return (
    <div className="aclocks">
      <figure className="aclock">
        <Dial p={ca} accent />
        <figcaption>
          <span className="aclock-city">קליפורניה</span>
          <span className="aclock-time aclock-time--accent">{ca?.time ?? "--:--"}</span>
          <span className="aclock-day">{ca?.day ?? ""}</span>
        </figcaption>
      </figure>
      <figure className="aclock">
        <Dial p={il} accent={false} />
        <figcaption>
          <span className="aclock-city">ישראל</span>
          <span className="aclock-time">{il?.time ?? "--:--"}</span>
          <span className="aclock-day">{il?.day ?? ""}</span>
        </figcaption>
      </figure>
    </div>
  );
}
