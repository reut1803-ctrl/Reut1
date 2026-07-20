"use client";

import clsx from "clsx";
import { useAppStore } from "@/lib/store";

export default function GenderSwitch() {
  const gender = useAppStore((s) => s.gender);
  const setGender = useAppStore((s) => s.setGender);

  return (
    <div className="mx-auto flex w-full max-w-xs rounded-2xl bg-pink-50 p-1">
      <button
        onClick={() => setGender("female")}
        className={clsx(
          "flex-1 rounded-xl py-2 text-sm font-semibold transition",
          gender === "female" ? "bg-white text-bordeaux-500 shadow-card" : "text-muted"
        )}
      >
        מאגר בנות
      </button>
      <button
        onClick={() => setGender("male")}
        className={clsx(
          "flex-1 rounded-xl py-2 text-sm font-semibold transition",
          gender === "male" ? "bg-white text-bordeaux-500 shadow-card" : "text-muted"
        )}
      >
        מאגר בנים
      </button>
    </div>
  );
}
