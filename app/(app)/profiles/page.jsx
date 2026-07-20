"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { getCandidates } from "@/lib/data";
import { useScrollRestoration } from "@/lib/useScrollRestoration";
import FeedTabs from "@/components/profiles/FeedTabs";
import FilterSheet from "@/components/profiles/FilterSheet";
import ProfileCard from "@/components/profiles/ProfileCard";
import ProfileDetailSheet from "@/components/profiles/ProfileDetailSheet";

export default function ProfilesPage() {
  const gender = useAppStore((s) => s.gender);
  const feedTab = useAppStore((s) => s.feedTab);
  const filters = useAppStore((s) => s.filters);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  useScrollRestoration(`profiles-${gender}-${feedTab}`);

  const candidates = useMemo(() => {
    const all = getCandidates(gender);
    const byTab = all.filter((c) => (feedTab === "new" ? c.isNew || !c.isPrevious : c.isPrevious));
    return byTab.filter((c) => {
      if (filters.search && !c.name.includes(filters.search)) return false;
      if (c.age < filters.ageRange[0] || c.age > filters.ageRange[1]) return false;
      if (c.height < filters.heightRange[0] || c.height > filters.heightRange[1]) return false;
      if (filters.religiousLevel !== "הכל" && c.religiousLevel !== filters.religiousLevel) return false;
      if (filters.regions.length > 0 && !filters.regions.includes(c.region)) return false;
      return true;
    });
  }, [gender, feedTab, filters]);

  const activeFilterCount =
    (filters.search ? 1 : 0) +
    (filters.religiousLevel !== "הכל" ? 1 : 0) +
    filters.regions.length +
    (filters.ageRange[0] !== 18 || filters.ageRange[1] !== 45 ? 1 : 0) +
    (filters.heightRange[0] !== 150 || filters.heightRange[1] !== 200 ? 1 : 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <FeedTabs />
        <button
          onClick={() => setFilterOpen(true)}
          className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-bordeaux-500 shadow-card"
          aria-label="סינון"
        >
          <SlidersHorizontal size={18} />
          {activeFilterCount > 0 && (
            <span className="absolute -left-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-pink-500 text-[9px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {candidates.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 py-14 text-center">
          <p className="text-sm font-medium text-ink">לא נמצאו תוצאות</p>
          <p className="text-xs text-muted">נסי לשנות את הסינון או לחפש שם אחר</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {candidates.map((candidate) => (
            <ProfileCard key={candidate.id} candidate={candidate} onReadMore={setSelected} />
          ))}
        </div>
      )}

      <FilterSheet open={filterOpen} onClose={() => setFilterOpen(false)} />
      <ProfileDetailSheet candidate={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
