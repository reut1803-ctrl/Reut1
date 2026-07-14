"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ADMIN_USER, STAFF_USERS, VIEWER_USER, MOCK_NOTIFICATIONS, MOCK_TASKS } from "./mockData";

export const PROPOSAL_STAGES = ["הוצע", "בבדיקה", "הוחלפו פרטים", "נפגשו", "בהמשך / מתקדמים", "אירוסין"];
export const PROPOSAL_DROPPED = "ירד מהפרק";

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

      // --- בחירת שני פרופילים להצעת התאמה ---
      proposalSelection: { male: null, female: null },
      clearProposalSelection: () => set({ proposalSelection: { male: null, female: null } }),
      setProposalSelection: (key, id) =>
        set((state) => ({ proposalSelection: { ...state.proposalSelection, [key]: id || null } })),

      // --- הצעות שידוך (התאמות בין שני מועמדים) ---
      proposals: [],
      createProposal: (maleId, femaleId) => {
        const author = get().role === "admin" ? ADMIN_USER.name : STAFF_USERS[0].name;
        const now = new Date().toISOString();
        const proposal = {
          id: `proposal-${maleId}-${femaleId}-${Date.now()}`,
          maleId,
          femaleId,
          status: PROPOSAL_STAGES[0],
          createdAt: now,
          journal: [{ id: `j-${Date.now()}`, date: now, status: PROPOSAL_STAGES[0], note: "ההצעה נוצרה", author }],
        };
        set((state) => ({ proposals: [proposal, ...state.proposals] }));
        get().clearProposalSelection();
        return proposal;
      },
      updateProposalStatus: (proposalId, status, note) => {
        const author = get().role === "admin" ? ADMIN_USER.name : STAFF_USERS[0].name;
        const now = new Date().toISOString();
        set((state) => ({
          proposals: state.proposals.map((p) =>
            p.id === proposalId
              ? {
                  ...p,
                  status,
                  journal: [...p.journal, { id: `j-${Date.now()}`, date: now, status, note: note || "", author }],
                }
              : p
          ),
        }));
      },
      proposalsForCandidate: (candidateId) =>
        get().proposals.filter((p) => p.maleId === candidateId || p.femaleId === candidateId),

      // --- משימות ---
      tasks: MOCK_TASKS,
      toggleTaskDone: (id) =>
        set((state) => ({ tasks: state.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) })),
      addTask: (task) =>
        set((state) => ({
          tasks: [{ id: `task-${Date.now()}`, done: false, ...task }, ...state.tasks],
        })),
    }),
    {
      name: "shidduch-crm-demo-storage",
      skipHydration: true,
      partialize: (state) => ({
        favorites: state.favorites,
        quizAnswers: state.quizAnswers,
        quizCompleted: state.quizCompleted,
        role: state.role,
        board: state.board,
        notificationsEnabled: state.notificationsEnabled,
        proposals: state.proposals,
        tasks: state.tasks,
      }),
    }
  )
);
