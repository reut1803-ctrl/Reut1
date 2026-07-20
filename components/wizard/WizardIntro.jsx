"use client";

import { Sparkles } from "lucide-react";
import { useAppStore } from "@/lib/store";

export default function WizardIntro() {
  const setWizardStep = useAppStore((s) => s.setWizardStep);

  return (
    <div className="card flex flex-col items-center gap-4 p-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-100 text-pink-500">
        <Sparkles size={26} />
      </div>
      <div>
        <h2 className="mb-1.5 text-lg font-bold text-ink">רוצה לקבל התאמות מותאמות אישית?</h2>
        <p className="text-sm leading-relaxed text-muted">
          שאלון קצר של 7 שלבים שיעזור לנו להבין מה חשוב לך, ולהציג בדיוק את ההצעות שהכי מתאימות
        </p>
      </div>
      <button onClick={() => setWizardStep(0)} className="btn-pink w-full">
        מלאי שאלון קצר
      </button>
    </div>
  );
}
