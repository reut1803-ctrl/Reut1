"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ADMIN_USER, STAFF_USERS, VIEWER_USER, MOCK_NOTIFICATIONS } from "./mockData";

export const DEMO_USERS_BY_ROLE = {
  admin: ADMIN_USER,
  staff: STAFF_USERS[0],
  viewer: VIEWER_USER,
};

const DEFAULT_QUIZ_ANSWERS = {
  ageRange: [24, 32],
  heightRange: [160, 180],
  yeshivaLevel: "לא משנה",
  regions: [],
  education: "לא משנה",
  smoking: "לא משנה",
  traits: [],
};

export const useCrmStore = create(
  persist(
    (set, get) => ({
      // --- מאגר פעיל: בנים / בנות ---
      board: "female",
      setBoard: (board) => set({ board }),

      // --- הרשאה (להדגמה בלבד - לצורך בדיקת 3 הרמות) ---
      role: "admin",
      setRole: (role) => set({ role }),

      // --- מועדפים ---
      favorites: {},
      toggleFavorite: (id) =>
        set((state) => ({
          favorites: { ...state.favorites, [id]: !state.favorites[id] },
        })),
      isFavorite: (id) => !!get().favorites[id],
      favoritesCount: () => Object.values(get().favorites).filter(Boolean).length,

      // --- התראות ---
      notifications: MOCK_NOTIFICATIONS,
      markAllNotificationsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        })),
      unreadCount: () => get().notifications.filter((n) => !n.read).length,
      notificationsEnabled: true,
      toggleNotificationsEnabled: () =>
        set((state) => ({ notificationsEnabled: !state.notificationsEnabled })),

      // --- שאלון התאמות ---
      quizAnswers: DEFAULT_QUIZ_ANSWERS,
      quizCompleted: false,
      setQuizAnswers: (partial) =>
        set((state) => ({ quizAnswers: { ...state.quizAnswers, ...partial } })),
      completeQuiz: () => set({ quizCompleted: true }),
      resetQuiz: () => set({ quizCompleted: false }),

      // --- סינון בפיד ---
      filters: {
        ageRange: [20, 40],
        heightRange: [150, 195],
        religiousLevel: "הכל",
        region: "הכל",
        search: "",
      },
      setFilters: (partial) =>
        set((state) => ({ filters: { ...state.filters, ...partial } })),
      resetFilters: () =>
        set({
          filters: { ageRange: [20, 40], heightRange: [150, 195], religiousLevel: "הכל", region: "הכל", search: "" },
        }),

      // --- כרטיסיה פתוחה עם אזור פנימי (הקלטות/הערות מנהלת) ---
      expandedStaffAreaId: null,
      toggleStaffArea: (id) =>
        set((state) => ({ expandedStaffAreaId: state.expandedStaffAreaId === id ? null : id })),
    }),
    {
      name: "shidduch-crm-demo-storage",
      partialize: (state) => ({
        favorites: state.favorites,
        quizAnswers: state.quizAnswers,
        quizCompleted: state.quizCompleted,
        role: state.role,
        board: state.board,
        notificationsEnabled: state.notificationsEnabled,
      }),
    }
  )
);
