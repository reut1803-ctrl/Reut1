"use client";

import { useMemo } from "react";
import { Heart } from "lucide-react";
import { useCrmStore } from "@/lib/crm/store";
import ProfileCard from "@/components/crm/profiles/ProfileCard";

export default function FavoritesPage() {
  const favorites = useCrmStore((s) => s.favorites);
  const allCandidates = useCrmStore((s) => s.allCandidates);
  const candidates_ = useCrmStore((s) => s.candidates);

  const favCandidates = useMemo(() => {
    const all = [...allCandidates("male"), ...allCandidates("female")];
    return all.filter((c) => favorites[c.id]);
  }, [favorites, candidates_]);

  return (
    <div className="px-4 py-4">
      <h1 className="mb-4 text-xl font-bold text-[#3A2E26]">מועדפים</h1>

      {favCandidates.length === 0 ? (
        <div className="mt-10 flex flex-col items-center text-center">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#F0E2DE]">
            <Heart size={28} className="text-[#C08D88]" />
          </div>
          <p className="text-sm font-semibold text-[#3A2E26]">עדיין אין לך מועדפים</p>
          <p className="mt-1 text-[13px] text-[#7C6E60]">לחצי על סמל הלב בכרטיסייה כדי לשמור אותה כאן</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {favCandidates.map((c) => (
            <ProfileCard key={c.id} candidate={c} />
          ))}
        </div>
      )}
    </div>
  );
}
