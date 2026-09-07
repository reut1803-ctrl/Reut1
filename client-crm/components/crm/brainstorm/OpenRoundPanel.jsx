"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, PenLine, Plus } from "lucide-react";
import SearchableSelect from "@/components/crm/ui/SearchableSelect";
import { useCrmStore } from "@/lib/crm/store";
import { QUESTION_BANK } from "@/lib/crm/brainstorm";

const CUSTOM = "__custom__";
// כמה שאלות מוצגות מיד. השאר נפתחות בלחיצה, כדי שהמסך הראשון יישאר קצר.
const VISIBLE = 4;

// פתיחת סבב חדש - למנהלת בלבד. שני צעדים ממוספרים: על מי מדברים, ומה שואלים.
export default function OpenRoundPanel({ onOpened }) {
  const allCandidates = useCrmStore((s) => s.allCandidates);
  const candidates_ = useCrmStore((s) => s.candidates);
  const openRound = useCrmStore((s) => s.openBrainstormRound);
  const showToast = useCrmStore((s) => s.showToast);

  const [candidateId, setCandidateId] = useState("");
  const [questionKey, setQuestionKey] = useState("");
  const [customQuestion, setCustomQuestion] = useState("");
  const [secondQuestion, setSecondQuestion] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const people = useMemo(
    () => [...allCandidates("female"), ...allCandidates("male")],
    [allCandidates, candidates_]
  );

  const question = questionKey === CUSTOM ? customQuestion.trim() : questionKey;
  const canOpen = !!candidateId && !!question && !saving;
  const shown = showAll ? QUESTION_BANK : QUESTION_BANK.slice(0, VISIBLE);

  const handleOpen = async () => {
    if (!canOpen) return;
    setSaving(true);
    setError("");
    try {
      const round = await openRound({ candidateId, question, secondQuestion });
      if (!round) throw new Error("empty");
      setCandidateId("");
      setCustomQuestion("");
      setQuestionKey("");
      setSecondQuestion("");
      setShowAll(false);
      showToast("הסבב מוכן. עכשיו אפשר לשגר אותו לצוות");
      onOpened?.(round);
    } catch (err) {
      setError(
        err?.code === "permission-denied"
          ? "השרת חוסם את הזירה. כללי האבטחה של הזירה עדיין לא פורסמו ב-Firebase."
          : "פתיחת הסבב נכשלה בגלל תקלת תקשורת. נסי שוב בעוד רגע."
      );
    }
    setSaving(false);
  };

  const step = (num, title, done) => (
    <div className="mb-2 flex items-center gap-2">
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
          done ? "bg-[#2FA39B] text-white" : "bg-[#2E8BA8] text-white"
        }`}
      >
        {done ? <Check size={11} /> : num}
      </span>
      <span className="text-[13px] font-bold text-[#23414E]">{title}</span>
    </div>
  );

  return (
    <div className="rounded-3xl border border-[#CFE3EC] bg-white p-4 shadow-[0_8px_26px_rgba(58,51,53,0.07)]">
      <p className="mb-3 text-[15px] font-bold text-[#23414E]">פתיחת סבב חדש</p>

      {/* צעד 1 */}
      {step(1, "על מי מדברים?", !!candidateId)}
      <SearchableSelect
        value={candidateId}
        onChange={(v) => setCandidateId(v || "")}
        placeholder="בחירת מועמד/ת..."
        emptyText="לא נמצא/ה מועמד/ת בשם הזה"
        options={people.map((c) => ({ value: c.id, label: c.name }))}
      />

      {/* צעד 2 - נפתח רק אחרי שנבחר/ה מועמד/ת, כדי שלא יהיה עומס במסך אחד */}
      <div className={`mt-4 ${candidateId ? "" : "pointer-events-none opacity-40"}`}>
        {step(2, "מה שואלים את הצוות?", !!question)}

        <div className="space-y-1.5">
          {shown.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setQuestionKey(q)}
              className={`block w-full rounded-2xl border px-3 py-2.5 text-right text-[12.5px] leading-relaxed transition ${
                questionKey === q
                  ? "border-[#2E8BA8] bg-[#DCEEF5] font-semibold text-[#1F6E88]"
                  : "border-[#CFE3EC] bg-white text-[#23414E]"
              }`}
            >
              {q}
            </button>
          ))}
        </div>

        {!showAll && QUESTION_BANK.length > VISIBLE && (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="mt-1.5 flex w-full items-center justify-center gap-1 py-1.5 text-[12px] font-semibold text-[#2E8BA8]"
          >
            <ChevronDown size={14} /> עוד {QUESTION_BANK.length - VISIBLE} שאלות
          </button>
        )}

        <button
          type="button"
          onClick={() => setQuestionKey(CUSTOM)}
          className={`mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-2xl border px-3 py-2.5 text-[12.5px] transition ${
            questionKey === CUSTOM
              ? "border-[#2E8BA8] bg-[#DCEEF5] font-semibold text-[#1F6E88]"
              : "border-dashed border-[#74B9CE] bg-white text-[#2E8BA8]"
          }`}
        >
          <PenLine size={14} /> לכתוב שאלה משלי
        </button>

        {questionKey === CUSTOM && (
          <textarea
            value={customQuestion}
            onChange={(e) => setCustomQuestion(e.target.value)}
            rows={2}
            autoFocus
            placeholder="השאלה שתעמוד במרכז הסבב..."
            className="mt-2 w-full resize-none rounded-2xl border border-[#CFE3EC] bg-white px-3 py-2.5 text-[13px] outline-none focus:border-[#2E8BA8]"
          />
        )}
      </div>

      {/* צעד 3 - לא חובה, אבל זה מה שמאפשר לכל הצוות להשתתף */}
      <div className={`mt-4 ${candidateId ? "" : "pointer-events-none opacity-40"}`}>
        {step(3, "זווית נוספת לצוות (לא חובה)", !!secondQuestion.trim())}
        <p className="mb-2 text-[11.5px] leading-relaxed text-[#5E7A87]">
          שאלה רחבה שגם מי שלא מכיר/ה את ההיסטוריה יוכל/תוכל לענות עליה. למשל: לאילו כיוונים חדשים
          כדאי לכוון את החיפוש?
        </p>
        <textarea
          value={secondQuestion}
          onChange={(e) => setSecondQuestion(e.target.value)}
          rows={2}
          placeholder="כיווני חיפוש, זווית פתוחה לכולם..."
          className="w-full resize-none rounded-2xl border border-[#CFE3EC] bg-white px-3 py-2.5 text-[13px] outline-none focus:border-[#2E8BA8]"
        />
      </div>

      {error && (
        <p className="mt-3 rounded-xl bg-[#E4F1F7] px-3 py-2 text-[11.5px] leading-relaxed text-[#C4584C]">{error}</p>
      )}

      <button
        type="button"
        onClick={handleOpen}
        disabled={!canOpen}
        className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-2xl bg-[#2E8BA8] py-3 text-[13.5px] font-semibold text-white transition active:scale-[0.98] disabled:opacity-30"
      >
        <Plus size={16} /> {saving ? "מכינה..." : "הכנת הסבב"}
      </button>
    </div>
  );
}
