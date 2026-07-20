"use client";

// סליידר טווח כפול (שני קצוות) - לגילאים, גובה וכו'.
export default function DualRangeSlider({ min, max, step = 1, value, onChange, unit = "" }) {
  const [low, high] = value;

  const handleLow = (e) => {
    const v = Math.min(Number(e.target.value), high - step);
    onChange([v, high]);
  };
  const handleHigh = (e) => {
    const v = Math.max(Number(e.target.value), low + step);
    onChange([low, v]);
  };

  const lowPct = ((low - min) / (max - min)) * 100;
  const highPct = ((high - min) / (max - min)) * 100;

  return (
    <div className="w-full select-none">
      <div className="mb-3 flex items-center justify-between text-sm font-semibold text-bordeaux-500">
        <span>
          {low}
          {unit}
        </span>
        <span>
          {high}
          {unit}
        </span>
      </div>
      <div className="relative h-8">
        <div className="absolute top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full bg-pink-100" />
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-bordeaux-500"
          style={{ right: `${lowPct}%`, left: `${100 - highPct}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={low}
          onChange={handleLow}
          className="range-thumb pointer-events-none absolute top-1/2 h-1.5 w-full -translate-y-1/2 appearance-none bg-transparent"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={high}
          onChange={handleHigh}
          className="range-thumb pointer-events-none absolute top-1/2 h-1.5 w-full -translate-y-1/2 appearance-none bg-transparent"
        />
      </div>
      <style jsx>{`
        .range-thumb {
          direction: ltr;
        }
        .range-thumb::-webkit-slider-thumb {
          pointer-events: auto;
          appearance: none;
          width: 22px;
          height: 22px;
          border-radius: 999px;
          background: #ffffff;
          border: 3px solid #7c2d42;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
          cursor: pointer;
        }
        .range-thumb::-moz-range-thumb {
          pointer-events: auto;
          width: 22px;
          height: 22px;
          border-radius: 999px;
          background: #ffffff;
          border: 3px solid #7c2d42;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
