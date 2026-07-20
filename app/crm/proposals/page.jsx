"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Heart } from "lucide-react";
import Button from "@/components/crm/ui/Button";
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
  const customCandidates = useCrmStore((s) => s.customCandidates);
  const maleCandidates = useMemo(() => allCandidates("male"), [allCandidates, customCandidates]);
  const femaleCandidates = useMemo(() => allCandidates("female"), [allCandidates, customCandidates]);
  const [rationale, setRationale] = useState("");

  if (role !== "staff" && role !== "admin") {
    return <p className="px-4 py-10 text-center text-sm text-[#8A8285]">אזור זה זמין לצוות בלבד</p>;
  }

  const canCreate = selection.male && selection.female;

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
          <select
            value={selection.male || ""}
            onChange={(e) => setSelection("male", e.target.value)}
            className="w-full rounded-2xl border border-[#EAE5E3] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#8C4A55]"
          >
            <option value="">בחירת בחור...</option>
            {maleCandidates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className="mb-1.5 text-[12px] font-semibold text-[#3A3335]">בחורה</p>
          <select
            value={selection.female || ""}
            onChange={(e) => setSelection("female", e.target.value)}
            className="w-full rounded-2xl border border-[#EAE5E3] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#8C4A55]"
          >
            <option value="">בחירת בחורה...</option>
            {femaleCandidates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

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
        onClick={() => {
          createProposal(selection.male, selection.female, rationale.trim());
          setRationale("");
        }}
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
    </div>
  );
}
