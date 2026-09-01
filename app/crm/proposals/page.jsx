"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Heart, AlertTriangle } from "lucide-react";
import Button from "@/components/crm/ui/Button";
import SearchableSelect from "@/components/crm/ui/SearchableSelect";
import ExternalCandidatePanel from "@/components/crm/proposals/ExternalCandidatePanel";
import { isOnActiveBoard, lastDropInfo, pastProposalsForPair, toMillis } from "@/lib/crm/attention";
import ProposalCard from "@/components/crm/proposals/ProposalCard";
import DroppedArchive from "@/components/crm/proposals/DroppedArchive";
import ConfirmDialog from "@/components/crm/ui/ConfirmDialog";
import { useCrmStore, PROPOSAL_DROPPED } from "@/lib/crm/store";

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
  const proposals = useCrmStore((s) => s.proposals);
  const allCandidates = useCrmStore((s) => s.allCandidates);
  const candidates_ = useCrmStore((s) => s.candidates);
  const maleCandidates = useMemo(() => allCandidates("male"), [allCandidates, candidates_]);
  const femaleCandidates = useMemo(() => allCandidates("female"), [allCandidates, candidates_]);
  const [rationale, setRationale] = useState("");
  // מועמד/ת "חיצוני/ת" - מישהו מהמעגל האישי של השדכנית, שאינו/ה במאגר.
  // הפרטים נשמרים בתוך ההצעה בלבד ולא נוצר מהם כרטיס במאגר.
  const [externalMale, setExternalMale] = useState(null);
  const [externalFemale, setExternalFemale] = useState(null);
  // אישור לפני הקמה חוזרת של הצעה בין זוג שכבר נוסה בעבר
  const [confirmingRepeat, setConfirmingRepeat] = useState(false);

  if (role !== "staff" && role !== "admin") {
    return <p className="px-4 py-10 text-center text-sm text-[#7C6E60]">אזור זה זמין לצוות בלבד</p>;
  }

  const EXTERNAL = "__external__";
  const externalOption = [{ value: EXTERNAL, label: "מישהו מהמעגל שלי...", highlight: true }];
  const toOptions = (list) => list.map((c) => ({ value: c.id, label: c.name }));

  const pickMale = (v) => {
    setSelection("male", v);
    setExternalMale(v === EXTERNAL ? { name: "", notes: "", audioUrl: null } : null);
  };
  const pickFemale = (v) => {
    setSelection("female", v);
    setExternalFemale(v === EXTERNAL ? { name: "", notes: "", audioUrl: null } : null);
  };

  const sideReady = (sel, ext) => (sel === EXTERNAL ? !!ext?.name.trim() : !!sel);
  const canCreate = sideReady(selection.male, externalMale) && sideReady(selection.female, externalFemale);

  const submitProposal = () => {
    createProposal(selection.male, selection.female, rationale.trim(), {
      male: selection.male === EXTERNAL ? externalMale : null,
      female: selection.female === EXTERNAL ? externalFemale : null,
    });
    setRationale("");
    setExternalMale(null);
    setExternalFemale(null);
  };

  // הצעה שירדה מהפרק יורדת מהלוח הפעיל מיד ועוברת להיסטוריה שבתחתית המסך.
  // היא נשמרת במסד הנתונים לתמיד, וזה מה שמאפשר את התראת הכפילות שמתחת.
  // חלון 48 השעות אינו כאן אלא בכרטיס המועמד/ת בלבד.
  const visibleProposals = proposals.filter((p) => isOnActiveBoard(p, PROPOSAL_DROPPED));
  const archivedProposals = proposals.filter((p) => !isOnActiveBoard(p, PROPOSAL_DROPPED));

  // התראת כפילות: נבדקת מול כל ההיסטוריה, כולל הצעות שכבר אינן מוצגות
  const pastForSelection =
    selection.male && selection.female && selection.male !== EXTERNAL && selection.female !== EXTERNAL
      ? pastProposalsForPair(proposals, selection.male, selection.female)
      : [];
  const pastDropped = pastForSelection.filter((p) => p.status === PROPOSAL_DROPPED);
  const pastRationale = pastDropped.length > 0 ? lastDropInfo(pastDropped[0], PROPOSAL_DROPPED)?.rationale || "" : "";

  return (
    <div className="px-4 py-6">
      <Suspense fallback={null}>
        <PreselectFromQuery />
      </Suspense>

      <h1 className="text-xl font-bold text-[#3A2E26]">הצעת התאמה</h1>
      <p className="mt-1 text-[13px] text-[#7C6E60]">בחרו בחור ובחורה והציעו התאמה ביניהם</p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <p className="mb-1.5 text-[12px] font-semibold text-[#3A2E26]">בחור</p>
          <SearchableSelect
            value={selection.male || ""}
            onChange={pickMale}
            options={toOptions(maleCandidates)}
            extraOptions={externalOption}
            placeholder="בחירת בחור..."
            searchPlaceholder="הקלידו שם..."
          />
        </div>

        <div>
          <p className="mb-1.5 text-[12px] font-semibold text-[#3A2E26]">בחורה</p>
          <SearchableSelect
            value={selection.female || ""}
            onChange={pickFemale}
            options={toOptions(femaleCandidates)}
            extraOptions={externalOption}
            placeholder="בחירת בחורה..."
            searchPlaceholder="הקלידו שם..."
          />
        </div>
      </div>

      {selection.male === EXTERNAL && (
        <ExternalCandidatePanel value={externalMale} onChange={setExternalMale} genderLabel="בחור" />
      )}
      {selection.female === EXTERNAL && (
        <ExternalCandidatePanel value={externalFemale} onChange={setExternalFemale} genderLabel="בחורה" />
      )}

      <div className="mt-3">
        <p className="mb-1.5 text-[12px] font-semibold text-[#3A2E26]">הרציונל (הניצוץ) - למה זה מתאים?</p>
        <textarea
          value={rationale}
          onChange={(e) => setRationale(e.target.value)}
          rows={2}
          placeholder="מה משלים בין הצדדים, למה נוצר החיבור..."
          className="w-full resize-none rounded-2xl border border-[#CCBDAB] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#844442]"
        />
      </div>

      <Button
        variant="primary"
        className="mt-3 w-full"
        disabled={!canCreate}
        onClick={() => {
          // זוג שכבר נוסה בעבר לא מוקם בלחיצה אחת: המערכת מבקשת אישור
          if (pastForSelection.length > 0) {
            setConfirmingRepeat(true);
            return;
          }
          submitProposal();
        }}
      >
        <Heart size={16} /> הצע התאמה
      </Button>

      {confirmingRepeat && (
        <ConfirmDialog
          message="הצעה בין השניים האלה כבר עלתה בעבר. אפשר להמשיך ולהציע שוב - להקים את ההצעה?"
          confirmLabel="להקים בכל זאת"
          tone="primary"
          onConfirm={() => {
            setConfirmingRepeat(false);
            submitProposal();
          }}
          onCancel={() => setConfirmingRepeat(false)}
        />
      )}

      {/* התראת כפילות - נשענת על ההיסטוריה המלאה במסד הנתונים, גם על הצעות
          שכבר ירדו מהתצוגה. זו הסיבה שהצעות שירדו מהפרק לעולם אינן נמחקות. */}
      {pastForSelection.length > 0 && (
        <div className="mt-3 flex items-start gap-2 rounded-2xl border-2 border-[#D9A441] bg-[#FDF6E7] px-3.5 py-3">
          <AlertTriangle size={17} className="mt-0.5 shrink-0 text-[#7A5A18]" />
          <div className="text-[12px] leading-relaxed text-[#7A5A18]">
            <p className="font-bold">שימו לב - ההתאמה הזו כבר עלתה בעבר</p>
            <p className="mt-0.5">
              {pastDropped.length > 0
                ? `הצעה בין השניים האלה כבר הוצעה וירדה מהפרק (${new Date(
                    toMillis(pastDropped[0].createdAt)
                  ).toLocaleDateString("he-IL")}).`
                : `קיימת כבר הצעה פעילה בין השניים האלה (${new Date(
                    toMillis(pastForSelection[0].createdAt)
                  ).toLocaleDateString("he-IL")}).`}
              {" "}
              אפשר להמשיך ולהציע שוב, אבל המערכת תבקש אישור לפני ההקמה.
            </p>
            {pastDropped.length > 0 && pastRationale && (
              <p className="mt-1">
                הרציונל שנכתב אז: <span className="font-semibold">{pastRationale}</span>
              </p>
            )}
          </div>
        </div>
      )}

      <div className="mt-8">
        <h2 className="mb-3 text-[15px] font-bold text-[#3A2E26]">הצעות פעילות ({visibleProposals.length})</h2>
        {visibleProposals.length === 0 ? (
          <p className="text-center text-sm text-[#7C6E60]">עדיין לא הוצעו התאמות</p>
        ) : (
          <div className="space-y-3">
            {visibleProposals.map((p) => (
              <ProposalCard key={p.id} proposal={p} />
            ))}
          </div>
        )}
        <DroppedArchive proposals={archivedProposals} />
      </div>
    </div>
  );
}
