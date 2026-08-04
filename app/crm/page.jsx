"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, UserPlus } from "lucide-react";
import { useCrmStore } from "@/lib/crm/store";
import GenderToggle from "@/components/crm/layout/GenderToggle";
import ProfileCard from "@/components/crm/profiles/ProfileCard";
import FilterSheet from "@/components/crm/profiles/FilterSheet";
import TipsCarousel from "@/components/crm/profiles/TipsCarousel";

function ProfilesFeed() {
  const searchParams = useSearchParams();
  const board = useCrmStore((s) => s.board);
  const setBoard = useCrmStore((s) => s.setBoard);
  const role = useCrmStore((s) => s.role);
  const filters = useCrmStore((s) => s.filters);
  const setFilters = useCrmStore((s) => s.setFilters);
  const allCandidates = useCrmStore((s) => s.allCandidates);
  const findCandidateById = useCrmStore((s) => s.findCandidateById);
  const candidates_ = useCrmStore((s) => s.candidates);
  const candidatesLoaded = useCrmStore((s) => s.candidatesLoaded);
  const candidatesError = useCrmStore((s) => s.candidatesError);
  const tab = useCrmStore((s) => s.feedTab);
  const setTab = useCrmStore((s) => s.setFeedTab);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const openId = searchParams.get("openCandidate");
    if (!openId) return;
    const c = findCandidateById(openId);
    if (!c) return;
    setBoard(c.gender);
    setTab(c.isNew ? "new" : "previous");
    setFilters({ search: c.name });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

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
  }, [board, tab, filters, candidates_]);

  return (
    <div className="px-4 py-4">
      {(role === "staff" || role === "admin") && <TipsCarousel />}

      <GenderToggle />

      <div data-tour="tour-search" className="relative mt-4">
        <Search size={17} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#A2937F]" />
        <input
          type="text"
          value={filters.search}
          onChange={(e) => setFilters({ search: e.target.value })}
          placeholder="חיפוש מועמד (שם, משפחה)..."
          className="w-full rounded-2xl bg-white py-3 pr-10 pl-4 text-[14px] text-[#3A2E26] shadow-sm outline-none placeholder:text-[#A2937F] focus:ring-2 focus:ring-[#844442]/30"
        />
      </div>

      <div className="mt-4 flex items-center gap-2">
        <div data-tour="tour-tabs" className="flex flex-1 rounded-2xl bg-white p-1 shadow-sm">
          <button
            onClick={() => setTab("new")}
            className={`flex-1 rounded-xl py-2 text-[13px] font-bold transition ${
              tab === "new" ? "bg-[#F0E2DE] text-[#5E2F2D]" : "text-[#7C6E60]"
            }`}
          >
            הצעות חדשות
          </button>
          <button
            onClick={() => setTab("previous")}
            className={`flex-1 rounded-xl py-2 text-[13px] font-bold transition ${
              tab === "previous" ? "bg-[#F0E2DE] text-[#5E2F2D]" : "text-[#7C6E60]"
            }`}
          >
            הצעות קודמות
          </button>
        </div>
        <button
          data-tour="tour-filter"
          onClick={() => setShowFilters(true)}
          aria-label="סינון"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#844442] shadow-sm transition active:scale-95"
        >
          <SlidersHorizontal size={18} />
        </button>
        {(role === "staff" || role === "admin") && (
          <Link
            href="/crm/add-candidate"
            aria-label="הוספת מועמד/ת"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#844442] text-white shadow-sm transition active:scale-95"
          >
            <UserPlus size={18} />
          </Link>
        )}
      </div>

      {candidatesError ? (
        <p className="mt-16 text-center text-sm leading-relaxed text-[#C24545]">
          לא הצלחנו לטעון את המאגר.
          <br />
          נסו לרענן את הדף, ואם זה חוזר - פנו למנהלת לבדיקת ההרשאות.
        </p>
      ) : !candidatesLoaded ? (
        <p className="mt-16 text-center text-sm text-[#7C6E60]">טוען את המאגר...</p>
      ) : candidates.length === 0 ? (
        <p className="mt-16 text-center text-sm text-[#7C6E60]">לא נמצאו התאמות לסינון שבחרת</p>
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

export default function ProfilesFeedPage() {
  return (
    <Suspense fallback={null}>
      <ProfilesFeed />
    </Suspense>
  );
}
