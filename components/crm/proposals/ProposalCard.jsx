"use client";

import { useState } from "react";
import { ChevronDown, Clock, Copy, Check, Phone } from "lucide-react";
import { useCrmStore, PROPOSAL_STAGES, PROPOSAL_DROPPED } from "@/lib/crm/store";
import { MALE_CANDIDATES, FEMALE_CANDIDATES } from "@/lib/crm/mockData";
import StageFunnel from "./StageFunnel";

function findCandidate(id) {
  return [...MALE_CANDIDATES, ...FEMALE_CANDIDATES].find((c) => c.id === id);
}

function ContactCard({ candidate }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(`${candidate.name}\n${candidate.phone}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl bg-[#F6F5F4] p-3">
      <p className="text-[13px] font-bold text-[#3A3335]">{candidate.name}</p>
      <p dir="ltr" className="mt-0.5 flex items-center gap-1 text-[12px] text-[#8A8285]">
        <Phone size={12} /> {candidate.phone}
      </p>
      <button
        onClick={handleCopy}
        className="mt-2 flex w-full items-center justify-center gap-1 rounded-xl border border-[#EAE5E3] bg-white py-1.5 text-[11px] font-semibold text-[#8C4A55] transition active:scale-95 hover:bg-[#F6F5F4]"
      >
        {copied ? <Check size={13} /> : <Copy size={13} />}
        {copied ? "הועתק!" : "העתקת כרטיס"}
      </button>
    </div>
  );
}

export default function ProposalCard({ proposal }) {
  const updateProposalStatus = useCrmStore((s) => s.updateProposalStatus);
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");

  const male = findCandidate(proposal.maleId);
  const female = findCandidate(proposal.femaleId);
  if (!male || !female) return null;

  return (
    <div className="rounded-3xl border border-[#EAE5E3] bg-white p-4 shadow-[0_4px_18px_rgba(58,51,53,0.06)]">
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-bold text-[#3A3335]">
          {male.name} ⚭ {female.name}
        </h3>
        <button onClick={() => setOpen((v) => !v)} className="rounded-full p-1.5 hover:bg-[#F6F5F4]" aria-label="פתיחת יומן">
          <ChevronDown size={18} className={`transition ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      <div className="relative mt-3">
        <StageFunnel status={proposal.status} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <ContactCard candidate={male} />
        <ContactCard candidate={female} />
      </div>

      {open && (
        <div className="mt-4 space-y-3 border-t border-[#EAE5E3] pt-3">
          <div>
            <p className="mb-1.5 text-[12px] font-semibold text-[#3A3335]">עדכון סטטוס</p>
            <div className="flex flex-wrap gap-1.5">
              {[...PROPOSAL_STAGES, PROPOSAL_DROPPED].map((stage) => (
                <button
                  key={stage}
                  onClick={() => updateProposalStatus(proposal.id, stage, note)}
                  className={`rounded-full border px-2.5 py-1.5 text-[11px] font-semibold transition ${
                    proposal.status === stage
                      ? "border-[#8C4A55] bg-[#8C4A55] text-white"
                      : "border-[#EAE5E3] bg-white text-[#3A3335] hover:bg-[#F6F5F4]"
                  }`}
                >
                  {stage}
                </button>
              ))}
            </div>
          </div>

          <div>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="הערה לעדכון הבא (אופציונלי)..."
              className="w-full rounded-xl border border-[#EAE5E3] bg-white px-3 py-2 text-[13px] outline-none focus:border-[#8C4A55]"
            />
          </div>

          <div>
            <p className="mb-1.5 flex items-center gap-1 text-[12px] font-semibold text-[#3A3335]">
              <Clock size={13} /> יומן התקדמות
            </p>
            <ul className="space-y-1.5">
              {[...proposal.journal].reverse().map((entry) => (
                <li key={entry.id} className="rounded-xl bg-[#F6F5F4] px-3 py-2 text-[12px]">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#3A3335]">{entry.status}</span>
                    <span className="text-[#B5AEB0]">{new Date(entry.date).toLocaleDateString("he-IL")}</span>
                  </div>
                  {entry.note && <p className="mt-0.5 text-[#8A8285]">{entry.note}</p>}
                  <p className="mt-0.5 text-[10px] text-[#B5AEB0]">עודכן ע״י {entry.author}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
