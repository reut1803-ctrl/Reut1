"use client";

import { useMemo } from "react";
import { Heart } from "lucide-react";
import { useCrmStore } from "@/lib/crm/store";
import ProfileCard from "@/components/crm/profiles/ProfileCard";

export default function FavoritesPage() {
  const favorites = useCrmStore((s) => s.favorites);
  const allCandidates = useCrmStore((s) => s.allCandidates);
  const customCandidates = useCrmStore((s) => s.customCandidates);

  const favCandidates = useMemo(() => {
    const all = [...allCandidates("male"), ...allCandidates("female")];
    return all.filter((c) => favorites[c.id]);
  }, [favorites, customCandidates]);

  return (
    <div className="px-4 py-4">
      <h1 className="mb-4 text-xl font-bold text-[#3A3335]">מועדפים</h1>

      {favCandidates.length === 0 ? (
        <div className="mt-10 flex flex-col items-center text-center">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#F6E4E6]">
            <Heart size={28} className="text-[#E9B9C0]" />
          </div>
          <p className="text-sm font-semibold text-[#3A3335]">עדיין אין לך מועדפים</p>
          <p className="mt-1 text-[13px] text-[#8A8285]">לחצי על סמל הלב בכרטיסייה כדי לשמור אותה כאן</p>
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
