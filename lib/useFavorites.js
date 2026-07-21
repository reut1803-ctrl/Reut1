"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/supabase/AuthProvider";
import { fetchFavoriteIds, toggleFavorite as toggleFavoriteQuery } from "@/lib/queries";

export function useFavorites() {
  const { supabase, user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState([]);

  const load = useCallback(async () => {
    if (!user) return;
    setFavoriteIds(await fetchFavoriteIds(supabase, user.id));
  }, [supabase, user]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = useCallback(
    async (candidateId) => {
      const isFav = favoriteIds.includes(candidateId);
      setFavoriteIds((prev) => (isFav ? prev.filter((id) => id !== candidateId) : [...prev, candidateId]));
      await toggleFavoriteQuery(supabase, user.id, candidateId, isFav);
    },
    [supabase, user, favoriteIds]
  );

  return { favoriteIds, toggleFavorite: toggle };
}
