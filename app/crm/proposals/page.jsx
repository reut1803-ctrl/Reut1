"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Heart } from "lucide-react";
import Button from "@/components/crm/ui/Button";
import SearchableSelect from "@/components/crm/ui/SearchableSelect";
import ExternalCandidatePanel from "@/components/crm/proposals/ExternalCandidatePanel";
import ProposalCard from "@/components/crm/proposals/ProposalCard";
import { useCrmStore } from "@/lib/crm/store";

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
          createProposal(selection.male, selection.female, rationale.trim(), {
            male: selection.male === EXTERNAL ? externalMale : null,
            female: selection.female === EXTERNAL ? externalFemale : null,
          });
          setRationale("");
          setExternalMale(null);
          setExternalFemale(null);
        }}
      >
        <Heart size={16} /> הצע התאמה
      </Button>

      <div className="mt-8">
        <h2 className="mb-3 text-[15px] font-bold text-[#3A2E26]">הצעות פעילות ({proposals.length})</h2>
        {proposals.length === 0 ? (
          <p className="text-center text-sm text-[#7C6E60]">עדיין לא הוצעו התאמות</p>
        ) : (
          <div className="space-y-3">
            {proposals.map((p) => (
              <ProposalCard key={p.id} proposal={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
