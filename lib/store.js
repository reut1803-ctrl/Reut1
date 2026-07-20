"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { NOTIFICATIONS_SEED } from "./data";
import { DEFAULT_WIZARD_ANSWERS } from "./wizardOptions";

export const useAppStore = create(
  persist(
    (set, get) => ({
      // תפקיד מחובר — לצורך הדגמה אפשר להחליף בין הרמות מהגדרות (בעתיד יגיע מהתחברות אמיתית)
      role: "admin", // "admin" | "staff" | "viewer"
      setRole: (role) => set({ role }),

      // מאגר בנים / מאגר בנות
      gender: "female",
      setGender: (gender) => set({ gender }),

      // מועדפים
      favorites: [],
      toggleFavorite: (id) =>
        set((s) => ({
          favorites: s.favorites.includes(id)
            ? s.favorites.filter((f) => f !== id)
            : [...s.favorites, id],
        })),
      isFavorite: (id) => get().favorites.includes(id),

      // התראות
      notifications: NOTIFICATIONS_SEED,
      markAllNotificationsRead: () =>
        set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
      unreadCount: () => get().notifications.filter((n) => !n.read).length,
      notificationsEnabled: true,
      setNotificationsEnabled: (v) => set({ notificationsEnabled: v }),

      // שאלון ההתאמות
      wizardAnswers: DEFAULT_WIZARD_ANSWERS,
      wizardCompleted: false,
      wizardStarted: false,
      wizardStep: 0,
      setWizardStep: (step) => set({ wizardStep: step, wizardStarted: true }),
      updateWizardAnswer: (key, value) =>
        set((s) => ({ wizardAnswers: { ...s.wizardAnswers, [key]: value } })),
      completeWizard: () => set({ wizardCompleted: true, wizardStarted: false, wizardStep: 0 }),
      restartWizard: () => set({ wizardCompleted: false, wizardStarted: true, wizardStep: 0 }),

      // טאב פעיל בפיד
      feedTab: "new", // "new" | "previous"
      setFeedTab: (feedTab) => set({ feedTab }),

      // סינון בפיד
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
    }),
    {
      name: "shidduch-crm-store",
      partialize: (s) => ({
        role: s.role,
        gender: s.gender,
        favorites: s.favorites,
        notifications: s.notifications,
        notificationsEnabled: s.notificationsEnabled,
        wizardAnswers: s.wizardAnswers,
        wizardCompleted: s.wizardCompleted,
        wizardStarted: s.wizardStarted,
        wizardStep: s.wizardStep,
        feedTab: s.feedTab,
        filters: s.filters,
      }),
    }
  )
);
