"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Heart, Info } from "lucide-react";
import Button from "@/components/crm/ui/Button";
import SearchableSelect from "@/components/crm/ui/SearchableSelect";
import VoiceRecorderField from "@/components/crm/ui/VoiceRecorderField";
import ProposalCard from "@/components/crm/proposals/ProposalCard";
import { useCrmStore } from "@/lib/crm/store";

// בחירה קבועה בראש רשימת המועמדים: אדם שאינו רשום במאגר.
// הפרטים שלו נשמרים אך ורק בתוך ההצעה הזו ואינם יוצרים כרטיס במאגר.
const EXTERNAL_VALUE = "__external__";
const EXTERNAL_LABEL = "מישהו מהמעגל שלי...";

const EMPTY_EXTERNAL = { name: "", notes: "", audioUrl: null };

// תזכורת רכה בלבד - אף פעם לא חוסמת. ההחלטה תמיד נשארת אצל השדכנית.
function DroppedReminderDialog({ proposal, onContinue, onCancel }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative w-full max-w-xs rounded-3xl bg-white p-5 text-center shadow-2xl">
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#FFF8E7]">
          <Info size={20} className="text-[#946200]" />
        </div>
        <p className="text-sm font-bold text-[#3A3335]">שימי לב, הצעה זו כבר עלתה בעבר וירדה מהפרק</p>
        {proposal?.rationale && (
          <p className="mt-2 rounded-xl bg-[#F6F5F4] px-3 py-2 text-[12px] leading-relaxed text-[#8A8285]">
            הרציונל שנכתב אז: {proposal.rationale}
          </p>
        )}
        <p className="mt-2 text-[12px] leading-relaxed text-[#8A8285]">
          זו תזכורת בלבד. אם את חושבת שהעיתוי או הנסיבות השתנו - אפשר להמשיך בשמחה.
        </p>
        <div className="mt-4 flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 rounded-2xl border border-[#EAE5E3] py-2.5 text-sm font-semibold text-[#3A3335]"
          >
            רגע, אבדוק
          </button>
          <button onClick={onContinue} className="flex-1 rounded-2xl bg-[#8C4A55] py-2.5 text-sm font-semibold text-white">
            ממשיכה בכל זאת
          </button>
        </div>
      </div>
    </div>
  );
}

function ExternalPersonFields({ title, value, onChange }) {
  return (
    <div className="mt-3 rounded-2xl border-2 border-dashed border-[#C98894] bg-[#FDF7F8] p-3">
      <p className="mb-2 text-[12px] font-bold text-[#8C4A55]">{title}</p>
      <p className="mb-2.5 text-[11px] leading-relaxed text-[#8A8285]">
        אדם שאינו במאגר. הפרטים כאן נשמרים רק בתוך ההתאמה הזו ולא נפתח עבורו כרטיס במאגר.
      </p>

      <input
        type="text"
        value={value.name}
        onChange={(e) => onChange({ ...value, name: e.target.value })}
        placeholder='מי זה? (שם מלא או זיהוי, למשל "בחור שפגשתי בשבת")'
        className="w-full rounded-xl border border-[#EAE5E3] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#8C4A55]"
      />

      <textarea
        value={value.notes}
        onChange={(e) => onChange({ ...value, notes: e.target.value })}
        rows={3}
        placeholder="פרטים על האדם עצמו: גיל, רקע, אופי, ממי הגיע..."
        className="mt-2 w-full resize-y rounded-xl border border-[#EAE5E3] bg-white px-3 py-2.5 text-sm leading-relaxed outline-none focus:border-[#8C4A55]"
      />

      <div className="mt-2.5">
        <VoiceRecorderField
          value={value.audioUrl}
          onChange={(audioUrl) => onChange({ ...value, audioUrl })}
          label="הקלטה קצרה על האדם (לא חובה)"
        />
      </div>
    </div>
  );
}

function PreselectFromQuery() {
  const searchParams = useSearchParams();
  const setSelection = useCrmStore((s) => s.setProposalSelection);
  const findCandidateById = useCrmStore((s) => s.findCandidateById);

  useEffect(() => {
    const selectId = searchParams.get("select");
    if (!selectId) return;
    const candidate = findCandidateById(selectId);
    if (candidate) setSelection(candidate.gender, candidate.id);
  }, [searchParams, setSelection, findCandidateById]);

  return null;
}

export default function ProposalsPage() {
  const role = useCrmStore((s) => s.role);
  const selection = useCrmStore((s) => s.proposalSelection);
  const setSelection = useCrmStore((s) => s.setProposalSelection);
  const createProposal = useCrmStore((s) => s.createProposal);
  const droppedProposalFor = useCrmStore((s) => s.droppedProposalFor);
  const proposals = useCrmStore((s) => s.proposals);
  const allCandidates = useCrmStore((s) => s.allCandidates);
  const candidates_ = useCrmStore((s) => s.candidates);
  const maleCandidates = useMemo(() => allCandidates("male"), [allCandidates, candidates_]);
  const femaleCandidates = useMemo(() => allCandidates("female"), [allCandidates, candidates_]);
  const [rationale, setRationale] = useState("");
  const [externalMale, setExternalMale] = useState(EMPTY_EXTERNAL);
  const [externalFemale, setExternalFemale] = useState(EMPTY_EXTERNAL);
  const [showDroppedReminder, setShowDroppedReminder] = useState(false);

  if (role !== "staff" && role !== "admin") {
    return <p className="px-4 py-10 text-center text-sm text-[#8A8285]">אזור זה זמין לצוות בלבד</p>;
  }

  const sideReady = (value, external) =>
    !!value && (value !== EXTERNAL_VALUE || !!external.name.trim());
  const canCreate = sideReady(selection.male, externalMale) && sideReady(selection.female, externalFemale);

  // תזכורת בלבד, בלי חסימה: אם הזוג הזה כבר הוצע בעבר וירד מהפרק
  const previousDropped = droppedProposalFor(selection.male, selection.female);

  const handleCreateClick = () => {
    if (previousDropped) setShowDroppedReminder(true);
    else handleCreate();
  };

  const handleCreate = async () => {
    setShowDroppedReminder(false);
    const isExternalMale = selection.male === EXTERNAL_VALUE;
    const isExternalFemale = selection.female === EXTERNAL_VALUE;
    await createProposal(
      isExternalMale ? null : selection.male,
      isExternalFemale ? null : selection.female,
      rationale.trim(),
      {
        male: isExternalMale
          ? { name: externalMale.name.trim(), notes: externalMale.notes.trim(), audioUrl: externalMale.audioUrl || null }
          : null,
        female: isExternalFemale
          ? { name: externalFemale.name.trim(), notes: externalFemale.notes.trim(), audioUrl: externalFemale.audioUrl || null }
          : null,
      }
    );
    setRationale("");
    setExternalMale(EMPTY_EXTERNAL);
    setExternalFemale(EMPTY_EXTERNAL);
  };

  return (
    <div className="px-4 py-6">
      <Suspense fallback={null}>
        <PreselectFromQuery />
      </Suspense>

      <h1 className="text-xl font-bold text-[#3A3335]">הצעת התאמה</h1>
      <p className="mt-1 text-[13px] text-[#8A8285]">בחרו בחור ובחורה והציעו התאמה ביניהם</p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <p className="mb-1.5 text-[12px] font-semibold text-[#3A3335]">בחור</p>
          <SearchableSelect
            value={selection.male || ""}
            onChange={(v) => setSelection("male", v)}
            placeholder="בחירת בחור..."
            emptyText="לא נמצא בחור בשם הזה"
            options={[
              { value: EXTERNAL_VALUE, label: EXTERNAL_LABEL, pinned: true },
              ...maleCandidates.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />
        </div>

        <div>
          <p className="mb-1.5 text-[12px] font-semibold text-[#3A3335]">בחורה</p>
          <SearchableSelect
            value={selection.female || ""}
            onChange={(v) => setSelection("female", v)}
            placeholder="בחירת בחורה..."
            emptyText="לא נמצאה בחורה בשם הזה"
            options={[
              { value: EXTERNAL_VALUE, label: EXTERNAL_LABEL, pinned: true },
              ...femaleCandidates.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />
        </div>
      </div>

      {selection.male === EXTERNAL_VALUE && (
        <ExternalPersonFields side="male" title="פרטי הבחור החיצוני" value={externalMale} onChange={setExternalMale} />
      )}
      {selection.female === EXTERNAL_VALUE && (
        <ExternalPersonFields side="female" title="פרטי הבחורה החיצונית" value={externalFemale} onChange={setExternalFemale} />
      )}

      {previousDropped && (
        <div className="mt-3 rounded-2xl border border-[#F0DFA0] bg-[#FFF8E7] p-3">
          <p className="flex items-center gap-1.5 text-[12px] font-bold text-[#946200]">
            <Info size={14} /> שימו לב, הצעה זו כבר עלתה בעבר וירדה מהפרק
          </p>
          {previousDropped.rationale && (
            <p className="mt-1.5 text-[11px] leading-relaxed text-[#8A8285]">
              הרציונל שנכתב אז: {previousDropped.rationale}
            </p>
          )}
          <p className="mt-1 text-[11px] text-[#8A8285]">זו תזכורת בלבד - אפשר להמשיך ולהציע שוב.</p>
        </div>
      )}

      <div className="mt-3">
        <p className="mb-1.5 text-[12px] font-semibold text-[#3A3335]">הרציונל (הניצוץ) - למה זה מתאים?</p>
        <textarea
          value={rationale}
          onChange={(e) => setRationale(e.target.value)}
          rows={2}
          placeholder="מה משלים בין הצדדים, למה נוצר החיבור..."
          className="w-full resize-none rounded-2xl border border-[#EAE5E3] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#8C4A55]"
        />
      </div>

      <Button
        variant="primary"
        className="mt-3 w-full"
        disabled={!canCreate}
        onClick={handleCreateClick}
      >
        <Heart size={16} /> הצע התאמה
      </Button>

      <div className="mt-8">
        <h2 className="mb-3 text-[15px] font-bold text-[#3A3335]">הצעות פעילות ({proposals.length})</h2>
        {proposals.length === 0 ? (
          <p className="text-center text-sm text-[#8A8285]">עדיין לא הוצעו התאמות</p>
        ) : (
          <div className="space-y-3">
            {proposals.map((p) => (
              <ProposalCard key={p.id} proposal={p} />
            ))}
          </div>
        )}
      </div>

      {showDroppedReminder && (
        <DroppedReminderDialog
          proposal={previousDropped}
          onContinue={handleCreate}
          onCancel={() => setShowDroppedReminder(false)}
        />
      )}
    </div>
  );
}
