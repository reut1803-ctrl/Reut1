"use client";

import { useEffect, useState } from "react";

type BatteryLike = { level: number; charging: boolean; addEventListener: (t: string, f: () => void) => void; removeEventListener: (t: string, f: () => void) => void };

// מצב חיסכון: כשהסוללה מתחת ל-20% ולא בטעינה — האתר עובר לגווני סגול עמום וכהה.
export function useBatteryNight(): boolean {
  const [night, setNight] = useState(false);
  useEffect(() => {
    const nav = navigator as Navigator & { getBattery?: () => Promise<BatteryLike> };
    if (!nav.getBattery) return;
    let bat: BatteryLike | null = null;
    const check = () => {
      if (!bat) return;
      const on = bat.level <= 0.2 && !bat.charging;
      setNight(on);
      document.documentElement.toggleAttribute("data-night", on);
    };
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
  return night;
}
