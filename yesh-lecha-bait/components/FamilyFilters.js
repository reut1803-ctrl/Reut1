"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";

export const FILTERS = [
  ["all", "הכול"],
  ["current", "מועמד עכשווי"],
  ["future", "פוטנציאל עתידי"],
  ["none", "טרם סווג"],
];

export function useFamilyFilter(families) {
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const shown = useMemo(() => {
    const term = q.trim();
    return families
      .filter((f) => (filter === "all" ? true : filter === "none" ? !f.status : f.status === filter))
      .filter((f) => !term || `${f.lastName} ${f.firstName} ${f.street} ${(f.phones || []).join(" ")}`.includes(term))
      .sort((a, b) => String(a.lastName).localeCompare(String(b.lastName), "he"));
  }, [families, filter, q]);
  const counts = useMemo(
    () => ({
      all: families.length,
      current: families.filter((f) => f.status === "current").length,
      future: families.filter((f) => f.status === "future").length,
      none: families.filter((f) => !f.status).length,
    }),
    [families]
  );
  return { filter, setFilter, q, setQ, shown, counts };
}

export function FilterBar({ filter, setFilter, q, setQ, counts }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative -mx-1 flex gap-1 overflow-x-auto rounded-full bg-white/60 p-1 sm:mx-0 sm:inline-flex">
        {FILTERS.map(([key, label]) => (
          <button key={key} type="button" onClick={() => setFilter(key)} className="relative shrink-0 rounded-full px-3.5 py-1.5 text-sm">
            {filter === key && (
              <motion.span layoutId="filter-pill" className="absolute inset-0 rounded-full bg-white shadow-glow" transition={{ type: "spring", stiffness: 380, damping: 32 }} />
            )}
            <span className={`relative ${filter === key ? "text-bordeaux" : "text-ink-soft"}`}>
              {label} <span className="text-xs text-gold-dark">{counts[key]}</span>
            </span>
          </button>
        ))}
      </div>
      <label className="relative sm:w-72">
        <Search size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-soft/60" />
        <input className="field !py-2.5 !pr-10" placeholder="חיפוש שם, רחוב או טלפון" value={q} onChange={(e) => setQ(e.target.value)} />
      </label>
    </div>
  );
}

