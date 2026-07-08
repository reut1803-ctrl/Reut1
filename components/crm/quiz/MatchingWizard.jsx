"use client";

import { useState } from "react";
import { ChevronRight, ChevronLeft, Check } from "lucide-react";
import { useCrmStore } from "@/lib/crm/store";
import { REGIONS, YESHIVA_LEVELS, EDUCATION_OPTIONS, SMOKING_OPTIONS, TRAITS } from "@/lib/crm/mockData";
import RangeSlider from "@/components/crm/ui/RangeSlider";
import Button from "@/components/crm/ui/Button";

const STEP_TITLES = [
  "טווח גילאים מבוקש",
  "טווח גובה מבוקש",
  "רמת תורניות",
  "אזור מועדף",
  "לימודים",
  "עישון",
  "עד 3 תכונות אופי",
];

export default function MatchingWizard() {
  const [step, setStep] = useState(0);
  const answers = useCrmStore((s) => s.quizAnswers);
  const setAnswers = useCrmStore((s) => s.setQuizAnswers);
  const completeQuiz = useCrmStore((s) => s.completeQuiz);

  const isLast = step === STEP_TITLES.length - 1;

  const next = () => (isLast ? completeQuiz() : setStep((s) => s + 1));
  const prev = () => setStep((s) => Math.max(0, s - 1));

  const toggleRegion = (region) => {
    if (region === "לא משנה") return setAnswers({ regions: ["לא משנה"] });
    const current = answers.regions.filter((r) => r !== "לא משנה");
    const next = current.includes(region) ? current.filter((r) => r !== region) : [...current, region];
    setAnswers({ regions: next });
  };

  const toggleTrait = (trait) => {
    const current = answers.traits;
    if (current.includes(trait)) return setAnswers({ traits: current.filter((t) => t !== trait) });
    if (current.length >= 3) return;
    setAnswers({ traits: [...current, trait] });
  };

  return (
    <div className="rounded-3xl border border-[#EAE5E3] bg-white p-5 shadow-[0_4px_18px_rgba(58,51,53,0.06)]">
      <div className="mb-1 flex items-center justify-between text-[12px] font-semibold text-[#8A8285]">
        <span>
          שלב {step + 1} מתוך {STEP_TITLES.length}
        </span>
        <span>{Math.round(((step + 1) / STEP_TITLES.length) * 100)}%</span>
      </div>
      <div className="mb-5 h-2 w-full overflow-hidden rounded-full bg-[#F6E4E6]">
        <div
          className="h-full rounded-full bg-[#8C4A55] transition-all duration-300"
          style={{ width: `${((step + 1) / STEP_TITLES.length) * 100}%` }}
        />
      </div>

      <h3 className="mb-4 text-center text-lg font-bold text-[#3A3335]">{STEP_TITLES[step]}</h3>

      <div className="min-h-[180px]">
        {step === 0 && (
          <RangeSlider min={18} max={50} value={answers.ageRange} onChange={(v) => setAnswers({ ageRange: v })} />
        )}

        {step === 1 && (
          <RangeSlider
            min={145}
            max={205}
            value={answers.heightRange}
            onChange={(v) => setAnswers({ heightRange: v })}
            unit=" ס״מ"
          />
        )}

        {step === 2 && (
          <ChoiceList
            options={YESHIVA_LEVELS}
            selected={[answers.yeshivaLevel]}
            onSelect={(v) => setAnswers({ yeshivaLevel: v })}
          />
        )}

        {step === 3 && (
          <div className="flex flex-wrap justify-center gap-2">
            {[...REGIONS, "לא משנה"].map((region) => (
              <Chip key={region} active={answers.regions.includes(region)} onClick={() => toggleRegion(region)}>
                {region}
              </Chip>
            ))}
          </div>
        )}

        {step === 4 && (
          <ChoiceList
            options={EDUCATION_OPTIONS}
            selected={[answers.education]}
            onSelect={(v) => setAnswers({ education: v })}
          />
        )}

        {step === 5 && (
          <ChoiceList
            options={SMOKING_OPTIONS}
            selected={[answers.smoking]}
            onSelect={(v) => setAnswers({ smoking: v })}
          />
        )}

        {step === 6 && (
          <div>
            <p className="mb-3 text-center text-[12px] text-[#8A8285]">נבחרו {answers.traits.length} מתוך 3</p>
            <div className="flex flex-wrap justify-center gap-2">
              {TRAITS.map((trait) => (
                <Chip key={trait} active={answers.traits.includes(trait)} onClick={() => toggleTrait(trait)}>
                  {trait}
                </Chip>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex gap-2">
        <button
          onClick={prev}
          disabled={step === 0}
          className="flex items-center justify-center gap-1 rounded-2xl border border-[#EAE5E3] px-4 py-3 text-sm font-semibold text-[#3A3335] transition disabled:opacity-30"
        >
          <ChevronRight size={16} /> הקודם
        </button>
        <Button variant="primary" className="flex-1" onClick={next}>
          {isLast ? (
            <>
              <Check size={16} /> סיום וקבלת התאמות
            </>
          ) : (
            <>
              הבא <ChevronLeft size={16} />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function ChoiceList({ options, selected, onSelect }) {
  return (
    <div className="space-y-2">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onSelect(opt)}
          className={`w-full rounded-2xl border px-4 py-3 text-right text-sm font-medium transition ${
            selected.includes(opt)
              ? "border-[#8C4A55] bg-[#F6E4E6] text-[#6E3540]"
              : "border-[#EAE5E3] bg-white text-[#3A3335] hover:bg-[#F6F5F4]"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-[13px] font-semibold transition ${
        active ? "border-[#8C4A55] bg-[#8C4A55] text-white" : "border-[#EAE5E3] bg-white text-[#3A3335] hover:bg-[#F6F5F4]"
      }`}
    >
      {children}
    </button>
  );
}
