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
      <h1 className="mb-4 text-xl font-bold text-[#5A4A3C]">מועדפים</h1>

      {favCandidates.length === 0 ? (
        <div className="mt-10 flex flex-col items-center text-center">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#F7DFD8]">
            <Heart size={28} className="text-[#F1B3A6]" />
          </div>
          <p className="text-sm font-semibold text-[#5A4A3C]">עדיין אין לך מועדפים</p>
          <p className="mt-1 text-[13px] text-[#8C7B6B]">לחצי על סמל הלב בכרטיסייה כדי לשמור אותה כאן</p>
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
