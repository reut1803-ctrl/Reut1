"use client";

import { useState } from "react";
import { ChevronRight, ChevronLeft, Check } from "lucide-react";
import { useCrmStore } from "@/lib/crm/store";
import { REGIONS, YESHIVA_LEVELS, EDUCATION_OPTIONS, religiousLevelsFor, smokingOptionsFor, TRAITS, lifestyleTagsFor } from "@/lib/crm/mockData";
import RangeSlider from "@/components/crm/ui/RangeSlider";
import Button from "@/components/crm/ui/Button";

const STEP_TITLES = [
  "טווח גילאים מבוקש",
  "טווח גובה מבוקש",
  "רמת תורניות",
  "אזור מועדף",
  "לימודים",
  "סגנון חיים והשקפה",
  "עישון",
  "עד 3 תכונות אופי",
];

export default function MatchingWizard() {
  const [step, setStep] = useState(0);
  const board = useCrmStore((s) => s.board);
  const answers = useCrmStore((s) => s.quizAnswers);
  const setAnswers = useCrmStore((s) => s.setQuizAnswers);
  const completeQuiz = useCrmStore((s) => s.completeQuiz);
  const religiousLevels = religiousLevelsFor(board);
  const smokingOptions = smokingOptionsFor(board);

  const isLast = step === STEP_TITLES.length - 1;

  const next = () => (isLast ? completeQuiz() : setStep((s) => s + 1));
  const prev = () => setStep((s) => Math.max(0, s - 1));

  const toggleRegion = (region) => {
    if (region === "לא משנה") return setAnswers({ regions: ["לא משנה"] });
    const current = answers.regions.filter((r) => r !== "לא משנה");
    const next = current.includes(region) ? current.filter((r) => r !== region) : [...current, region];
    setAnswers({ regions: next });
  };

  const toggleLifestyle = (tag) => {
    const current = answers.lifestyle || [];
    // "לא משנה" הוא בחירה בלעדית: הוא מבטל את שאר הסימונים, וסימון אחר מבטל אותו
    if (tag === "לא משנה") {
      setAnswers({ lifestyle: current.includes(tag) ? [] : ["לא משנה"] });
      return;
    }
    const withoutAny = current.filter((t) => t !== "לא משנה");
    setAnswers({
      lifestyle: withoutAny.includes(tag) ? withoutAny.filter((t) => t !== tag) : [...withoutAny, tag],
    });
  };

  const toggleTrait = (trait) => {
    const current = answers.traits;
    if (current.includes(trait)) return setAnswers({ traits: current.filter((t) => t !== trait) });
    if (current.length >= 3) return;
    setAnswers({ traits: [...current, trait] });
  };

  return (
    <div className="rounded-3xl border border-[#CCBDAB] bg-white p-5 shadow-[0_4px_18px_rgba(58,51,53,0.06)]">
      <div className="mb-1 flex items-center justify-between text-[12px] font-semibold text-[#7C6E60]">
        <span>
          שלב {step + 1} מתוך {STEP_TITLES.length}
        </span>
        <span>{Math.round(((step + 1) / STEP_TITLES.length) * 100)}%</span>
      </div>
      <div className="mb-5 h-2 w-full overflow-hidden rounded-full bg-[#F0E2DE]">
        <div
          className="h-full rounded-full bg-[#844442] transition-all duration-300"
          style={{ width: `${((step + 1) / STEP_TITLES.length) * 100}%` }}
        />
      </div>

      <h3 className="mb-4 text-center text-lg font-bold text-[#3A2E26]">{STEP_TITLES[step]}</h3>

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
            options={religiousLevels}
            selected={[answers.religiousLevel]}
            onSelect={(v) => setAnswers({ religiousLevel: v })}
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
            options={board === "male" ? YESHIVA_LEVELS : EDUCATION_OPTIONS}
            selected={[answers.education]}
            onSelect={(v) => setAnswers({ education: v })}
          />
        )}

        {step === 5 && (
          <div>
            <p className="mb-3 text-center text-[12px] leading-relaxed text-[#7C6E60]">
              בחירה מרובה - אפשר לסמן כמה שרוצים, או לדלג.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {lifestyleTagsFor(board).map((tag) => (
                <Chip key={tag} active={(answers.lifestyle || []).includes(tag)} onClick={() => toggleLifestyle(tag)}>
                  {tag}
                </Chip>
              ))}
            </div>
          </div>
        )}

        {step === 6 && (
          <ChoiceList
            options={smokingOptions}
            selected={[answers.smoking]}
            onSelect={(v) => setAnswers({ smoking: v })}
          />
        )}

        {step === 7 && (
          <div>
            <p className="mb-3 text-center text-[12px] text-[#7C6E60]">נבחרו {answers.traits.length} מתוך 3</p>
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
          className="flex items-center justify-center gap-1 rounded-2xl border border-[#CCBDAB] px-4 py-3 text-sm font-semibold text-[#3A2E26] transition disabled:opacity-30"
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
              ? "border-[#844442] bg-[#F0E2DE] text-[#5E2F2D]"
              : "border-[#CCBDAB] bg-white text-[#3A2E26] hover:bg-[#E8DCCB]"
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
        active ? "border-[#844442] bg-[#844442] text-white" : "border-[#CCBDAB] bg-white text-[#3A2E26] hover:bg-[#E8DCCB]"
      }`}
    >
      {children}
    </button>
  );
}
