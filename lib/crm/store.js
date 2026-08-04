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
  query,
  where,
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

// מספר ההצעות המקסימלי שמוצג בו-זמנית תחת הלשונית "הצעות חדשות" (לכל מאגר בנפרד)
export const NEW_TAB_LIMIT = 10;

const DEFAULT_QUIZ_ANSWERS = {
  ageRange: [24, 32],
  heightRange: [160, 180],
  religiousLevel: "הכל",
  regions: [],
  education: "לא משנה",
  smoking: "לא משנה",
  traits: [],
  lifestyle: [],
};

const withId = (d) => ({ id: d.id, ...d.data() });

// השוואת כתובות מייל תמיד באותה צורה: בלי רווחים נסתרים, בלי תווי כיווניות (RTL/LTR)
// שנדבקים לפעמים בהעתקה מווטסאפ, ובאותיות קטנות.
const normalizeEmail = (value) =>
  String(value || "")
    .replace(/[‎‏‪-‮⁦-⁩]/g, "")
    .trim()
    .toLowerCase();

// מזהה הרשומה ברשימת ההרשאות הוא כתובת המייל עצמה, ולכן הוא משמש גיבוי
// אם שדה המייל בתוך הרשומה חסר (למשל רשומה שנוספה ידנית דרך הקונסולה של Firebase).
export const allowlistEmail = (entry) => normalizeEmail(entry?.email || entry?.id);

// רשומה "פגומה" - המזהה שלה אינו זהה לכתובת נקייה, ולכן השרת לא יזהה את הכניסה
export const isBrokenAllowlistEntry = (entry) => !!entry?.id && allowlistEmail(entry) !== entry.id;

export const useCrmStore = create((set, get) => ({
  // --- מאגר פעיל: בנים / בנות ---
  board: "female",
  // מעבר מאגר מאפס את סינון רמת התורניות, כי הערכים שונים בין הרשימה הגברית לנשית (למשל "תורני" מול "תורנית")
  setBoard: (board) => set((state) => ({ board, filters: { ...state.filters, religiousLevel: "הכל" } })),

  // לשונית "הצעות חדשות" מול "הצעות קודמות" במסך המאגר - נשמרת גלובלית כדי שלא תתאפס
  // כשעוזבים את המסך (למשל לכרטיס מועמד/ת) וחוזרים אליו עם כפתור "חזור"
  feedTab: "new",
  setFeedTab: (feedTab) => set({ feedTab }),

  // --- אתחול חיבור Firebase + כל המאזינים בזמן אמת (נקרא פעם אחת מ-AppShell) ---
  _initialized: false,
  authLoading: true,
  initCrmFirebase: () => {
    if (get()._initialized) return;
    set({ _initialized: true });

    // עוד לא הוגדר מסד נתונים למערכת: מציגים את מסך הכניסה במקום להמתין
    // לנצח לתשובה משרת שאינו קיים.
    if (!isFirebaseConfigured) {
      set({ authLoading: false, allowlistLoaded: true });
      return;
    }

    onSnapshot(
      collection(crmDb, "staffAllowlist"),
      (snap) => {
        set({ authAllowlist: snap.docs.map(withId), allowlistLoaded: true });
        get().recomputeRole();
      },
      // כשלון קריאה כאן משמעו שהמשתמש/ת אינו/ה ברשימת ההרשאות כלל (כללי האבטחה חוסמים).
      // חשוב לסמן שהתשובה הגיעה, כדי שנציג מסך "אין הרשאה" ברור במקום מאגר ריק ומבלבל.
      () => {
        set({ allowlistLoaded: true });
        get().recomputeRole();
      }
    );

    onSnapshot(
      collection(crmDb, "candidates"),
      (snap) => {
        set({ candidates: snap.docs.map(withId), candidatesLoaded: true, candidatesError: false });
      },
      () => {
        set({ candidatesLoaded: true, candidatesError: true });
      }
    );

    onSnapshot(collection(crmDb, "candidateStatus"), (snap) => {
      const map = {};
      snap.docs.forEach((d) => (map[d.id] = d.data().availabilityStatus));
      set({ candidateStatus: map });
    });

    onSnapshot(collection(crmDb, "proposals"), (snap) => {
      set({ proposals: snap.docs.map(withId) });
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
        professionals: Array.isArray(data.professionals) ? data.professionals : [],
        sheetImport: data.sheetImport ?? { csvUrl: "", mapping: {} },
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

  // --- משימות: נטענות בשאילתה שתלויה בהרשאה ---
  // מנהלת רואה את כל המשימות. אשת צוות מקבלת מהשרת אך ורק את המשימות
  // המשויכות אליה, כך שההגבלה אינה תלויה בסינון בצד הדפדפן.
  _tasksUnsub: null,
  _tasksKey: null,
  subscribeTasks: () => {
    const { role, currentStaffEmail, _tasksKey, _tasksUnsub } = get();
    if (role !== "admin" && role !== "staff") {
      if (_tasksUnsub) _tasksUnsub();
      set({ _tasksUnsub: null, _tasksKey: null, tasks: [] });
      return;
    }
    const key = role === "admin" ? "admin" : `staff:${currentStaffEmail || ""}`;
    if (key === _tasksKey) return;
    if (_tasksUnsub) _tasksUnsub();

    const ref =
      role === "admin"
        ? collection(crmDb, "tasks")
        : query(collection(crmDb, "tasks"), where("assigneeId", "==", normalizeEmail(currentStaffEmail) || "__none__"));

    const unsub = onSnapshot(
      ref,
      (snap) => set({ tasks: snap.docs.map(withId) }),
      () => set({ tasks: [] })
    );
    set({ _tasksUnsub: unsub, _tasksKey: key });
  },

  // --- הרשאה: נקבעת אך ורק לפי כניסה עם גוגל + רשימת ההרשאות ב-Firestore ---
  googleUser: null,
  role: "viewer", // viewer (לא מחוברת) | unauthorized (מחוברת, לא ברשימה) | staff | admin
  currentStaffEmail: null,
  authAllowlist: [],
  allowlistLoaded: false,
  recomputeRole: () => {
    const { googleUser, authAllowlist } = get();
    if (!googleUser) {
      set({ role: "viewer", currentStaffEmail: null });
      return;
    }
    const myEmail = normalizeEmail(googleUser.email);
    const match = authAllowlist.find((e) => allowlistEmail(e) === myEmail);
    if (!match) {
      // המנהלת הראשונה מזוהה גם כשרשימת הצוות ריקה לגמרי, כדי שתמיד אפשר יהיה
      // להיכנס למערכת חדשה ולהוסיף ממנה את שאר אנשי הצוות.
      if (isBootstrapAdmin(googleUser.email)) {
        set({ role: "admin", currentStaffEmail: null });
        get().subscribeTasks();
        return;
      }
      set({ role: "unauthorized", currentStaffEmail: null });
      return;
    }
    // ברירת מחדל "צוות" אם שדה ההרשאה חסר ברשומה (למשל רשומה שנוספה ידנית) -
    // כדי שאיש/אשת צוות לא ייתקע/תיתקע בחוץ, ובלי להעניק בטעות הרשאות מנהלת.
    const entryRole = match.role === "admin" ? "admin" : "staff";
    set({ role: entryRole, currentStaffEmail: entryRole === "staff" ? allowlistEmail(match) : null });
    get().subscribeTasks();
    get().subscribeRequests();
  },
  currentUser: () => {
    const { googleUser, role, authAllowlist } = get();
    if (!googleUser) return { name: "אורחת", email: "", picture: null, role: "viewer" };
    const myEmail = normalizeEmail(googleUser.email);
    const match = authAllowlist.find((e) => allowlistEmail(e) === myEmail);
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
    // מזהה הרשומה חייב להיות זהה בדיוק לכתובת שאיתה נכנסים לגוגל - אחרת כללי האבטחה
    // בשרת לא יזהו את המשתמש/ת. לכן מנקים כאן רווחים ותווי כיווניות לפני השמירה.
    const email = normalizeEmail(entry.email);
    if (!email) return;
    await setDoc(doc(crmDb, "staffAllowlist", email), {
      name: entry.name.trim(),
      role: entry.role,
      email,
      phone: entry.phone || null,
    });
  },
  removeAllowlistEntry: async (email) => {
    await deleteDoc(doc(crmDb, "staffAllowlist", normalizeEmail(email)));
  },

  // --- נציג מלווה: איש הקשר בצוות לבירורים על מועמד/ת ---
  // כל הצוות רואה את כל המועמדים. הנציג המלווה הוא מי שמכיר את המועמד/ת אישית,
  // ואליו פונים שאר השדכניות כשהן שוקלות הצעה.
  contactStaffFor: (candidate) => {
    const email = normalizeEmail(candidate?.contactStaffEmail);
    if (!email) return null;
    return get().authAllowlist.find((e) => allowlistEmail(e) === email) || { email, name: email };
  },
  setContactStaff: async (candidateId, staffEmail) => {
    await updateDoc(doc(crmDb, "candidates", candidateId), {
      contactStaffEmail: staffEmail ? normalizeEmail(staffEmail) : null,
    });
  },
  // עריכת כרטיס והוספת הערות רגישות: מנהלת, או הנציג המלווה של אותו/ה מועמד/ת
  canEditCandidate: (candidate) => {
    const { role, currentStaffEmail } = get();
    if (role === "admin") return true;
    if (role !== "staff" || !candidate) return false;
    const assigned = normalizeEmail(candidate.contactStaffEmail);
    return !!assigned && assigned === normalizeEmail(currentStaffEmail);
  },
  // תיקון רשומה שנשמרה בעבר עם רווח/תו נסתר בכתובת: יוצר רשומה נקייה ומוחק את הפגומה.
  repairAllowlistEntry: async (entry) => {
    const clean = allowlistEmail(entry);
    if (!clean || clean === entry.id) return;
    await setDoc(doc(crmDb, "staffAllowlist", clean), {
      name: entry.name || clean,
      role: entry.role === "admin" ? "admin" : "staff",
      email: clean,
    });
    await deleteDoc(doc(crmDb, "staffAllowlist", entry.id));
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

  // --- סיור ההדרכה: כפתור העזרה יושב בסרגל הכפתורים הצפים ומופיע בכל המסכים,
  // ואילו הסיור עצמו רץ ממקום אחד. המונה מסמן לסיור שהתבקשה הפעלה מחדש.
  tourTick: 0,
  requestTour: () => set((state) => ({ tourTick: state.tourTick + 1 })),

  // --- שאלון התאמות (מקומי, פר-מכשיר) ---
  quizAnswers: DEFAULT_QUIZ_ANSWERS,
  quizCompleted: false,
  setQuizAnswers: (partial) => set((state) => ({ quizAnswers: { ...state.quizAnswers, ...partial } })),
  completeQuiz: () => set({ quizCompleted: true }),
  resetQuiz: () => set({ quizCompleted: false }),

  // --- סינון בפיד ---
  filters: { ageRange: [20, 40], heightRange: [150, 195], religiousLevel: "הכל", region: "הכל", search: "" },
  setFilters: (partial) => set((state) => ({ filters: { ...state.filters, ...partial } })),
  resetFilters: () =>
    set((state) => ({
      filters: { ageRange: [20, 40], heightRange: [150, 195], religiousLevel: "הכל", region: "הכל", search: "" },
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
  // externals: { male, female } - מועמד/ת שאינו/ה במאגר ("מישהו מהמעגל שלי").
  // הפרטים נשמרים בתוך מסמך ההצעה בלבד, ובשום שלב לא נוצר מהם כרטיס במאגר.
  createProposal: async (maleId, femaleId, rationale = "", externals = {}) => {
    const author = get().currentUser().name;
    const now = new Date().toISOString();
    const clean = (e) =>
      e && e.name?.trim()
        ? { name: e.name.trim(), notes: (e.notes || "").trim(), audioUrl: e.audioUrl || null }
        : null;
    const externalMale = clean(externals.male);
    const externalFemale = clean(externals.female);
    const proposal = {
      maleId: externalMale ? null : maleId,
      femaleId: externalFemale ? null : femaleId,
      externalMale,
      externalFemale,
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

    // מכסת "הצעות חדשות": עד 10 בו-זמנית לכל מאגר (בנים/בנות בנפרד). כל מי שמעבר
    // ל-10 העדכניים נדחף אוטומטית ל"הצעות קודמות" - כך גם כרטיסים ותיקים שנוצרו
    // לפני שהמכסה הונהגה מתיישרים לבד עם ההוספה הבאה.
    const newest = get()
      .candidates.filter((c) => c.gender === data.gender && c.isNew && c.id !== ref.id)
      .concat([{ id: ref.id, ...data }])
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    await Promise.all(
      newest
        .slice(NEW_TAB_LIMIT)
        .map((c) => updateDoc(doc(crmDb, "candidates", c.id), { isNew: false, isPrevious: true }))
    );

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
  // --- תיבת בקשות חסויה ---
  // אשת צוות יכולה להגיש בקשה עבור מועמד/ת, אך אינה רואה את הלוח הכללי.
  // רק המנהלת רואה את כל הבקשות במרוכז ומחליטה למי לשייך כל אחת.
  requests: [],
  _requestsUnsub: null,
  _requestsKey: null,
  subscribeRequests: () => {
    const { role, _requestsKey, _requestsUnsub } = get();
    // לצוות אין כלל מנוי - הן אינן רואות את הלוח, רק מגישות אליו
    if (role !== "admin") {
      if (_requestsUnsub) _requestsUnsub();
      set({ _requestsUnsub: null, _requestsKey: null, requests: [] });
      return;
    }
    if (_requestsKey === "admin") return;
    if (_requestsUnsub) _requestsUnsub();
    const unsub = onSnapshot(
      collection(crmDb, "staffRequests"),
      (snap) => {
        const list = snap.docs.map(withId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        set({ requests: list });
      },
      () => set({ requests: [] })
    );
    set({ _requestsUnsub: unsub, _requestsKey: "admin" });
  },
  addRequest: async ({ candidateId, kind, note }) => {
    const user = get().currentUser();
    const candidate = candidateId ? get().findCandidateById(candidateId) : null;
    await addDoc(collection(crmDb, "staffRequests"), {
      candidateId: candidateId || null,
      candidateName: candidate?.name || null,
      kind: kind || "",
      note: (note || "").trim(),
      status: "חדש",
      createdBy: normalizeEmail(user.email),
      createdByName: user.name,
      createdAt: new Date().toISOString(),
    });
  },
  updateRequest: async (id, patch) => {
    await updateDoc(doc(crmDb, "staffRequests", id), patch);
  },
  deleteRequest: async (id) => {
    await deleteDoc(doc(crmDb, "staffRequests", id));
  },

  // --- מבחן ההתאמות: דירוג מועמדים לפי התשובות בשאלון ---
  // הציון הוא אחוז הקריטריונים שנענו, מתוך אלה שהוגדרו בפועל בשאלון.
  // קריטריון שנבחר בו "הכל" או "לא משנה" אינו נספר כלל.
  quizMatches: (board) => {
    const a = get().quizAnswers;
    const list = get().allCandidates(board);

    return list
      .map((c) => {
        const checks = [];

        if (a.ageRange) checks.push(c.age >= a.ageRange[0] && c.age <= a.ageRange[1]);
        if (a.heightRange) checks.push(c.height >= a.heightRange[0] && c.height <= a.heightRange[1]);
        if (a.religiousLevel && a.religiousLevel !== "הכל") checks.push(c.religiousLevel === a.religiousLevel);

        const regions = (a.regions || []).filter((r) => r !== "לא משנה");
        if (regions.length) checks.push(regions.includes(c.region));

        if (a.education && a.education !== "לא משנה") {
          checks.push((board === "male" ? c.yeshivaLevel : c.education) === a.education);
        }
        if (a.smoking && a.smoking !== "לא משנה") checks.push(c.smoking === a.smoking);

        // סגנון חיים והשקפה: כל תגית שנבחרה נספרת בנפרד, כך שהתאמה חלקית
        // עדיין מקדמת את המועמד/ת ברשימה במקום לפסול אותו/ה לגמרי.
        const wantedTags = a.lifestyle || [];
        const candidateTags = c.lifestyle || [];
        wantedTags.forEach((t) => checks.push(candidateTags.includes(t)));

        (a.traits || []).forEach((t) => checks.push((c.traits || []).includes(t)));

        const score = checks.length
          ? Math.round((checks.filter(Boolean).length / checks.length) * 100)
          : 100;
        return { ...c, matchScore: score };
      })
      .sort((x, y) => y.matchScore - x.matchScore);
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
    // משימה שאשת צוות פותחת לעצמה משויכת אליה, אחרת היא לא תופיע אצלה כלל
    // (השרת מחזיר לצוות רק משימות שמשויכות אליהן).
    const { role, currentStaffEmail } = get();
    const assigneeId = normalizeEmail(task.assigneeId ?? (role === "staff" ? currentStaffEmail : null)) || null;
    await addDoc(collection(crmDb, "tasks"), {
      done: false,
      createdAt: new Date().toISOString(),
      assigneeId,
      ...task,
    });
  },
  pushTaskToStaff: async (title, dueDate, assigneeEmail, candidateId = null, details = null) => {
    // כתובת השיוך נשמרת תמיד בצורה מנוקה, כי כללי האבטחה משווים אותה מול
    // כתובת הכניסה לגוגל. רווח נסתר או תו כיווניות היה גורם לאשת הצוות
    // לא לראות את המשימה כלל, בלי שום הודעת שגיאה.
    const assigneeId = normalizeEmail(assigneeEmail);
    const assignee = get().authAllowlist.find((e) => allowlistEmail(e) === assigneeId);
    const candidate = candidateId ? get().findCandidateById(candidateId) : null;
    await addDoc(collection(crmDb, "tasks"), {
      title,
      details: details || null,
      dueDate: dueDate || null,
      done: false,
      owner: assignee?.name || "לא משויך",
      assigneeId,
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

  // --- סנכרון מגיליון Google Sheets ---
  // הכתובת והמיפוי נשמרים במסמך ההגדרות הקיים, ולכן אין צורך בכלל אבטחה חדש.
  sheetImport: { csvUrl: "", mapping: {} },
  setSheetImportConfig: async (config) => {
    await setDoc(
      doc(crmDb, "settings", "app"),
      { sheetImport: { ...get().sheetImport, ...config } },
      { merge: true }
    );
  },
  // --- מאגר אנשי מקצוע חיצוניים (מאמנים ומלווים) ---
  // נשמר כרשימה בתוך מסמך ההגדרות הקיים, ולכן אינו דורש כלל אבטחה חדש:
  // המנהלת כותבת, והצוות יכול לקרוא.
  professionals: [],
  addProfessional: async (entry) => {
    const clean = {
      id: `pro-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: String(entry.name || "").trim(),
      role: String(entry.role || "").trim(),
      location: String(entry.location || "").trim(),
      phone: String(entry.phone || "").trim(),
    };
    if (!clean.name) return;
    await setDoc(doc(crmDb, "settings", "app"), { professionals: [...get().professionals, clean] }, { merge: true });
  },
  updateProfessional: async (id, patch) => {
    const next = get().professionals.map((p) =>
      p.id === id
        ? {
            ...p,
            ...Object.fromEntries(Object.entries(patch).map(([k, v]) => [k, String(v || "").trim()])),
            id: p.id,
          }
        : p
    );
    await setDoc(doc(crmDb, "settings", "app"), { professionals: next }, { merge: true });
  },
  removeProfessional: async (id) => {
    const next = get().professionals.filter((p) => p.id !== id);
    await setDoc(doc(crmDb, "settings", "app"), { professionals: next }, { merge: true });
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
