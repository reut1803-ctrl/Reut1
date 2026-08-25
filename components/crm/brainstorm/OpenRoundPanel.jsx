"use client";

import { useMemo, useState } from "react";
import { Lightbulb, Plus, Sparkles } from "lucide-react";
import SearchableSelect from "@/components/crm/ui/SearchableSelect";
import { useCrmStore } from "@/lib/crm/store";
import { QUESTION_BANK } from "@/lib/crm/brainstorm";

const CUSTOM = "__custom__";

// פתיחת סבב חדש - למנהלת בלבד. בוחרים מועמד/ת, בוחרים שאלה ממאגר שאלות
// העומק (או כותבים שאלה משלנו), ופותחים.
export default function OpenRoundPanel({ onOpened }) {
  const allCandidates = useCrmStore((s) => s.allCandidates);
  const candidates_ = useCrmStore((s) => s.candidates);
  const openRound = useCrmStore((s) => s.openBrainstormRound);
  const showToast = useCrmStore((s) => s.showToast);

  const [candidateId, setCandidateId] = useState("");
  const [questionKey, setQuestionKey] = useState(QUESTION_BANK[0]);
  const [customQuestion, setCustomQuestion] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const people = useMemo(
    () => [...allCandidates("female"), ...allCandidates("male")],
    [allCandidates, candidates_]
  );

  const question = questionKey === CUSTOM ? customQuestion.trim() : questionKey;
  const canOpen = !!candidateId && !!question && !saving;

  const handleOpen = async () => {
    if (!canOpen) return;
    setSaving(true);
    setError("");
    try {
      const round = await openRound({ candidateId, question });
      if (!round) throw new Error("empty");
      setCandidateId("");
      setCustomQuestion("");
      setQuestionKey(QUESTION_BANK[0]);
      showToast("הסבב נפתח. אפשר לעדכן את הצוות בוואטסאפ");
      onOpened?.(round);
    } catch (err) {
      setError(
        err?.code === "permission-denied"
          ? "השרת דחה את פתיחת הסבב. ייתכן שכללי האבטחה החדשים עוד לא פורסמו."
          : "פתיחת הסבב נכשלה בגלל תקלת תקשורת. נסי שוב בעוד רגע."
      );
    }
    setSaving(false);
  };

  return (
    <div className="rounded-3xl border border-[#EAE5E3] bg-white/80 p-4 shadow-[0_8px_26px_rgba(58,51,53,0.07)] backdrop-blur">
      <p className="flex items-center gap-1.5 text-[14px] font-bold text-[#3A3335]">
        <Sparkles size={16} className="text-[#8C4A55]" /> פתיחת סבב חדש
      </p>
      <p className="mt-1 text-[11px] leading-relaxed text-[#8A8285]">
        בוחרים מועמד/ת ושאלה אחת. הצוות יקבל שלושה ימים לחשוב יחד, ובסוף תכתבי סיכום שילווה את
        הכרטיס.
      </p>

      <div className="mt-3">
        <p className="mb-1.5 text-[12px] font-semibold text-[#3A3335]">על מי מדברים?</p>
        <SearchableSelect
          value={candidateId}
          onChange={(v) => setCandidateId(v || "")}
          placeholder="בחירת מועמד/ת..."
          emptyText="לא נמצא/ה מועמד/ת בשם הזה"
          options={people.map((c) => ({ value: c.id, label: c.name }))}
        />
      </div>

      <div className="mt-3">
        <p className="mb-1.5 text-[12px] font-semibold text-[#3A3335]">שאלת העומק לסבב</p>
        <div className="space-y-1.5">
          {QUESTION_BANK.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setQuestionKey(q)}
              className={`block w-full rounded-2xl border px-3 py-2.5 text-right text-[12px] leading-relaxed transition ${
                questionKey === q
                  ? "border-[#8C4A55] bg-[#F6E4E6] font-semibold text-[#6E3540]"
                  : "border-[#EAE5E3] bg-white text-[#3A3335]"
              }`}
            >
              {q}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setQuestionKey(CUSTOM)}
            className={`block w-full rounded-2xl border px-3 py-2.5 text-right text-[12px] transition ${
              questionKey === CUSTOM
                ? "border-[#8C4A55] bg-[#F6E4E6] font-semibold text-[#6E3540]"
                : "border-dashed border-[#C98894] bg-white text-[#8C4A55]"
            }`}
          >
            שאלה משלי...
          </button>
        </div>

        {questionKey === CUSTOM && (
          <textarea
            value={customQuestion}
            onChange={(e) => setCustomQuestion(e.target.value)}
            rows={2}
            placeholder="כתבי כאן את השאלה שתעמוד במרכז הסבב"
            className="mt-2 w-full resize-none rounded-2xl border border-[#EAE5E3] bg-white px-3 py-2.5 text-[13px] outline-none focus:border-[#8C4A55]"
          />
        )}
      </div>

      {error && (
        <p className="mt-2.5 rounded-xl bg-[#FBEDED] px-3 py-2 text-[11px] leading-relaxed text-[#C24545]">{error}</p>
      )}

      <button
        type="button"
        onClick={handleOpen}
        disabled={!canOpen}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-2xl bg-[#8C4A55] py-3 text-[13px] font-semibold text-white transition active:scale-[0.98] disabled:opacity-40"
      >
        {saving ? <Lightbulb size={16} /> : <Plus size={16} />}
        {saving ? "פותחת..." : "פתיחת הסבב"}
      </button>
    </div>
  );
}
