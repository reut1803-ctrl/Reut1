"use client";

import { useMemo, useState } from "react";
import { Sparkles, RotateCcw } from "lucide-react";
import { useCrmStore, AGE_LIMITS, HEIGHT_LIMITS } from "@/lib/crm/store";
import { rankCandidates, MATCH_THRESHOLD } from "@/lib/crm/matchEngine";
import GenderToggle from "@/components/crm/layout/GenderToggle";
import ProfileCard from "@/components/crm/profiles/ProfileCard";
import MatchingWizard from "@/components/crm/quiz/MatchingWizard";
import Button from "@/components/crm/ui/Button";

export default function MatchesPage() {
  const board = useCrmStore((s) => s.board);
  const quizCompleted = useCrmStore((s) => s.quizCompleted);
  const resetQuiz = useCrmStore((s) => s.resetQuiz);
  const allCandidates = useCrmStore((s) => s.allCandidates);
  const candidates_ = useCrmStore((s) => s.candidates);
  const answers = useCrmStore((s) => s.quizAnswers);
  const [showWizard, setShowWizard] = useState(false);

  const [showWeak, setShowWeak] = useState(false);

  const ranked = useMemo(
    () => rankCandidates(allCandidates(board), answers, { age: AGE_LIMITS, height: HEIGHT_LIMITS }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [board, candidates_, answers]
  );

  if (quizCompleted) {
    const shown = showWeak ? [...ranked.above, ...ranked.below] : ranked.above;
    return (
      <div className="px-4 py-4">
        <GenderToggle />

        <div className="mt-4 rounded-3xl bg-gradient-to-l from-[#8C4A55] to-[#6E3540] p-5 text-white shadow-lg">
          <div className="flex items-center gap-2">
            <Sparkles size={20} />
            <p className="text-lg font-bold">
              {ranked.anyCriteria
                ? `${ranked.above.length} התאמות מעל ${MATCH_THRESHOLD}%`
                : "לא הוגדרו העדפות בשאלון"}
            </p>
          </div>
          <p className="mt-1 text-[13px] text-white/80">
            {ranked.anyCriteria
              ? "הציון מחושב לפי ההעדפות שסימנת. קריטריון שלא סימנת אינו נספר."
              : "סמני לפחות העדפה אחת בשאלון כדי לקבל ניקוד התאמה."}
          </p>
          <button
            onClick={() => {
              resetQuiz();
              setShowWizard(true);
            }}
            className="mt-3 inline-flex items-center gap-1.5 rounded-2xl bg-white/15 px-3.5 py-2 text-[13px] font-semibold text-white transition hover:bg-white/25"
          >
            <RotateCcw size={14} /> עדכון העדפות
          </button>
        </div>

        {shown.length === 0 ? (
          <div className="mt-16 text-center text-sm leading-relaxed text-[#8A8285]">
            <p>אף מועמד/ת לא הגיע/ה ל-{MATCH_THRESHOLD}% במאגר הזה.</p>
            {ranked.below.length > 0 && (
              <button
                onClick={() => setShowWeak(true)}
                className="mt-3 rounded-xl bg-[#8C4A55] px-3.5 py-2 text-[12px] font-semibold text-white"
              >
                הצג בכל זאת את {ranked.below.length} הקרובים ביותר
              </button>
            )}
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {shown.map((r) => (
              <div key={r.candidate.id} className="relative">
                <span
                  className={`absolute -top-2 right-4 z-10 rounded-full px-2.5 py-1 text-[11px] font-bold text-white shadow ${
                    r.score >= MATCH_THRESHOLD ? "bg-[#20A66B]" : "bg-[#D6A93A]"
                  }`}
                >
                  {r.score}% התאמה
                </span>
                <ProfileCard candidate={r.candidate} />
                <p className="mt-1 px-1 text-[11px] leading-relaxed text-[#8A8285]">
                  {r.matched.length > 0 && <>התאים: {r.matched.join(", ")}</>}
                  {r.matched.length > 0 && r.missed.length > 0 && " · "}
                  {r.missed.length > 0 && <>לא התאים: {r.missed.join(", ")}</>}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <GenderToggle />

      {!showWizard ? (
        <div className="mt-8 flex flex-col items-center rounded-3xl border border-[#EAE5E3] bg-white p-6 text-center shadow-[0_4px_18px_rgba(58,51,53,0.06)]">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#F6E4E6]">
            <Sparkles size={28} className="text-[#8C4A55]" />
          </div>
          <h2 className="text-lg font-bold text-[#3A3335]">רוצה לקבל התאמות מותאמות אישית?</h2>
          <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-[#8A8285]">
            שאלון קצר בן 8 שאלות שיעזור לנו למצוא עבורך את ההצעות המתאימות ביותר מהמאגר
          </p>
          <Button variant="primary" className="mt-5" onClick={() => setShowWizard(true)}>
            מלאי שאלון קצר
          </Button>
        </div>
      ) : (
        <div className="mt-6">
          <MatchingWizard />
        </div>
      )}
    </div>
  );
}
