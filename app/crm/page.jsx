"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SlidersHorizontal, UserPlus, Lightbulb } from "lucide-react";
import { useCrmStore } from "@/lib/crm/store";
import GenderToggle from "@/components/crm/layout/GenderToggle";
import ProfileCard from "@/components/crm/profiles/ProfileCard";
import FilterSheet from "@/components/crm/profiles/FilterSheet";

export default function ProfilesFeedPage() {
  const board = useCrmStore((s) => s.board);
  const role = useCrmStore((s) => s.role);
  const dailyTip = useCrmStore((s) => s.dailyTip);
  const filters = useCrmStore((s) => s.filters);
  const allCandidates = useCrmStore((s) => s.allCandidates);
  const customCandidates = useCrmStore((s) => s.customCandidates);
  const candidateOverrides = useCrmStore((s) => s.candidateOverrides);
  const [tab, setTab] = useState("new");
  const [showFilters, setShowFilters] = useState(false);

  const candidates = useMemo(() => {
    const all = allCandidates(board);
    return all.filter((c) => {
      if (tab === "new" && !c.isNew) return false;
      if (tab === "previous" && !c.isPrevious) return false;
      if (c.age < filters.ageRange[0] || c.age > filters.ageRange[1]) return false;
      if (c.height < filters.heightRange[0] || c.height > filters.heightRange[1]) return false;
      if (filters.religiousLevel !== "הכל" && c.religiousLevel !== filters.religiousLevel) return false;
      if (filters.region !== "הכל" && c.region !== filters.region) return false;
      if (filters.search && !c.name.includes(filters.search.trim())) return false;
      return true;
    });
  }, [board, tab, filters, customCandidates, candidateOverrides]);

  return (
    <div className="px-4 py-4">
      {role !== "viewer" && (
        <div className="mb-4 flex gap-2.5 rounded-2xl border border-[#F0DFA0] bg-[#FFF8E7] p-3.5">
          <Lightbulb size={18} className="mt-0.5 shrink-0 text-[#946200]" />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#946200]">טיפ בשידוכים</p>
            <p className="mt-0.5 text-[13px] leading-relaxed text-[#3A3335]">{dailyTip}</p>
          </div>
        </div>
      )}

      <GenderToggle />

      <div className="mt-4 flex items-center gap-2">
        <div className="flex flex-1 rounded-2xl bg-white p-1 shadow-sm">
          <button
            onClick={() => setTab("new")}
            className={`flex-1 rounded-xl py-2 text-[13px] font-bold transition ${
              tab === "new" ? "bg-[#F6E4E6] text-[#6E3540]" : "text-[#8A8285]"
            }`}
          >
            הצעות חדשות
          </button>
          <button
            onClick={() => setTab("previous")}
            className={`flex-1 rounded-xl py-2 text-[13px] font-bold transition ${
              tab === "previous" ? "bg-[#F6E4E6] text-[#6E3540]" : "text-[#8A8285]"
            }`}
          >
            הצעות קודמות
          </button>
        </div>
        <button
          onClick={() => setShowFilters(true)}
          aria-label="סינון"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#8C4A55] shadow-sm transition active:scale-95"
        >
          <SlidersHorizontal size={18} />
        </button>
        {role !== "viewer" && (
          <Link
            href="/crm/add-candidate"
            aria-label="הוספת מועמד/ת"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#8C4A55] text-white shadow-sm transition active:scale-95"
          >
            <UserPlus size={18} />
          </Link>
        )}
      </div>

      {candidates.length === 0 ? (
        <p className="mt-16 text-center text-sm text-[#8A8285]">לא נמצאו התאמות לסינון שבחרת</p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {candidates.map((c) => (
            <ProfileCard key={c.id} candidate={c} />
          ))}
        </div>
      )}

      {showFilters && <FilterSheet onClose={() => setShowFilters(false)} />}
    </div>
  );
}
