"use client";

import { ChevronRight, ChevronLeft } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { WIZARD_STEPS } from "@/lib/wizardOptions";
import ProgressBar from "./ProgressBar";
import {
  StepAgeRange,
  StepHeightRange,
  StepTorahLevel,
  StepRegions,
  StepEducation,
  StepSmoking,
  StepTraits,
} from "./Steps";

const STEP_COMPONENTS = [
  StepAgeRange,
  StepHeightRange,
  StepTorahLevel,
  StepRegions,
  StepEducation,
  StepSmoking,
  StepTraits,
];

export default function Wizard() {
  const wizardStep = useAppStore((s) => s.wizardStep);
  const setWizardStep = useAppStore((s) => s.setWizardStep);
  const answers = useAppStore((s) => s.wizardAnswers);
  const updateAnswer = useAppStore((s) => s.updateWizardAnswer);
  const completeWizard = useAppStore((s) => s.completeWizard);

  const stepMeta = WIZARD_STEPS[wizardStep];
  const StepComponent = STEP_COMPONENTS[wizardStep];
  const key = stepMeta.key;

  const isLast = wizardStep === WIZARD_STEPS.length - 1;

  const next = () => {
    if (isLast) completeWizard();
    else setWizardStep(wizardStep + 1);
  };
  const prev = () => {
    if (wizardStep > 0) setWizardStep(wizardStep - 1);
  };

  return (
    <div className="card flex flex-col gap-5 p-5">
      <ProgressBar step={wizardStep} />

      <div>
        <h2 className="mb-1 text-lg font-bold text-ink">{stepMeta.title}</h2>
        <p className="mb-4 text-sm text-muted">{stepMeta.subtitle}</p>
        <StepComponent value={answers[key]} onChange={(v) => updateAnswer(key, v)} />
      </div>

      <div className="flex gap-2 pt-2">
        <button onClick={prev} disabled={wizardStep === 0} className="btn-outline flex-1 disabled:opacity-30">
          <ChevronRight size={16} />
          הקודם
        </button>
        <button onClick={next} className="btn-pink flex-1">
          {isLast ? "סיום" : "הבא"}
          <ChevronLeft size={16} />
        </button>
      </div>
    </div>
  );
}
