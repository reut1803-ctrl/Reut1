"use client";

import { useMemo, useState } from "react";
import { Heart } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { getCandidates } from "@/lib/data";
import { useScrollRestoration } from "@/lib/useScrollRestoration";
import ProfileCard from "@/components/profiles/ProfileCard";
import ProfileDetailSheet from "@/components/profiles/ProfileDetailSheet";

export default function FavoritesPage() {
  const gender = useAppStore((s) => s.gender);
  const favorites = useAppStore((s) => s.favorites);
  const [selected, setSelected] = useState(null);

  useScrollRestoration(`favorites-${gender}`);

  const favoriteCandidates = useMemo(
    () => getCandidates(gender).filter((c) => favorites.includes(c.id)),
    [gender, favorites]
  );

  return (
    <div className="flex flex-col gap-4">
      <h1 className="px-1 text-lg font-extrabold text-ink">המועדפים שלי</h1>

      {favoriteCandidates.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 py-14 text-center">
          <Heart size={26} className="text-pink-300" />
          <p className="text-sm font-medium text-ink">עדיין אין מועדפים</p>
          <p className="text-xs text-muted">סמני לב על כרטיסייה בפיד כדי לשמור אותה כאן</p>
        </div>
      ) : (
        favoriteCandidates.map((candidate) => (
          <ProfileCard key={candidate.id} candidate={candidate} onReadMore={setSelected} />
        ))
      )}

      <ProfileDetailSheet candidate={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
