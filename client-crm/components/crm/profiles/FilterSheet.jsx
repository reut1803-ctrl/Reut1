"use client";

import { X, Search } from "lucide-react";
import { useCrmStore, AGE_LIMITS, HEIGHT_LIMITS } from "@/lib/crm/store";
import RangeSlider from "@/components/crm/ui/RangeSlider";
import { REGIONS, religiousLevelsFor } from "@/lib/crm/mockData";
import Button from "@/components/crm/ui/Button";
import { useBackToClose } from "@/lib/crm/useBackToClose";

export default function FilterSheet({ onClose }) {
  useBackToClose(true, onClose);
  const filters = useCrmStore((s) => s.filters);
  const setFilters = useCrmStore((s) => s.setFilters);
  const resetFilters = useCrmStore((s) => s.resetFilters);
  const board = useCrmStore((s) => s.board);
  const religiousLevels = religiousLevelsFor(board);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl safe-bottom">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#5A4A3C]">סינון חכם</h2>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-[#FBF3EA]" aria-label="סגירה">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-[#5A4A3C]">חיפוש חופשי לפי שם</label>
            <div className="relative">
              <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#C3B5A5]" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ search: e.target.value })}
                placeholder="לדוגמה: שירה"
                className="w-full rounded-2xl border border-[#EADCCB] bg-white py-2.5 pr-9 pl-3 text-sm outline-none focus:border-[#C06E5E]"
              />
            </div>
          </div>

          <div>
            <p className="mb-1 text-[13px] font-semibold text-[#5A4A3C]">טווח גילאים</p>
            <RangeSlider
              min={AGE_LIMITS[0]}
              max={AGE_LIMITS[1]}
              value={filters.ageRange}
              onChange={(v) => setFilters({ ageRange: v })}
            />
          </div>

          <div>
            <p className="mb-1 text-[13px] font-semibold text-[#5A4A3C]">טווח גובה</p>
            <RangeSlider
              min={HEIGHT_LIMITS[0]}
              max={HEIGHT_LIMITS[1]}
              value={filters.heightRange}
              onChange={(v) => setFilters({ heightRange: v })}
              unit=" ס״מ"
            />
          </div>

          <div>
            <p className="mb-2 text-[13px] font-semibold text-[#5A4A3C]">רמת תורניות</p>
            <div className="flex flex-wrap gap-2">
              {["הכל", ...religiousLevels.filter((l) => l !== "הכל")].map((level) => (
                <button
                  key={level}
                  onClick={() => setFilters({ religiousLevel: level })}
                  className={`rounded-full border px-3.5 py-2 text-[13px] font-semibold transition ${
                    filters.religiousLevel === level
                      ? "border-[#C06E5E] bg-[#C06E5E] text-white"
                      : "border-[#EADCCB] bg-white text-[#5A4A3C] hover:bg-[#FBF3EA]"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[13px] font-semibold text-[#5A4A3C]">אזור מגורים</p>
            <div className="flex flex-wrap gap-2">
              {["הכל", ...REGIONS].map((region) => (
                <button
                  key={region}
                  onClick={() => setFilters({ region })}
                  className={`rounded-full border px-3.5 py-2 text-[13px] font-semibold transition ${
                    filters.region === region
                      ? "border-[#C06E5E] bg-[#C06E5E] text-white"
                      : "border-[#EADCCB] bg-white text-[#5A4A3C] hover:bg-[#FBF3EA]"
                  }`}
                >
                  {region}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <button onClick={resetFilters} className="flex-1 rounded-2xl border border-[#EADCCB] py-3 text-sm font-semibold text-[#5A4A3C]">
            איפוס
          </button>
          <Button variant="primary" className="flex-1" onClick={onClose}>
            החלת סינון
          </Button>
        </div>
      </div>
    </div>
  );
}
