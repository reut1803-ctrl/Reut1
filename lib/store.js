"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

// מצב UI מקומי בלבד (לא נתונים משותפים) - מאגר בנים/בנות, סינון, וניווט בשאלון.
// נתונים משותפים בין כל המשתמשות (מועדפים, התראות, תשובות שאלון) יושבים ב-Supabase, ראו lib/queries.js
export const useAppStore = create(
  persist(
    (set) => ({
      gender: "female",
      setGender: (gender) => set({ gender }),

      feedTab: "new", // "new" | "previous"
      setFeedTab: (feedTab) => set({ feedTab }),

      filters: {
        search: "",
        ageRange: [18, 45],
        heightRange: [150, 200],
        religiousLevel: "הכל",
        regions: [],
      },
      setFilters: (filters) => set((s) => ({ filters: { ...s.filters, ...filters } })),
      resetFilters: () =>
        set({
          filters: { search: "", ageRange: [18, 45], heightRange: [150, 200], religiousLevel: "הכל", regions: [] },
        }),

      wizardStep: 0,
      wizardStarted: false,
      setWizardStep: (step) => set({ wizardStep: step, wizardStarted: true }),
      resetWizardUi: () => set({ wizardStep: 0, wizardStarted: false }),
    }),
    {
      name: "shidduch-crm-store",
      partialize: (s) => ({
        gender: s.gender,
        feedTab: s.feedTab,
        filters: s.filters,
      }),
    }
  )
);
