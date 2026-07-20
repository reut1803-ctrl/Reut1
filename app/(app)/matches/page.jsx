"use client";

import { useAppStore } from "@/lib/store";
import { useScrollRestoration } from "@/lib/useScrollRestoration";
import WizardIntro from "@/components/wizard/WizardIntro";
import Wizard from "@/components/wizard/Wizard";
import MatchesResult from "@/components/wizard/MatchesResult";

export default function MatchesPage() {
  const wizardCompleted = useAppStore((s) => s.wizardCompleted);
  const wizardStarted = useAppStore((s) => s.wizardStarted);

  useScrollRestoration("matches");

  return (
    <div className="flex flex-col gap-4">
      <h1 className="px-1 text-lg font-extrabold text-ink">ההתאמות שלי</h1>
      {wizardCompleted ? (
        <MatchesResult />
      ) : wizardStarted ? (
        <Wizard />
      ) : (
        <WizardIntro />
      )}
    </div>
  );
}
