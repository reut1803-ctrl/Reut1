"use client";

import { WIZARD_STEPS } from "@/lib/wizardOptions";

export default function ProgressBar({ step }) {
  return (
    <div className="mb-1">
      <div className="mb-2 flex justify-between text-[11px] font-medium text-muted">
        <span>
          שלב {step + 1} מתוך {WIZARD_STEPS.length}
        </span>
        <span>{Math.round(((step + 1) / WIZARD_STEPS.length) * 100)}%</span>
      </div>
      <div className="flex gap-1.5">
        {WIZARD_STEPS.map((s, i) => (
          <div key={s.key} className="h-1.5 flex-1 overflow-hidden rounded-full bg-pink-100">
            <div
              className="h-full rounded-full bg-bordeaux-500 transition-all duration-300"
              style={{ width: i <= step ? "100%" : "0%" }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
