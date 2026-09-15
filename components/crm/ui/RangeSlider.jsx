"use client";

/**
 * סליידר טווח כפול (Dual Range Slider) - ללא תלות חיצונית.
 * שני inputים מסוג range מוצבים זה על זה, כשה-thumb הפעיל הוא זה שיהיה למעלה.
 */
export default function RangeSlider({ min, max, step = 1, value, onChange, unit = "" }) {
  const [low, high] = value;

  const handleLow = (e) => {
    const next = Math.min(Number(e.target.value), high - step);
    onChange([next, high]);
  };
  const handleHigh = (e) => {
    const next = Math.max(Number(e.target.value), low + step);
    onChange([low, next]);
  };

  const lowPct = ((low - min) / (max - min)) * 100;
  const highPct = ((high - min) / (max - min)) * 100;

  return (
    <div className="w-full pt-2">
      <div dir="ltr" className="mb-4 flex items-center justify-center gap-3 text-lg font-bold text-[#6E3540]">
        <span>
          {low}
          {unit}
        </span>
        <span className="text-[#E9B9C0]">—</span>
        <span>
          {high}
          {unit}
        </span>
      </div>
      {/* המסלול נכפה ל-LTR כדי שהחישוב הגרפי של הטווח יהיה עקבי, ללא תלות בכיווניות העמוד */}
      <div dir="ltr" className="relative h-6">
        <div className="absolute top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full bg-[#F6E4E6]" />
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[#8C4A55]"
          style={{ left: `${lowPct}%`, right: `${100 - highPct}%` }}
        />
        <input
          type="range"
          className="range-input-crm"
          min={min}
          max={max}
          step={step}
          value={low}
          onChange={handleLow}
          aria-label="ערך מינימלי"
        />
        <input
          type="range"
          className="range-input-crm"
          min={min}
          max={max}
          step={step}
          value={high}
          onChange={handleHigh}
          aria-label="ערך מקסימלי"
        />
      </div>
      <style jsx>{`
        .range-input-crm {
          -webkit-appearance: none;
          appearance: none;
          position: absolute;
          inset-inline: 0;
          top: 0;
          width: 100%;
          height: 24px;
          background: transparent;
          pointer-events: none;
          margin: 0;
        }
        .range-input-crm::-webkit-slider-thumb {
          -webkit-appearance: none;
          pointer-events: auto;
          width: 24px;
          height: 24px;
          border-radius: 999px;
          background: #8c4a55;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(140, 74, 85, 0.4);
          cursor: pointer;
          margin-top: 0px;
        }
        .range-input-crm::-moz-range-thumb {
          pointer-events: auto;
          width: 24px;
          height: 24px;
          border-radius: 999px;
          background: #8c4a55;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(140, 74, 85, 0.4);
          cursor: pointer;
        }
        .range-input-crm::-webkit-slider-runnable-track {
          height: 24px;
          background: transparent;
        }
        .range-input-crm::-moz-range-track {
          height: 24px;
          background: transparent;
        }
      `}</style>
    </div>
  );
}
