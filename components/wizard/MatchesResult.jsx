"use client";

import { useMemo, useState } from "react";
import { RefreshCcw, Sparkles } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { getCandidates } from "@/lib/data";
import { getMatches } from "@/lib/matchEngine";
import ProfileCard from "@/components/profiles/ProfileCard";
import ProfileDetailSheet from "@/components/profiles/ProfileDetailSheet";

export default function MatchesResult() {
  const gender = useAppStore((s) => s.gender);
  const answers = useAppStore((s) => s.wizardAnswers);
  const restartWizard = useAppStore((s) => s.restartWizard);
  const [selected, setSelected] = useState(null);

  const matches = useMemo(() => getMatches(getCandidates(gender), answers, 70), [gender, answers]);

  return (
    <div className="flex flex-col gap-4">
      <div className="card flex items-center gap-3 border-mint-100 bg-gradient-to-l from-mint-50 to-pink-50 p-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-mint-500 text-white">
          <Sparkles size={20} />
        </div>
        <div>
          <p className="text-base font-extrabold text-ink">
            {matches.length} התאמות גבוהות מעל 70%!
          </p>
          <p className="text-xs text-muted">מבוסס על ההעדפות שמילאת בשאלון</p>
        </div>
      </div>

      <button onClick={restartWizard} className="btn-outline w-full">
        <RefreshCcw size={15} />
        עדכון העדפות
      </button>

      {matches.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 py-14 text-center">
          <p className="text-sm font-medium text-ink">לא נמצאו התאמות כרגע</p>
          <p className="text-xs text-muted">כדאי לנסות להרחיב את ההעדפות</p>
        </div>
      ) : (
        matches.map((candidate) => (
          <ProfileCard
            key={candidate.id}
            candidate={candidate}
            matchScore={candidate.matchScore}
            onReadMore={setSelected}
          />
        ))
      )}

      <ProfileDetailSheet candidate={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
