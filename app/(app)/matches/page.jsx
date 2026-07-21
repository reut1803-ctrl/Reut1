"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { useAuth } from "@/lib/supabase/AuthProvider";
import { fetchWizardAnswers, saveWizardAnswers } from "@/lib/queries";
import { DEFAULT_WIZARD_ANSWERS } from "@/lib/wizardOptions";
import { useScrollRestoration } from "@/lib/useScrollRestoration";
import WizardIntro from "@/components/wizard/WizardIntro";
import Wizard from "@/components/wizard/Wizard";
import MatchesResult from "@/components/wizard/MatchesResult";

export default function MatchesPage() {
  const { supabase, user } = useAuth();
  const wizardStarted = useAppStore((s) => s.wizardStarted);
  const resetWizardUi = useAppStore((s) => s.resetWizardUi);

  const [answers, setAnswers] = useState(DEFAULT_WIZARD_ANSWERS);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  useScrollRestoration("matches");

  useEffect(() => {
    if (!user) return;
    fetchWizardAnswers(supabase, user.id).then((data) => {
      if (data) {
        setAnswers(data);
        setCompleted(data.completed);
      }
      setLoading(false);
    });
  }, [supabase, user]);

  const finishWizard = async (finalAnswers) => {
    setAnswers(finalAnswers);
    setCompleted(true);
    resetWizardUi();
    await saveWizardAnswers(supabase, user.id, finalAnswers, true);
  };

  const restart = () => {
    setCompleted(false);
  };

  if (loading) {
    return <div className="card py-14 text-center text-sm text-muted">טוען...</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="px-1 text-lg font-extrabold text-ink">ההתאמות שלי</h1>
      {completed ? (
        <MatchesResult answers={answers} onRestart={restart} />
      ) : wizardStarted ? (
        <Wizard initialAnswers={answers} onFinish={finishWizard} />
      ) : (
        <WizardIntro />
      )}
    </div>
  );
}
