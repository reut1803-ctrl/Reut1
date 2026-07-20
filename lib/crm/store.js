"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  ADMIN_USER,
  STAFF_USERS,
  VIEWER_USER,
  MOCK_NOTIFICATIONS,
  MOCK_TASKS,
  MALE_CANDIDATES,
  FEMALE_CANDIDATES,
  getCandidates,
  DEFAULT_TERMS_TEXT,
  DEFAULT_DAILY_TIP,
} from "./mockData";
import { GOOGLE_CLIENT_ID } from "./authConfig";
import { decodeJwtPayload } from "./jwt";

const DEFAULT_ALLOWLIST = [{ email: "reut1803@gmail.com", name: "רעות", role: "admin", staffId: null }];

export const PROPOSAL_STAGES = ["הוצע", "בבדיקה", "הוחלפו פרטים", "נפגשו", "בהמשך / מתקדמים", "אירוסין"];
export const PROPOSAL_DROPPED = "ירד מהפרק";

export const AVAILABILITY_STATUSES = ["פנוי", "לא פנוי", "בהפסקה"];

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

      // --- הרשאה. כשמוגדר Google Client ID, נקבעת רק ע"י כניסה עם גוגל + רשימת הרשאות.
      //     כל עוד לא הוגדר, נשארת ניתנת להחלפה ידנית להדגמה. ---
      role: GOOGLE_CLIENT_ID ? "viewer" : "admin",
      setRole: (role) => set({ role }),

      // --- זהות איש/אשת הצוות המחוברת כרגע (רלוונטי כש-role === "staff") ---
      currentStaffId: STAFF_USERS[0].id,
      setCurrentStaffId: (id) => set({ currentStaffId: id }),
      currentUser: () => {
        const { role, currentStaffId, googleUser } = get();
        if (role === "unauthorized") {
          return { ...VIEWER_USER, name: googleUser?.name || "לא מורשה/ית", email: googleUser?.email || "", picture: googleUser?.picture || null };
        }
        const base =
          role === "admin"
            ? ADMIN_USER
            : role === "staff"
            ? STAFF_USERS.find((s) => s.id === currentStaffId) || STAFF_USERS[0]
            : VIEWER_USER;
        if (googleUser && (role === "admin" || role === "staff")) {
          return {
            ...base,
            name: googleUser.name || base.name,
            email: googleUser.email || base.email,
            picture: googleUser.picture || null,
          };
        }
        return base;
      },

      // --- כניסה אישית עם גוגל (Google Identity Services) + רשימת הרשאות ---
      googleAuthEnabled: !!GOOGLE_CLIENT_ID,
      googleUser: null,
      authAllowlist: DEFAULT_ALLOWLIST,
      addAllowlistEntry: (entry) =>
        set((state) => ({ authAllowlist: [...state.authAllowlist.filter((e) => e.email !== entry.email), entry] })),
      removeAllowlistEntry: (email) =>
        set((state) => ({ authAllowlist: state.authAllowlist.filter((e) => e.email !== email) })),
      signInWithGoogle: (idToken) => {
        const payload = decodeJwtPayload(idToken);
        const googleUser = { email: payload.email, name: payload.name, picture: payload.picture };
        const match = get().authAllowlist.find((e) => e.email.toLowerCase() === payload.email.toLowerCase());
        set({
          googleUser,
          role: match ? match.role : "unauthorized",
          currentStaffId: match?.staffId || get().currentStaffId,
        });
      },
      signOutGoogle: () => set({ googleUser: null, role: "viewer" }),

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
      createProposal: (maleId, femaleId, rationale = "") => {
        const author = get().currentUser().name;
        const now = new Date().toISOString();
        const proposal = {
          id: `proposal-${maleId}-${femaleId}-${Date.now()}`,
          maleId,
          femaleId,
          status: PROPOSAL_STAGES[0],
          createdAt: now,
          rationale,
          assignee: null,
          journal: [{ id: `j-${Date.now()}`, date: now, status: PROPOSAL_STAGES[0], note: "ההצעה נוצרה", author }],
        };
        set((state) => ({ proposals: [proposal, ...state.proposals] }));
        get().clearProposalSelection();
        return proposal;
      },
      updateProposalStatus: (proposalId, status, note) => {
        const author = get().currentUser().name;
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
        if (status === PROPOSAL_STAGES[PROPOSAL_STAGES.length - 1]) {
          const proposal = get().proposals.find((p) => p.id === proposalId);
          const male = proposal && get().findCandidateById(proposal.maleId);
          const female = proposal && get().findCandidateById(proposal.femaleId);
          get().sendMockEmailToAdmin(
            "הצעת שידוך הגיעה לאירוסין! 🎉",
            `${author} עדכנ/ה שההצעה בין ${male?.name || "?"} ל-${female?.name || "?"} הגיעה לשלב אירוסין.`
          );
        }
      },
      updateProposalRationale: (proposalId, rationale) =>
        set((state) => ({
          proposals: state.proposals.map((p) => (p.id === proposalId ? { ...p, rationale } : p)),
        })),
      assignProposal: (proposalId, assignee) =>
        set((state) => ({
          proposals: state.proposals.map((p) => (p.id === proposalId ? { ...p, assignee } : p)),
        })),
      assignProposalToSelf: (proposalId) => {
        get().assignProposal(proposalId, get().currentUser().name);
      },
      proposalsForCandidate: (candidateId) =>
        get().proposals.filter((p) => p.maleId === candidateId || p.femaleId === candidateId),

      // --- מועמדים שהועלו ע"י הצוות (בנוסף למאגר הדמו) ---
      customCandidates: [],
      addCandidate: (candidate) => {
        const id = `custom-${candidate.gender}-${Date.now()}`;
        const newCandidate = {
          id,
          initials: candidate.name.split(" ").map((p) => p[0]).join(""),
          traits: [],
          isNew: true,
          isPrevious: false,
          matchScore: 70,
          gradient: Math.floor(Math.random() * 8),
          staffNote: "",
          adminNote: "",
          voiceNotes: [],
          availabilityStatus: "פנוי",
          complexityNotes: "",
          pdfUrl: null,
          introAudioUrl: null,
          ...candidate,
        };
        set((state) => ({ customCandidates: [newCandidate, ...state.customCandidates] }));
        return newCandidate;
      },

      // --- שינויים על מועמדים קיימים (סטטוס/קבצים/הערות) - נשמרים בנפרד, לא דורסים את נתוני הדמו המקוריים ---
      candidateOverrides: {},
      updateCandidateOverride: (id, partial) =>
        set((state) => ({
          candidateOverrides: { ...state.candidateOverrides, [id]: { ...state.candidateOverrides[id], ...partial } },
        })),
      applyOverrides: (candidate) => {
        const defaults = { availabilityStatus: "פנוי", complexityNotes: "", pdfUrl: null, introAudioUrl: null };
        const override = get().candidateOverrides[candidate.id];
        return { ...defaults, ...candidate, ...override };
      },
      allCandidates: (board) => {
        const custom = get().customCandidates.filter((c) => c.gender === board);
        return [...custom, ...getCandidates(board)].map(get().applyOverrides);
      },
      findCandidateById: (id) => {
        const base =
          get().customCandidates.find((c) => c.id === id) ||
          [...MALE_CANDIDATES, ...FEMALE_CANDIDATES].find((c) => c.id === id);
        return base ? get().applyOverrides(base) : undefined;
      },

      // --- משימות ---
      tasks: MOCK_TASKS,
      toggleTaskDone: (id) =>
        set((state) => ({ tasks: state.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) })),
      addTask: (task) =>
        set((state) => ({
          tasks: [{ id: `task-${Date.now()}`, done: false, ...task }, ...state.tasks],
        })),
      // הוספת משימה יזומה ע"י המנהלת, משויכת ישירות לאיש/אשת צוות
      pushTaskToStaff: (title, dueDate, assigneeId) => {
        const assignee = STAFF_USERS.find((s) => s.id === assigneeId);
        set((state) => ({
          tasks: [
            {
              id: `task-${Date.now()}`,
              title,
              dueDate: dueDate || null,
              done: false,
              owner: assignee?.name || "לא משויך",
              assigneeId,
              pushedByAdmin: true,
              seenByAssignee: false,
              createdAt: new Date().toISOString(),
            },
            ...state.tasks,
          ],
        }));
      },
      markTasksSeenByStaff: (staffId) =>
        set((state) => ({
          tasks: state.tasks.map((t) => (t.assigneeId === staffId ? { ...t, seenByAssignee: true } : t)),
        })),
      pendingPushedTasksCount: (staffId) =>
        get().tasks.filter((t) => t.assigneeId === staffId && t.pushedByAdmin && !t.seenByAssignee && !t.done).length,

      // --- מעקב שקט (טלמטריה) - רק כשמחוברים כ-staff ---
      telemetry: {},
      trackProfileView: () => {
        const { role, currentStaffId } = get();
        if (role !== "staff") return;
        set((state) => ({
          telemetry: {
            ...state.telemetry,
            [currentStaffId]: {
              ...state.telemetry[currentStaffId],
              profileViews: (state.telemetry[currentStaffId]?.profileViews || 0) + 1,
            },
          },
        }));
      },
      trackAudioPlay: () => {
        const { role, currentStaffId } = get();
        if (role !== "staff") return;
        set((state) => ({
          telemetry: {
            ...state.telemetry,
            [currentStaffId]: {
              ...state.telemetry[currentStaffId],
              audioPlays: (state.telemetry[currentStaffId]?.audioPlays || 0) + 1,
            },
          },
        }));
      },

      // --- שער תקנון סודיות - חובה לאישור בכניסה ראשונית כ-staff ---
      termsText: DEFAULT_TERMS_TEXT,
      setTermsText: (text) => set({ termsText: text }),
      termsAccepted: {},
      acceptTerms: (staffId) => {
        set((state) => ({ termsAccepted: { ...state.termsAccepted, [staffId]: true } }));
        const staff = STAFF_USERS.find((s) => s.id === staffId);
        get().sendMockEmailToAdmin("אישור תקנון סודיות", `${staff?.name || staffId} אישר/ה את תקנון הסודיות.`);
      },

      // --- טיפ שידוכים יומי/שבועי (Knowledge Base) ---
      dailyTip: DEFAULT_DAILY_TIP,
      setDailyTip: (text) => set({ dailyTip: text }),

      // --- יומן מיילים מדומה למנהלת (הכנה לחיבור אמיתי) ---
      emailLog: [],
      sendMockEmailToAdmin: (subject, body) => {
        const entry = { id: `mail-${Date.now()}`, to: ADMIN_USER.email, subject, body, date: new Date().toISOString() };
        console.log("[Mock Email → Admin]", entry);
        set((state) => ({ emailLog: [entry, ...state.emailLog] }));
      },
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
        customCandidates: state.customCandidates,
        candidateOverrides: state.candidateOverrides,
        currentStaffId: state.currentStaffId,
        telemetry: state.telemetry,
        termsText: state.termsText,
        termsAccepted: state.termsAccepted,
        dailyTip: state.dailyTip,
        emailLog: state.emailLog,
        googleUser: state.googleUser,
        authAllowlist: state.authAllowlist,
      }),
    }
  )
);
