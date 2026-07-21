"use client";

import { useEffect, useMemo, useState } from "react";
import { Heart } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useAuth } from "@/lib/supabase/AuthProvider";
import { fetchCandidates } from "@/lib/queries";
import { useFavorites } from "@/lib/useFavorites";
import { useScrollRestoration } from "@/lib/useScrollRestoration";
import ProfileCard from "@/components/profiles/ProfileCard";
import ProfileDetailSheet from "@/components/profiles/ProfileDetailSheet";

export default function FavoritesPage() {
  const { supabase } = useAuth();
  const gender = useAppStore((s) => s.gender);
  const [selected, setSelected] = useState(null);
  const [allCandidates, setAllCandidates] = useState([]);
  const { favoriteIds, toggleFavorite } = useFavorites();

  useScrollRestoration(`favorites-${gender}`);

  useEffect(() => {
    fetchCandidates(supabase, gender).then(setAllCandidates);
  }, [supabase, gender]);

  const favoriteCandidates = useMemo(
    () => allCandidates.filter((c) => favoriteIds.includes(c.id)),
    [allCandidates, favoriteIds]
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
          <ProfileCard
            key={candidate.id}
            candidate={candidate}
            onReadMore={setSelected}
            isFavorite={favoriteIds.includes(candidate.id)}
            onToggleFavorite={toggleFavorite}
          />
        ))
      )}

      <ProfileDetailSheet candidate={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
