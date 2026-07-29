"use client";

import { X, Search } from "lucide-react";
import { useCrmStore } from "@/lib/crm/store";
import RangeSlider from "@/components/crm/ui/RangeSlider";
import { REGIONS, religiousLevelsFor } from "@/lib/crm/mockData";
import Button from "@/components/crm/ui/Button";

export default function FilterSheet({ onClose }) {
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
          <h2 className="text-lg font-bold text-[#3B332A]">סינון חכם</h2>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-[#FAF6EE]" aria-label="סגירה">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-[#3B332A]">חיפוש חופשי לפי שם</label>
            <div className="relative">
              <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B4AA9C]" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ search: e.target.value })}
                placeholder="לדוגמה: שירה"
                className="w-full rounded-2xl border border-[#E7DECD] bg-white py-2.5 pr-9 pl-3 text-sm outline-none focus:border-[#6F4A2E]"
              />
            </div>
          </div>

          <div>
            <p className="mb-1 text-[13px] font-semibold text-[#3B332A]">טווח גילאים</p>
            <RangeSlider
              min={18}
              max={50}
              value={filters.ageRange}
              onChange={(v) => setFilters({ ageRange: v })}
            />
          </div>

          <div>
            <p className="mb-1 text-[13px] font-semibold text-[#3B332A]">טווח גובה</p>
            <RangeSlider
              min={145}
              max={205}
              value={filters.heightRange}
              onChange={(v) => setFilters({ heightRange: v })}
              unit=" ס״מ"
            />
          </div>

          <div>
            <p className="mb-2 text-[13px] font-semibold text-[#3B332A]">רמת תורניות</p>
            <div className="flex flex-wrap gap-2">
              {["הכל", ...religiousLevels.filter((l) => l !== "הכל")].map((level) => (
                <button
                  key={level}
                  onClick={() => setFilters({ religiousLevel: level })}
                  className={`rounded-full border px-3.5 py-2 text-[13px] font-semibold transition ${
                    filters.religiousLevel === level
                      ? "border-[#6F4A2E] bg-[#6F4A2E] text-white"
                      : "border-[#E7DECD] bg-white text-[#3B332A] hover:bg-[#FAF6EE]"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[13px] font-semibold text-[#3B332A]">אזור מגורים</p>
            <div className="flex flex-wrap gap-2">
              {["הכל", ...REGIONS].map((region) => (
                <button
                  key={region}
                  onClick={() => setFilters({ region })}
                  className={`rounded-full border px-3.5 py-2 text-[13px] font-semibold transition ${
                    filters.region === region
                      ? "border-[#6F4A2E] bg-[#6F4A2E] text-white"
                      : "border-[#E7DECD] bg-white text-[#3B332A] hover:bg-[#FAF6EE]"
                  }`}
                >
                  {region}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <button onClick={resetFilters} className="flex-1 rounded-2xl border border-[#E7DECD] py-3 text-sm font-semibold text-[#3B332A]">
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
