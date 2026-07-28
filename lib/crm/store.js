"use client";

import { create } from "zustand";
import {
  collection,
  doc,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
} from "firebase/firestore";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { crmDb, crmAuth, googleProvider } from "./firebaseClient";
import { DEFAULT_TERMS_TEXT, DEFAULT_DAILY_TIP } from "./mockData";
import { BOOTSTRAP_ADMIN_EMAIL, isFirebaseConfigured } from "../appConfig";

const isBootstrapAdmin = (email) =>
  !!email && email.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();

export const PROPOSAL_STAGES = ["הוצע", "בבדיקה", "הוחלפו פרטים", "נפגשו", "בהמשך / מתקדמים", "אירוסין"];
export const PROPOSAL_DROPPED = "ירד מהפרק";

export const AVAILABILITY_STATUSES = ["פנוי", "לא פנוי", "בהפסקה"];

const DEFAULT_QUIZ_ANSWERS = {
  ageRange: [24, 32],
  heightRange: [160, 180],
  religiousLevel: "הכל",
  regions: [],
  education: "לא משנה",
  smoking: "לא משנה",
  traits: [],
};

const withId = (d) => ({ id: d.id, ...d.data() });

export const useCrmStore = create((set, get) => ({
  // --- מאגר פעיל: בנים / בנות ---
  board: "female",
  // מעבר מאגר מאפס את סינון רמת התורניות, כי הערכים שונים בין הרשימה הגברית לנשית (למשל "תורני" מול "תורנית")
  setBoard: (board) => set((state) => ({ board, filters: { ...state.filters, religiousLevel: "הכל" } })),

  // --- אתחול חיבור Firebase + כל המאזינים בזמן אמת (נקרא פעם אחת מ-AppShell) ---
  _initialized: false,
  authLoading: true,
  initCrmFirebase: () => {
    if (get()._initialized) return;
    set({ _initialized: true });

    // עוד לא הוגדר מסד נתונים למערכת: מציגים את מסך הכניסה במקום להמתין
    // לנצח לתשובה משרת שאינו קיים.
    if (!isFirebaseConfigured) {
      set({ authLoading: false });
      return;
    }

    onSnapshot(collection(crmDb, "staffAllowlist"), (snap) => {
      set({ authAllowlist: snap.docs.map(withId) });
      get().recomputeRole();
    });

    onSnapshot(collection(crmDb, "candidates"), (snap) => {
      set({ candidates: snap.docs.map(withId), candidatesLoaded: true });
    });

    onSnapshot(collection(crmDb, "candidateStatus"), (snap) => {
      const map = {};
      snap.docs.forEach((d) => (map[d.id] = d.data().availabilityStatus));
      set({ candidateStatus: map });
    });

    onSnapshot(collection(crmDb, "proposals"), (snap) => {
      set({ proposals: snap.docs.map(withId) });
    });

    onSnapshot(collection(crmDb, "tasks"), (snap) => {
      set({ tasks: snap.docs.map(withId) });
    });

    onSnapshot(collection(crmDb, "serviceTypes"), (snap) => {
      set({ serviceTypes: snap.docs.map(withId) });
    });

    onSnapshot(collection(crmDb, "charges"), (snap) => {
      set({ charges: snap.docs.map(withId) });
    });

    onSnapshot(collection(crmDb, "emailLog"), (snap) => {
      const list = snap.docs.map(withId).sort((a, b) => new Date(b.date) - new Date(a.date));
      set({ emailLog: list });
    });

    onSnapshot(collection(crmDb, "termsAcceptances"), (snap) => {
      const map = {};
      snap.docs.forEach((d) => (map[d.id] = true));
      set({ termsAccepted: map });
    });

    onSnapshot(collection(crmDb, "telemetry"), (snap) => {
      const map = {};
      snap.docs.forEach((d) => (map[d.id] = d.data()));
      set({ telemetry: map });
    });

    onSnapshot(doc(crmDb, "settings", "app"), (d) => {
      const data = d.exists() ? d.data() : {};
      set({
        termsText: data.termsText ?? DEFAULT_TERMS_TEXT,
        tips: data.tips ?? (data.dailyTip ? [data.dailyTip] : [DEFAULT_DAILY_TIP]),
        weeklyGoals: data.weeklyGoals ?? { profileViews: 20, audioPlays: 10 },
      });
    });

    onAuthStateChanged(crmAuth, (user) => {
      if (user) {
        set({ googleUser: { email: user.email, name: user.displayName, picture: user.photoURL, uid: user.uid } });
        onSnapshot(doc(crmDb, "userPrefs", user.email.toLowerCase()), (d) => {
          if (d.exists()) set({ favorites: d.data().favorites || {} });
        });
      } else {
        set({ googleUser: null, favorites: {} });
      }
      get().recomputeRole();
      set({ authLoading: false });
    });
  },

  // --- הרשאה: נקבעת אך ורק לפי כניסה עם גוגל + רשימת ההרשאות ב-Firestore ---
  googleUser: null,
  role: "viewer", // viewer (לא מחוברת) | unauthorized (מחוברת, לא ברשימה) | staff | admin
  currentStaffEmail: null,
  authAllowlist: [],
  recomputeRole: () => {
    const { googleUser, authAllowlist } = get();
    if (!googleUser) {
      set({ role: "viewer", currentStaffEmail: null });
      return;
    }
    const match = authAllowlist.find((e) => e.email.toLowerCase() === googleUser.email.toLowerCase());
    if (!match) {
      // המנהלת הראשונה מזוהה גם כשרשימת הצוות ריקה לגמרי, כדי שתמיד אפשר יהיה
      // להיכנס למערכת חדשה ולהוסיף ממנה את שאר אנשי הצוות.
      if (isBootstrapAdmin(googleUser.email)) {
        set({ role: "admin", currentStaffEmail: null });
        return;
      }
      set({ role: "unauthorized", currentStaffEmail: null });
      return;
    }
    set({ role: match.role, currentStaffEmail: match.role === "staff" ? match.email.toLowerCase() : null });
  },
  currentUser: () => {
    const { googleUser, role, authAllowlist } = get();
    if (!googleUser) return { name: "אורחת", email: "", picture: null, role: "viewer" };
    const match = authAllowlist.find((e) => e.email.toLowerCase() === googleUser.email.toLowerCase());
    return {
      name: googleUser.name || match?.name || googleUser.email,
      email: googleUser.email,
      picture: googleUser.picture,
      role,
    };
  },
  staffList: () => get().authAllowlist.filter((e) => e.role === "staff"),
  signInWithGoogle: async () => {
    await signInWithPopup(crmAuth, googleProvider);
  },
  signOutGoogle: async () => {
    await signOut(crmAuth);
  },
  addAllowlistEntry: async (entry) => {
    await setDoc(doc(crmDb, "staffAllowlist", entry.email.toLowerCase()), {
      name: entry.name,
      role: entry.role,
      email: entry.email.toLowerCase(),
    });
  },
  removeAllowlistEntry: async (email) => {
    await deleteDoc(doc(crmDb, "staffAllowlist", email.toLowerCase()));
  },

  // --- מועדפים (פר-משתמש, מסונכרן ל-Firestore כשמחוברים) ---
  favorites: {},
  toggleFavorite: (id) => {
    set((state) => ({ favorites: { ...state.favorites, [id]: !state.favorites[id] } }));
    const user = get().currentUser();
    if (user.email) {
      setDoc(doc(crmDb, "userPrefs", user.email.toLowerCase()), { favorites: get().favorites }, { merge: true }).catch(
        () => {}
      );
    }
  },
  isFavorite: (id) => !!get().favorites[id],
  favoritesCount: () => Object.values(get().favorites).filter(Boolean).length,

  // --- התראות (מקומי בלבד בשלב זה) ---
  notifications: [],
  markAllNotificationsRead: () =>
    set((state) => ({ notifications: state.notifications.map((n) => ({ ...n, read: true })) })),
  unreadCount: () => get().notifications.filter((n) => !n.read).length,
  notificationsEnabled: true,
  toggleNotificationsEnabled: () => set((state) => ({ notificationsEnabled: !state.notificationsEnabled })),

  // --- הודעת "נשמר בהצלחה" קופצת (Toast) ---
  toast: null,
  showToast: (message) => set({ toast: { id: Date.now(), message } }),
  clearToast: () => set({ toast: null }),

  // --- שאלון התאמות (מקומי, פר-מכשיר) ---
  quizAnswers: DEFAULT_QUIZ_ANSWERS,
  quizCompleted: false,
  setQuizAnswers: (partial) => set((state) => ({ quizAnswers: { ...state.quizAnswers, ...partial } })),
  completeQuiz: () => set({ quizCompleted: true }),
  resetQuiz: () => set({ quizCompleted: false }),

  // --- סינון בפיד ---
  filters: { ageRange: [20, 40], heightRange: [150, 195], religiousLevel: "הכל", region: "הכל", search: "", tag: null },
  setFilters: (partial) => set((state) => ({ filters: { ...state.filters, ...partial } })),
  resetFilters: () =>
    set((state) => ({
      filters: { ageRange: [20, 40], heightRange: [150, 195], religiousLevel: "הכל", region: "הכל", search: "", tag: state.filters.tag },
    })),

  // --- כרטיסיה פתוחה עם אזור פנימי ---
  expandedStaffAreaId: null,
  toggleStaffArea: (id) => set((state) => ({ expandedStaffAreaId: state.expandedStaffAreaId === id ? null : id })),

  // --- בחירת שני פרופילים להצעת התאמה ---
  proposalSelection: { male: null, female: null },
  clearProposalSelection: () => set({ proposalSelection: { male: null, female: null } }),
  setProposalSelection: (key, id) => set((state) => ({ proposalSelection: { ...state.proposalSelection, [key]: id || null } })),

  // --- הצעות שידוך ---
  proposals: [],
  createProposal: async (maleId, femaleId, rationale = "") => {
    const author = get().currentUser().name;
    const now = new Date().toISOString();
    const proposal = {
      maleId,
      femaleId,
      status: PROPOSAL_STAGES[0],
      createdAt: now,
      rationale,
      assignee: null,
      journal: [{ id: `j-${Date.now()}`, date: now, status: PROPOSAL_STAGES[0], note: "ההצעה נוצרה", author }],
    };
    const ref = await addDoc(collection(crmDb, "proposals"), proposal);
    get().clearProposalSelection();
    return { id: ref.id, ...proposal };
  },
  updateProposalStatus: async (proposalId, status, note) => {
    const author = get().currentUser().name;
    const now = new Date().toISOString();
    const proposal = get().proposals.find((p) => p.id === proposalId);
    if (!proposal) return;
    const journal = [...proposal.journal, { id: `j-${Date.now()}`, date: now, status, note: note || "", author }];
    await updateDoc(doc(crmDb, "proposals", proposalId), { status, journal });
    if (status === PROPOSAL_STAGES[PROPOSAL_STAGES.length - 1]) {
      const male = get().findCandidateById(proposal.maleId);
      const female = get().findCandidateById(proposal.femaleId);
      get().sendMockEmailToAdmin(
        "הצעת שידוך הגיעה לאירוסין! 🎉",
        `${author} עדכנ/ה שההצעה בין ${male?.name || "?"} ל-${female?.name || "?"} הגיעה לשלב אירוסין.`
      );
    }
  },
  updateProposalRationale: async (proposalId, rationale) => {
    await updateDoc(doc(crmDb, "proposals", proposalId), { rationale });
  },
  assignProposal: async (proposalId, assignee) => {
    await updateDoc(doc(crmDb, "proposals", proposalId), { assignee });
  },
  assignProposalToSelf: async (proposalId) => {
    await get().assignProposal(proposalId, get().currentUser().name);
  },
  deleteProposal: async (proposalId) => {
    await deleteDoc(doc(crmDb, "proposals", proposalId));
  },
  proposalsForCandidate: (candidateId) =>
    get().proposals.filter((p) => p.maleId === candidateId || p.femaleId === candidateId),

  // --- מועמדים (Firestore, כולל תעודת זהות ורשימת חסימת נציגות) ---
  // סטטוס פניות נשמר באוסף נפרד וציבורי (candidateStatus) כדי שקישור העדכון האישי של המועמד/ת
  // (ללא התחברות) לא ייתן גישה לשאר פרטי הכרטיס החסויים - ראו כללי האבטחה ב-Firestore.
  candidates: [],
  candidatesLoaded: false,
  candidateStatus: {},
  setCandidateAvailability: async (id, status) => {
    await setDoc(doc(crmDb, "candidateStatus", id), { availabilityStatus: status }, { merge: true });
  },
  addCandidate: async (candidate) => {
    const data = {
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
      photoUrl: null,
      photoUrls: [],
      tag: null,
      city: "",
      referenceContacts: "",
      confidential: false,
      blockedStaffEmails: [],
      createdAt: new Date().toISOString(),
      ...candidate,
    };
    const ref = await addDoc(collection(crmDb, "candidates"), data);
    await setDoc(doc(crmDb, "candidateStatus", ref.id), {
      name: data.name,
      availabilityStatus: data.availabilityStatus,
    });
    return { id: ref.id, ...data };
  },
  updateCandidate: async (id, partial) => {
    await updateDoc(doc(crmDb, "candidates", id), partial);
  },
  // מאזין ציבורי חד-פעמי לכרטיס סטטוס יחיד - לשימוש בעמוד הקישור האישי (ללא התחברות),
  // ולכן לא נוגע כלל באוסף candidates החסוי אלא רק בשם ובסטטוס הפניות שנשמרים בנפרד.
  subscribeCandidateStatus: (id, callback) =>
    onSnapshot(doc(crmDb, "candidateStatus", id), (d) => {
      callback(d.exists() ? { id, ...d.data() } : null);
    }),
  allCandidates: (board) => {
    const { candidates, role, currentStaffEmail, candidateStatus } = get();
    return candidates
      .filter((c) => c.gender === board)
      .filter((c) => role !== "staff" || !(c.blockedStaffEmails || []).includes(currentStaffEmail))
      .filter((c) => role !== "staff" || !c.confidential)
      .map((c) => ({ ...c, availabilityStatus: candidateStatus[c.id] || c.availabilityStatus }));
  },
  findCandidateById: (id) => {
    const { candidates, role, currentStaffEmail, candidateStatus } = get();
    const c = candidates.find((c) => c.id === id);
    if (!c) return undefined;
    if (role === "staff" && (c.blockedStaffEmails || []).includes(currentStaffEmail)) return undefined;
    if (role === "staff" && c.confidential) return undefined;
    return { ...c, availabilityStatus: candidateStatus[c.id] || c.availabilityStatus };
  },

  // --- משימות ---
  tasks: [],
  toggleTaskDone: async (id) => {
    const t = get().tasks.find((t) => t.id === id);
    if (!t) return;
    await updateDoc(doc(crmDb, "tasks", id), { done: !t.done });
  },
  addTask: async (task) => {
    await addDoc(collection(crmDb, "tasks"), { done: false, createdAt: new Date().toISOString(), ...task });
  },
  pushTaskToStaff: async (title, dueDate, assigneeEmail, candidateId = null) => {
    const assignee = get().authAllowlist.find((e) => e.email === assigneeEmail);
    const candidate = candidateId ? get().findCandidateById(candidateId) : null;
    await addDoc(collection(crmDb, "tasks"), {
      title,
      dueDate: dueDate || null,
      done: false,
      owner: assignee?.name || "לא משויך",
      assigneeId: assigneeEmail,
      candidateId,
      candidateName: candidate?.name || null,
      pushedByAdmin: true,
      seenByAssignee: false,
      createdAt: new Date().toISOString(),
    });
  },
  markTasksSeenByStaff: async (staffEmail) => {
    const unseen = get().tasks.filter((t) => t.assigneeId === staffEmail && !t.seenByAssignee);
    await Promise.all(unseen.map((t) => updateDoc(doc(crmDb, "tasks", t.id), { seenByAssignee: true })));
  },
  pendingPushedTasksCount: (staffEmail) =>
    get().tasks.filter((t) => t.assigneeId === staffEmail && t.pushedByAdmin && !t.seenByAssignee && !t.done).length,

  // --- מעקב שקט (טלמטריה) - רק כשמחוברים כ-staff ---
  telemetry: {},
  weeklyGoals: { profileViews: 20, audioPlays: 10 },
  setWeeklyGoals: async (goals) => {
    await setDoc(doc(crmDb, "settings", "app"), { weeklyGoals: { ...get().weeklyGoals, ...goals } }, { merge: true });
  },
  trackProfileView: async () => {
    const { role, currentStaffEmail } = get();
    if (role !== "staff" || !currentStaffEmail) return;
    const current = get().telemetry[currentStaffEmail]?.profileViews || 0;
    await setDoc(doc(crmDb, "telemetry", currentStaffEmail), { profileViews: current + 1 }, { merge: true });
  },
  trackAudioPlay: async () => {
    const { role, currentStaffEmail } = get();
    if (role !== "staff" || !currentStaffEmail) return;
    const current = get().telemetry[currentStaffEmail]?.audioPlays || 0;
    await setDoc(doc(crmDb, "telemetry", currentStaffEmail), { audioPlays: current + 1 }, { merge: true });
  },

  // --- שער תקנון סודיות ---
  termsText: DEFAULT_TERMS_TEXT,
  setTermsText: async (text) => {
    await setDoc(doc(crmDb, "settings", "app"), { termsText: text }, { merge: true });
  },
  termsAccepted: {},
  acceptTerms: async (staffEmail) => {
    await setDoc(doc(crmDb, "termsAcceptances", staffEmail), { acceptedAt: new Date().toISOString() });
    const staff = get().authAllowlist.find((e) => e.email === staffEmail);
    get().sendMockEmailToAdmin("אישור תקנון סודיות", `${staff?.name || staffEmail} אישר/ה את תקנון הסודיות.`);
  },

  // --- טיפים לצוות (אפשר כמה, גלילה בין הכרטיסים) ---
  tips: [DEFAULT_DAILY_TIP],
  addTip: async (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    await setDoc(doc(crmDb, "settings", "app"), { tips: [...get().tips, trimmed] }, { merge: true });
  },
  removeTip: async (index) => {
    const next = get().tips.filter((_, i) => i !== index);
    await setDoc(doc(crmDb, "settings", "app"), { tips: next }, { merge: true });
  },

  // --- יומן מיילים (הדגמה - עדיין לא חיבור אמיתי לשליחת מייל) ---
  emailLog: [],
  sendMockEmailToAdmin: async (subject, body) => {
    const adminEntry = get().authAllowlist.find((e) => e.role === "admin");
    await addDoc(collection(crmDb, "emailLog"), {
      to: adminEntry?.email || "",
      subject,
      body,
      date: new Date().toISOString(),
    });
  },

  // --- ניהול כספים ותשלומים - admin בלבד ---
  serviceTypes: [],
  addServiceType: async (service) => {
    await addDoc(collection(crmDb, "serviceTypes"), service);
  },
  removeServiceType: async (id) => {
    await deleteDoc(doc(crmDb, "serviceTypes", id));
  },
  charges: [],
  createCharge: async (candidateId, serviceTypeId, staffEmail) => {
    const service = get().serviceTypes.find((s) => s.id === serviceTypeId);
    if (!service) return null;
    const charge = {
      candidateId,
      serviceTypeId,
      serviceName: service.name,
      staffId: staffEmail,
      price: service.price,
      commission: service.commission,
      candidatePaymentStatus: "ממתין לתשלום",
      candidatePaymentProofUrl: null,
      staffPayoutStatus: "ממתין לתשלום",
      staffPayoutProofUrl: null,
      createdAt: new Date().toISOString(),
      candidatePaidAt: null,
      staffPaidAt: null,
    };
    const ref = await addDoc(collection(crmDb, "charges"), charge);
    return { id: ref.id, ...charge };
  },
  updateChargeCandidatePayment: async (chargeId, status, proofUrl) => {
    const patch = { candidatePaymentStatus: status };
    if (status === "שולם") patch.candidatePaidAt = new Date().toISOString();
    if (proofUrl !== undefined) patch.candidatePaymentProofUrl = proofUrl;
    await updateDoc(doc(crmDb, "charges", chargeId), patch);
  },
  updateChargeStaffPayout: async (chargeId, status, proofUrl) => {
    const patch = { staffPayoutStatus: status };
    if (status === "שולם") patch.staffPaidAt = new Date().toISOString();
    if (proofUrl !== undefined) patch.staffPayoutProofUrl = proofUrl;
    await updateDoc(doc(crmDb, "charges", chargeId), patch);
  },
  openCandidateDebt: () =>
    get()
      .charges.filter((c) => c.candidatePaymentStatus !== "שולם")
      .reduce((sum, c) => sum + c.price, 0),
  pendingStaffCommission: () =>
    get()
      .charges.filter((c) => c.staffPayoutStatus !== "שולם")
      .reduce((sum, c) => sum + c.commission, 0),
}));
