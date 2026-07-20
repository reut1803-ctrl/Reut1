"use client";

import DualRangeSlider from "@/components/ui/DualRangeSlider";
import Chip from "@/components/ui/Chip";
import {
  TORAH_LEVEL_OPTIONS,
  REGION_OPTIONS,
  EDUCATION_OPTIONS,
  SMOKING_OPTIONS,
  TRAIT_OPTIONS,
} from "@/lib/wizardOptions";

export function StepAgeRange({ value, onChange }) {
  return <DualRangeSlider min={18} max={50} value={value} onChange={onChange} />;
}

export function StepHeightRange({ value, onChange }) {
  return <DualRangeSlider min={145} max={205} value={value} onChange={onChange} unit=" ס״מ" />;
}

export function StepSingleChoice({ options, value, onChange }) {
  return (
    <div className="flex flex-col gap-2.5">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`rounded-2xl border-2 px-4 py-3.5 text-right text-sm font-medium transition active:scale-[.98] ${
            value === opt
              ? "border-bordeaux-500 bg-bordeaux-50 text-bordeaux-500"
              : "border-black/10 bg-white text-ink"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export function StepTorahLevel({ value, onChange }) {
  return <StepSingleChoice options={TORAH_LEVEL_OPTIONS} value={value} onChange={onChange} />;
}

export function StepEducation({ value, onChange }) {
  return <StepSingleChoice options={EDUCATION_OPTIONS} value={value} onChange={onChange} />;
}

export function StepSmoking({ value, onChange }) {
  return <StepSingleChoice options={SMOKING_OPTIONS} value={value} onChange={onChange} />;
}

export function StepRegions({ value, onChange }) {
  const toggle = (region) => {
    if (region === "לא משנה") {
      onChange(["לא משנה"]);
      return;
    }
    const withoutAny = value.filter((r) => r !== "לא משנה");
    onChange(withoutAny.includes(region) ? withoutAny.filter((r) => r !== region) : [...withoutAny, region]);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {REGION_OPTIONS.map((region) => (
        <Chip key={region} label={region} selected={value.includes(region)} onClick={() => toggle(region)} />
      ))}
    </div>
  );
}

export function StepTraits({ value, onChange }) {
  const toggle = (trait) => {
    if (value.includes(trait)) {
      onChange(value.filter((t) => t !== trait));
    } else if (value.length < 3) {
      onChange([...value, trait]);
    }
  };

  return (
    <div>
      <p className="mb-3 text-xs text-muted">{value.length}/3 נבחרו</p>
      <div className="flex flex-wrap gap-2">
        {TRAIT_OPTIONS.map((trait) => (
          <Chip
            key={trait}
            label={trait}
            selected={value.includes(trait)}
            disabled={!value.includes(trait) && value.length >= 3}
            onClick={() => toggle(trait)}
          />
        ))}
      </div>
    </div>
  );
}
