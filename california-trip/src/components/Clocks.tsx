"use client";

import { useEffect, useState } from "react";
import { TRIP_TIMEZONE } from "@/lib/types";

function fmt(date: Date, timeZone: string) {
  const time = new Intl.DateTimeFormat("he-IL", {
    timeZone, hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(date);
  const day = new Intl.DateTimeFormat("he-IL", {
    timeZone, weekday: "long", day: "numeric", month: "long",
  }).format(date);
  return { time, day };
}

export default function Clocks() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(id);
  }, []);
  const ca = now ? fmt(now, TRIP_TIMEZONE) : { time: "--:--", day: "" };
  const il = now ? fmt(now, "Asia/Jerusalem") : { time: "--:--", day: "" };
  return (
    <div className="clocks">
      <div className="clock clock--ca">
        <div className="clock-label">עכשיו בקליפורניה</div>
        <div className="clock-time">{ca.time}</div>
        <div className="clock-day">{ca.day}</div>
      </div>
      <div className="clock">
        <div className="clock-label">ובבית, בישראל</div>
        <div className="clock-time">{il.time}</div>
        <div className="clock-day">{il.day}</div>
      </div>
    </div>
  );
}
