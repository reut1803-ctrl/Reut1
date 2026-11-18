"use client";

import { useCallback, useEffect, useState } from "react";

type BatteryLike = { level: number; charging: boolean; addEventListener: (t: string, f: () => void) => void; removeEventListener: (t: string, f: () => void) => void };

const OFF_KEY = "ct-night-off";

function readOff(): boolean {
  try { return sessionStorage.getItem(OFF_KEY) === "1"; } catch { return false; }
}

// מצב חיסכון: כשהסוללה מתחת ל-20% ולא בטעינה — האתר עובר לגווני סגול עמום וכהה.
// אפשר לכבות אותו לביקור הנוכחי בלחיצה.
export function useBatteryNight(): { night: boolean; turnOff: () => void } {
  const [low, setLow] = useState(false);
  const [off, setOff] = useState(false);

  useEffect(() => {
    setOff(readOff());
    const nav = navigator as Navigator & { getBattery?: () => Promise<BatteryLike> };
    if (!nav.getBattery) return;
    let bat: BatteryLike | null = null;
    const check = () => { if (bat) setLow(bat.level <= 0.2 && !bat.charging); };
    nav.getBattery().then((b) => {
      bat = b;
      check();
      b.addEventListener("levelchange", check);
      b.addEventListener("chargingchange", check);
    }).catch(() => {});
    return () => {
      bat?.removeEventListener("levelchange", check);
      bat?.removeEventListener("chargingchange", check);
    };
  }, []);

  const night = low && !off;
  useEffect(() => {
    document.documentElement.toggleAttribute("data-night", night);
  }, [night]);

  const turnOff = useCallback(() => {
    try { sessionStorage.setItem(OFF_KEY, "1"); } catch { /* */ }
    setOff(true);
  }, []);

  return { night, turnOff };
}
