"use client";

import { Search } from "lucide-react";
import Sheet from "@/components/ui/Sheet";
import DualRangeSlider from "@/components/ui/DualRangeSlider";
import Chip from "@/components/ui/Chip";
import { useAppStore } from "@/lib/store";
import { REGIONS, RELIGIOUS_LEVELS } from "@/lib/data";

export default function FilterSheet({ open, onClose }) {
  const filters = useAppStore((s) => s.filters);
  const setFilters = useAppStore((s) => s.setFilters);
  const resetFilters = useAppStore((s) => s.resetFilters);

  const toggleRegion = (region) => {
    const exists = filters.regions.includes(region);
    setFilters({
      regions: exists ? filters.regions.filter((r) => r !== region) : [...filters.regions, region],
    });
  };

  return (
    <Sheet open={open} onClose={onClose} title="סינון חכם">
      <div className="flex flex-col gap-6">
        <div>
          <label className="mb-2 block text-sm font-semibold text-ink">חיפוש לפי שם</label>
          <div className="relative">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
              placeholder="חיפוש חופשי..."
              className="w-full rounded-2xl border border-black/10 bg-white py-2.5 pr-9 pl-3 text-sm outline-none focus:border-pink-400"
            />
          </div>
        </div>

        <div>
          <label className="mb-3 block text-sm font-semibold text-ink">טווח גילאים</label>
          <DualRangeSlider
            min={18}
            max={50}
            value={filters.ageRange}
            onChange={(v) => setFilters({ ageRange: v })}
          />
        </div>

        <div>
          <label className="mb-3 block text-sm font-semibold text-ink">טווח גובה</label>
          <DualRangeSlider
            min={145}
            max={205}
            value={filters.heightRange}
            onChange={(v) => setFilters({ heightRange: v })}
            unit=" ס״מ"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-ink">רמת תורניות</label>
          <div className="flex flex-wrap gap-2">
            {["הכל", ...RELIGIOUS_LEVELS].map((level) => (
              <Chip
                key={level}
                label={level}
                selected={filters.religiousLevel === level}
                onClick={() => setFilters({ religiousLevel: level })}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-ink">אזור מגורים</label>
          <div className="flex flex-wrap gap-2">
            {REGIONS.map((region) => (
              <Chip
                key={region}
                label={region}
                selected={filters.regions.includes(region)}
                onClick={() => toggleRegion(region)}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-2 pb-2">
          <button onClick={resetFilters} className="btn-outline flex-1">
            נקה סינון
          </button>
          <button onClick={onClose} className="btn-pink flex-1">
            הצג תוצאות
          </button>
        </div>
      </div>
    </Sheet>
  );
}
