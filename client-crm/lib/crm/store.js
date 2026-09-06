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
import { ROUND_MS, unseenMentions } from "./brainstorm";
import { BOOTSTRAP_ADMIN_EMAIL, isFirebaseConfigured } from "../appConfig";

export const PROPOSAL_STAGES = ["הוצע", "בבדיקה", "הוחלפו פרטים", "נפגשו", "בהמשך / מתקדמים", "אירוסין"];
export const PROPOSAL_DROPPED = "ירד מהפרק";

export const AVAILABILITY_STATUSES = ["פנוי", "לא פנוי", "בהפסקה"];

// מספר ההצעות המקסימלי שמוצג בו-זמנית תחת הלשונית "הצעות חדשות" (לכל מאגר בנפרד)
export const NEW_TAB_LIMIT = 10;

// בעלת המערכת. מזוהה כמנהלת תמיד, כדי שלא תוכל להינעל מחוץ למערכת שלה
// גם אם רשימת ההרשאות אינה נטענת (תקלת רשת, כתובת אתר חדשה וכדומה).
// בעלת המערכת. מוגדרת במקום אחד יחיד – lib/appConfig.js.
export const OWNER_EMAIL = String(BOOTSTRAP_ADMIN_EMAIL || "").trim().toLowerCase();

const withId = (d) => ({ id: d.id, ...d.data() });

// גבולות מחווני הסינון. ברירת המחדל של הסינון היא תמיד הטווח המלא שלהם.
export const AGE_LIMITS = [18, 70];
export const HEIGHT_LIMITS = [140, 210];

// מחוון שנשאר על הטווח המלא נחשב "לא הוגדרה דרישה" ואינו נספר במבחן ההתאמות
const DEFAULT_QUIZ_ANSWERS = {
  ageRange: [...AGE_LIMITS],
  heightRange: [...HEIGHT_LIMITS],
  religiousLevel: "הכל",
  regions: [],
  occupations: [],
  tags: [],
  smoking: "לא משנה",
  traits: [],
};

// גובה שהוקלד במטרים (1.75) מומר לסנטימטרים, אחרת הוא נופל מחוץ לכל טווח סינון
// והכרטיס נעלם מהמסך בלי שום הסבר.
export const normalizeHeight = (value) => {
  const n = Number(value);
  if (!n || Number.isNaN(n)) return value;
  return n > 0 && n < 3 ? Math.round(n * 100) : n;
};

const EMPTY_FILTERS = {
  ageRange: [...AGE_LIMITS],
  heightRange: [...HEIGHT_LIMITS],
  religiousLevel: "הכל",
  region: "הכל",
  search: "",
  tag: null,
};

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

    // עוד לא הוגדר מסד נתונים למערכת: מציגים את מסך הכניסה עם הסבר,
    // במקום להיתקע על מסך טעינה בהמתנה לשרת שאינו קיים.
    if (!isFirebaseConfigured) {
      set({ authLoading: false, allowlistLoaded: true, myEntryStatus: "missing" });
      return;
    }

    onSnapshot(
      collection(crmDb, "staffAllowlist"),
      (snap) => {
        set({ authAllowlist: snap.docs.map(withId), allowlistLoaded: true });
        get().recomputeRole();
      },
      // כשלון קריאה אינו אומר "אין הרשאה" - הוא יכול לנבוע גם מרשת, מכתובת אתר שאינה
      // מאושרת או מתקלה זמנית. לכן מסמנים אותו בנפרד ולא נועלים את המשתמש/ת בחוץ.
      (err) => {
        set({ allowlistLoaded: true, allowlistError: true, allowlistErrorCode: err?.code || "unknown" });
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

    // זירת סיעור המוחות. כשל קריאה כאן לא נוגע בשום דבר אחר במערכת -
    // הזירה תציג הסבר, וכל שאר המסכים ימשיכו לעבוד כרגיל.
    onSnapshot(
      collection(crmDb, "brainstormRounds"),
      (snap) => set({ brainstormRounds: snap.docs.map(withId), brainstormLoaded: true, brainstormError: false }),
      () => set({ brainstormLoaded: true, brainstormError: true })
    );

    onSnapshot(
      collection(crmDb, "brainstormNotes"),
      (snap) => set({ brainstormNotes: snap.docs.map(withId) }),
      () => set({ brainstormNotes: [] })
    );

    // המשימות נטענות בנפרד (subscribeTasks), אחרי שידוע מי מחובר/ת:
    // מנהלת מקבלת את כל המשימות, ואשת צוות רק את אלה שמשויכות אליה.

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
        sheetImport: data.sheetImport ?? { csvUrl: "", mapping: {} },
      });
    });

    onAuthStateChanged(crmAuth, (user) => {
      if (user) {
        set({ googleUser: { email: user.email, name: user.displayName, picture: user.photoURL, uid: user.uid } });
        onSnapshot(doc(crmDb, "userPrefs", user.email.toLowerCase()), (d) => {
          if (d.exists())
            set({
              favorites: d.data().favorites || {},
              personalNotes: d.data().personalNotes || {},
              brainstormSeenAt: d.data().brainstormSeenAt || null,
            });
        });
      } else {
        set({ googleUser: null, favorites: {}, personalNotes: {}, brainstormSeenAt: null });
      }
      // ההרשאה נקבעת לפי הרשומה האישית, ולא לפי היכולת לקרוא את הרשימה כולה
      get().subscribeMyAllowlistEntry(user?.email || null);
      get().recomputeRole();
      set({ authLoading: false });
    });
  },

  // --- הרשאה: נקבעת אך ורק לפי כניסה עם גוגל + רשימת ההרשאות ב-Firestore ---
  googleUser: null,
  role: "viewer", // viewer (לא מחוברת) | unauthorized (מחוברת, לא ברשימה) | unverified (לא ידוע) | staff | admin
  currentStaffEmail: null,
  authAllowlist: [],
  allowlistLoaded: false,
  allowlistError: false,
  allowlistErrorCode: null,

  // --- בדיקת ההרשאה האישית ---
  // עד היום ההרשאה נקבעה לפי היכולת לקרוא את *כל* רשימת ההרשאות. זו הייתה בדיקה
  // שברירית: די בכך שקריאת הרשימה נכשלת (רשת סלולרית איטית, חסימת ערוץ תקשורת)
  // כדי שאיש/אשת צוות מאושר/ת ייתקע/תיתקע בחוץ. כאן קוראים רק את הרשומה האישית -
  // בקשה קטנה, מהירה ועמידה הרבה יותר - והיא מה שקובע.
  myEntry: null,
  // loading = עדיין בודקים | found = יש רשומה | denied/missing = ודאי שאין הרשאה | error = תקלת תקשורת
  myEntryStatus: "loading",
  _myEntryUnsub: null,
  _myEntryEmail: null,
  subscribeMyAllowlistEntry: (email) => {
    const myEmail = normalizeEmail(email);
    if (myEmail === get()._myEntryEmail) return;
    const prev = get()._myEntryUnsub;
    if (prev) prev();

    if (!myEmail) {
      set({ _myEntryUnsub: null, _myEntryEmail: null, myEntry: null, myEntryStatus: "loading" });
      return;
    }

    set({ _myEntryEmail: myEmail, myEntry: null, myEntryStatus: "loading" });

    const unsub = onSnapshot(
      doc(crmDb, "staffAllowlist", myEmail),
      (d) => {
        if (d.exists()) set({ myEntry: { id: d.id, ...d.data() }, myEntryStatus: "found" });
        else set({ myEntry: null, myEntryStatus: "missing" });
        get().recomputeRole();
      },
      (err) => {
        // "אין הרשאה" מהשרת על הרשומה האישית הוא תשובה ודאית: הכתובת אינה ברשימה.
        // כל שגיאה אחרת היא תקלת תקשורת, ואז לא נועלים אף אחד בחוץ.
        set({ myEntryStatus: err?.code === "permission-denied" ? "denied" : "error", allowlistErrorCode: err?.code || "unknown" });
        get().recomputeRole();
      }
    );
    set({ _myEntryUnsub: unsub });

    // רשת ביטחון: אם אחרי 15 שניות עדיין אין תשובה מהשרת, מציגים מסך הסבר
    // עם כפתור ניסיון נוסף במקום להשאיר את המשתמש/ת מול מסך ריק לנצח.
    setTimeout(() => {
      if (get()._myEntryEmail === myEmail && get().myEntryStatus === "loading") {
        set({ myEntryStatus: "error", allowlistErrorCode: "timeout" });
        get().recomputeRole();
      }
    }, 15000);
  },

  recomputeRole: () => {
    const { googleUser, authAllowlist, myEntry, myEntryStatus } = get();
    if (!googleUser) {
      set({ role: "viewer", currentStaffEmail: null });
      get().subscribeTasks();
      return;
    }
    const myEmail = normalizeEmail(googleUser.email);

    // בעלת המערכת מזוהה כמנהלת גם אם קריאת רשימת ההרשאות נכשלה מסיבה כלשהי.
    // זו רשת ביטחון: אסור שבעלת המערכת תינעל אי פעם מחוץ למערכת שלה.
    if (myEmail === OWNER_EMAIL) {
      set({ role: "admin", currentStaffEmail: null, allowlistLoaded: true });
      get().subscribeTasks();
      return;
    }

    // ברירת מחדל "צוות" אם שדה ההרשאה חסר ברשומה (למשל רשומה שנוספה ידנית) -
    // כדי שאיש/אשת צוות לא ייתקע/תיתקע בחוץ, ובלי להעניק בטעות הרשאות מנהלת.
    const applyEntry = (entry) => {
      const entryRole = entry.role === "admin" ? "admin" : "staff";
      set({
        role: entryRole,
        currentStaffEmail: entryRole === "staff" ? allowlistEmail(entry) : null,
        allowlistLoaded: true,
      });
      get().subscribeTasks();
    };

    // 1. הרשומה האישית - המקור הקובע
    if (myEntryStatus === "found" && myEntry) return applyEntry(myEntry);

    // 2. גיבוי: הכתובת נמצאה ברשימה המלאה (למשל כשהרשומה האישית עדיין בדרך)
    const match = authAllowlist.find((e) => allowlistEmail(e) === myEmail);
    if (match) return applyEntry(match);

    // 3. תשובה ודאית מהשרת שאין הרשאה
    if (myEntryStatus === "missing" || myEntryStatus === "denied") {
      set({ role: "unauthorized", currentStaffEmail: null, allowlistLoaded: true });
      get().subscribeTasks();
      return;
    }

    // 4. תקלת תקשורת - לא נועלים בחוץ, מציגים הסבר ואפשרות לנסות שוב
    if (myEntryStatus === "error") {
      set({ role: "unverified", currentStaffEmail: null, allowlistLoaded: true });
      get().subscribeTasks();
      return;
    }

    // 5. עדיין בודקים
    set({ role: "viewer", currentStaffEmail: null });
    get().subscribeTasks();
  },

  // --- מאזין המשימות: נבנה מחדש רק כשההרשאה או המשתמש/ת משתנים ---
  _tasksUnsub: null,
  _tasksKey: null,
  subscribeTasks: () => {
    const { role, currentStaffEmail, _tasksKey, _tasksUnsub } = get();
    const key = `${role}:${currentStaffEmail || ""}`;
    if (key === _tasksKey) return;
    if (_tasksUnsub) _tasksUnsub();
    set({ _tasksKey: key, _tasksUnsub: null });

    if (role !== "admin" && role !== "staff") {
      set({ tasks: [] });
      return;
    }
    // אשת צוות מושכת מהשרת אך ורק את המשימות שמשויכות אליה - לא רק הסתרה בתצוגה.
    const ref = collection(crmDb, "tasks");
    const q = role === "admin" ? ref : query(ref, where("assigneeId", "==", currentStaffEmail));
    const unsub = onSnapshot(
      q,
      (snap) => set({ tasks: snap.docs.map(withId) }),
      () => set({ tasks: [] })
    );
    set({ _tasksUnsub: unsub });
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
    // הטלפון נדרש כדי שאפשר יהיה לעדכן את הצוות בוואטסאפ על סבב סיעור מוחות חדש
    await setDoc(doc(crmDb, "staffAllowlist", email), {
      name: entry.name.trim(),
      role: entry.role,
      phone: String(entry.phone || "").trim(),
      email,
    });
  },
  // השלמת מספר טלפון לרשומה קיימת, בלי לגעת בשאר השדות שלה
  setAllowlistPhone: async (email, phone) => {
    const clean = normalizeEmail(email);
    if (!clean) return;
    await setDoc(doc(crmDb, "staffAllowlist", clean), { phone: String(phone || "").trim() }, { merge: true });
  },
  removeAllowlistEntry: async (email) => {
    await deleteDoc(doc(crmDb, "staffAllowlist", normalizeEmail(email)));
  },
  // תיקון רשומה שנשמרה בעבר עם רווח/תו נסתר בכתובת: יוצר רשומה נקייה ומוחק את הפגומה.
  repairAllowlistEntry: async (entry) => {
    const clean = allowlistEmail(entry);
    if (!clean || clean === entry.id) return;
    await setDoc(doc(crmDb, "staffAllowlist", clean), {
      name: entry.name || clean,
      role: entry.role === "admin" ? "admin" : "staff",
      phone: String(entry.phone || "").trim(),
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

  // --- הערה פנימית על מועמד/ת ---
  // נשמרת באותו מסמך פרטי של המשתמש/ת שבו נשמרים המועדפים, ולכן היא גלויה
  // אך ורק למי שכתב/ה אותה, ואינה דורשת כלל אבטחה חדש.
  personalNotes: {},
  personalNoteFor: (candidateId) => get().personalNotes[candidateId] || "",
  setPersonalNote: async (candidateId, text) => {
    const value = String(text || "").trim();
    const next = { ...get().personalNotes };
    if (value) next[candidateId] = value;
    else delete next[candidateId];
    set({ personalNotes: next });
    const user = get().currentUser();
    if (!user.email) return;
    await setDoc(
      doc(crmDb, "userPrefs", user.email.toLowerCase()),
      { personalNotes: next },
      { merge: true }
    ).catch(() => {});
  },

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
  // עיקרון: ברירת המחדל של כל סינון היא הטווח המלא של המחוון. סינון הוא פעולה
  // יזומה, לא מצב התחלתי - אחרת מועמדים נעלמים מבלי שאיש ביקש זאת.
  filters: { ...EMPTY_FILTERS },
  // סימון שהחיפוש מולא אוטומטית מקישור לכרטיס, ולא הוקלד ידנית
  searchAutoFilled: false,
  setFilters: (partial) => set((state) => ({ filters: { ...state.filters, ...partial } })),
  setAutoSearch: (name) => set({ filters: { ...get().filters, search: name }, searchAutoFilled: true }),
  clearAutoSearch: () =>
    set((state) => (state.searchAutoFilled ? { filters: { ...state.filters, search: "" }, searchAutoFilled: false } : {})),
  resetFilters: () =>
    set((state) => ({
      filters: { ...EMPTY_FILTERS, tag: state.filters.tag },
      searchAutoFilled: false,
    })),
  // ניקוי מלא, כולל תווית וחיפוש - הכפתור שמופיע בחיווי "כמה מוסתרים"
  clearAllFilters: () => set({ filters: { ...EMPTY_FILTERS }, searchAutoFilled: false }),

  // --- כרטיסיה פתוחה עם אזור פנימי ---
  expandedStaffAreaId: null,
  toggleStaffArea: (id) => set((state) => ({ expandedStaffAreaId: state.expandedStaffAreaId === id ? null : id })),

  // --- בחירת שני פרופילים להצעת התאמה ---
  proposalSelection: { male: null, female: null },
  clearProposalSelection: () => set({ proposalSelection: { male: null, female: null } }),
  setProposalSelection: (key, id) => set((state) => ({ proposalSelection: { ...state.proposalSelection, [key]: id || null } })),

  // --- הצעות שידוך ---
  proposals: [],
  // externals = { male: {name, notes, audioUrl} | null, female: ... }
  // מועמד/ת "חיצוני/ת" נשמר/ת אך ורק בתוך מסמך ההצעה הזה. לא נוצר עבורו/ה כרטיס
  // במאגר המועמדים, והוא/היא אינו/ה מופיע/ה בשום מסך אחר במערכת.
  createProposal: async (maleId, femaleId, rationale = "", externals = {}) => {
    const author = get().currentUser().name;
    const now = new Date().toISOString();
    // שומרים גם את השמות בתוך ההצעה עצמה, כדי שההצעה תישאר קריאה ומלאה
    // גם אם כרטיס המועמד/ת יימחק מהמאגר בעתיד.
    const proposal = {
      maleId: maleId || null,
      femaleId: femaleId || null,
      maleName: get().findCandidateById(maleId)?.name || externals.male?.name || null,
      femaleName: get().findCandidateById(femaleId)?.name || externals.female?.name || null,
      externalMale: externals.male || null,
      externalFemale: externals.female || null,
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
      const maleName = get().findCandidateById(proposal.maleId)?.name || proposal.externalMale?.name || "?";
      const femaleName = get().findCandidateById(proposal.femaleId)?.name || proposal.externalFemale?.name || "?";
      get().sendMockEmailToAdmin(
        "הצעת שידוך הגיעה לאירוסין! 🎉",
        `${author} עדכנ/ה שההצעה בין ${maleName} ל-${femaleName} הגיעה לשלב אירוסין.`
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
  // האם הכרטיס קיים בכלל במאגר (בלי סינון הרשאות) - משמש כדי להבחין בין
  // "אין הרשאה לראות" לבין "הכרטיס נמחק", שני מצבים שנראים זהים מבחוץ.
  candidateExistsInDb: (id) => !!id && get().candidates.some((c) => c.id === id),
  // הצעה קודמת לאותו זוג שירדה מהפרק - בין אם ירדה מהפרק בתוך המערכת ובין אם
  // הוזנה ידנית כהיסטוריה מלפני הקמת המערכת. משמש להתראת הכפילות לפני הקמת הצעה חוזרת.
  // שני הצדדים חייבים להיות כרטיסים מהמאגר: לאדם "מהמעגל האישי" אין מזהה, ובלי
  // הבדיקה הזו כל שתי הצעות חיצוניות היו נראות כאילו מדובר באותו זוג.
  droppedProposalFor: (maleId, femaleId) => {
    if (!maleId || !femaleId) return null;
    return (
      get().proposals.find((p) => p.maleId === maleId && p.femaleId === femaleId && p.status === PROPOSAL_DROPPED) || null
    );
  },
  // הלוח הפעיל. הצעה שירדה מהפרק נשמרת במסד במלואה אך יוצאת מהרשימה הפעילה,
  // כדי שהלוח יישאר נקי ויציג רק את מה שבאמת בטיפול.
  activeProposals: () => get().proposals.filter((p) => p.status !== PROPOSAL_DROPPED),
  // הארכיון: כל מה שירד מהפרק, כולל היסטוריה שהוזנה ידנית על ידי המנהלת.
  droppedProposals: () =>
    [...get().proposals.filter((p) => p.status === PROPOSAL_DROPPED)].sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    ),
  // היסטוריה מלפני הקמת המערכת. נשמרת באותו אוסף כמו כל הצעה, כדי שהתראת
  // הכפילות תעבוד עליה בדיוק כמו על הצעה שירדה מהפרק בתוך המערכת, אבל מסומנת
  // כהיסטוריה ולעולם אינה מופיעה בלוח ההצעות הפעילות.
  addProposalHistory: async (maleId, femaleId, note = "") => {
    if (!maleId || !femaleId) return null;
    if (get().droppedProposalFor(maleId, femaleId)) return null;
    const author = get().currentUser().name;
    const now = new Date().toISOString();
    const record = {
      maleId,
      femaleId,
      maleName: get().findCandidateById(maleId)?.name || null,
      femaleName: get().findCandidateById(femaleId)?.name || null,
      externalMale: null,
      externalFemale: null,
      status: PROPOSAL_DROPPED,
      isHistory: true,
      createdAt: now,
      rationale: "",
      assignee: null,
      journal: [
        {
          id: `j-${Date.now()}`,
          date: now,
          status: PROPOSAL_DROPPED,
          note: note.trim() || "הוזן כהיסטוריה מלפני הקמת המערכת",
          author,
        },
      ],
    };
    const ref = await addDoc(collection(crmDb, "proposals"), record);
    return { id: ref.id, ...record };
  },
  proposalsForCandidate: (candidateId) =>
    get().proposals.filter((p) => p.maleId === candidateId || p.femaleId === candidateId),

  // --- זירת סיעור המוחות ---
  // סבב = דיון של הצוות על מועמד/ת אחד/ת, סביב שאלה אחת, במשך שלושה ימים.
  // ההערות נשמרות באוסף נפרד (ולא בתוך מסמך הסבב) כדי ששישה אנשים שכותבים
  // באותו רגע לא ידרסו זה את ההערות של זה.
  brainstormRounds: [],
  brainstormNotes: [],
  brainstormLoaded: false,
  brainstormError: false,

  // סבבים שמותר למשתמש/ת הנוכחי/ת לראות. כרטיס חסוי או כרטיס שהוסתר מאיש/אשת
  // צוות מסוים/ת - הסבב עליו נעלם לגמרי, בדיוק כמו בכל שאר המערכת.
  visibleRounds: () => {
    const { brainstormRounds, role } = get();
    const list = [...brainstormRounds].sort(
      (a, b) => new Date(b.openedAt || b.createdAt || 0) - new Date(a.openedAt || a.createdAt || 0)
    );
    if (role === "admin") return list;
    // הצוות אינו רואה טיוטות, ואינו רואה סבב על כרטיס שחסוי בפניו
    return list.filter((r) => r.status !== "draft" && !!get().findCandidateById(r.candidateId));
  },
  notesForRound: (roundId) =>
    get()
      .brainstormNotes.filter((n) => n.roundId === roundId)
      .sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)),
  // הסיכום שהמנהלת כתבה בתום הסבב האחרון על מועמד/ת - מוצג בראש כרטיס הפרופיל
  brainstormSummaryFor: (candidateId) => {
    const withSummary = get()
      .brainstormRounds.filter((r) => r.candidateId === candidateId && String(r.summary || "").trim())
      .sort((a, b) => new Date(b.summaryAt || b.openedAt || 0) - new Date(a.summaryAt || a.openedAt || 0));
    return withSummary[0] || null;
  },
  // סבב נוצר תמיד כטיוטה: הוא אינו גלוי לצוות ושלושת הימים אינם מתחילים לרוץ,
  // עד שהמנהלת לוחצת "שיגור לצוות". כך העיתוי נשאר לגמרי בשליטתה.
  openBrainstormRound: async ({ candidateId, question, secondQuestion = "" }) => {
    const candidate = get().findCandidateById(candidateId);
    if (!candidateId || !String(question || "").trim()) return null;
    const user = get().currentUser();
    const round = {
      candidateId,
      candidateName: candidate?.name || null,
      candidateGender: candidate?.gender || null,
      question: question.trim(),
      // שאלה שנייה, רחבה יותר, שמאפשרת גם למי שלא מכיר/ה את ההיסטוריה להשתתף
      secondQuestion: String(secondQuestion || "").trim(),
      status: "draft",
      openedBy: user.name,
      openedByEmail: normalizeEmail(user.email),
      createdAt: new Date().toISOString(),
      openedAt: null,
      closesAt: null,
      summary: "",
      summaryAt: null,
    };
    const ref = await addDoc(collection(crmDb, "brainstormRounds"), round);
    return { id: ref.id, ...round };
  },
  // השיגור בפועל: מכאן הסבב גלוי לצוות ושעון שלושת הימים מתחיל.
  launchBrainstormRound: async (roundId) => {
    const now = Date.now();
    const patch = {
      status: "open",
      openedAt: new Date(now).toISOString(),
      closesAt: new Date(now + ROUND_MS).toISOString(),
    };
    await updateDoc(doc(crmDb, "brainstormRounds", roundId), patch);
    return patch;
  },
  // אפשר להוסיף או לשנות את הזווית הנוספת גם באמצע סבב פעיל
  setBrainstormSecondQuestion: async (roundId, text) => {
    await updateDoc(doc(crmDb, "brainstormRounds", roundId), {
      secondQuestion: String(text || "").trim(),
    });
  },
  closeBrainstormRound: async (roundId) => {
    await updateDoc(doc(crmDb, "brainstormRounds", roundId), { status: "closed" });
  },
  reopenBrainstormRound: async (roundId) => {
    // פתיחה מחדש מאריכה את הסבב בשלושה ימים נוספים מעכשיו
    await updateDoc(doc(crmDb, "brainstormRounds", roundId), {
      status: "open",
      closesAt: new Date(Date.now() + ROUND_MS).toISOString(),
    });
  },
  saveBrainstormSummary: async (roundId, summary) => {
    await updateDoc(doc(crmDb, "brainstormRounds", roundId), {
      summary: String(summary || "").trim(),
      summaryAt: new Date().toISOString(),
    });
  },
  deleteBrainstormRound: async (roundId) => {
    const notes = get().brainstormNotes.filter((n) => n.roundId === roundId);
    await Promise.all(notes.map((n) => deleteDoc(doc(crmDb, "brainstormNotes", n.id)).catch(() => {})));
    await deleteDoc(doc(crmDb, "brainstormRounds", roundId));
  },
  // parentId - הכרטיסייה שאליה מגיבים (אם זו תגובה)
  // mentions - כתובות של אנשי צוות שתויגו בכרטיסייה
  addBrainstormNote: async (roundId, text, { parentId = null, mentions = [], replyToName = null } = {}) => {
    const body = String(text || "").trim();
    if (!roundId || !body) return null;
    const user = get().currentUser();
    const note = {
      roundId,
      text: body,
      parentId: parentId || null,
      replyToName: replyToName || null,
      mentions: [...new Set(mentions.map(normalizeEmail).filter(Boolean))],
      authorName: user.name,
      authorEmail: normalizeEmail(user.email),
      createdAt: new Date().toISOString(),
      likes: [],
    };
    const ref = await addDoc(collection(crmDb, "brainstormNotes"), note);
    return { id: ref.id, ...note };
  },
  // לייק אחד לכל אדם לכל כרטיסייה. לחיצה נוספת מסירה את הלייק.
  toggleBrainstormLike: async (noteId) => {
    const note = get().brainstormNotes.find((n) => n.id === noteId);
    if (!note) return;
    const me = normalizeEmail(get().currentUser().email);
    if (!me) return;
    const likes = Array.isArray(note.likes) ? note.likes : [];
    const next = likes.includes(me) ? likes.filter((e) => e !== me) : [...likes, me];
    await updateDoc(doc(crmDb, "brainstormNotes", noteId), { likes: next });
  },
  deleteBrainstormNote: async (noteId) => {
    // מוחקים גם את התגובות שנתלו על הכרטיסייה, כדי שלא יישארו תגובות מרחפות
    // שמפנות לכרטיסייה שכבר לא קיימת.
    const replies = get().brainstormNotes.filter((n) => n.parentId === noteId);
    await Promise.all(replies.map((r) => deleteDoc(doc(crmDb, "brainstormNotes", r.id)).catch(() => {})));
    await deleteDoc(doc(crmDb, "brainstormNotes", noteId));
  },

  // --- תיוגים שטרם נראו ---
  // נשמר לכל משתמש/ת בנפרד, כדי שהסימון בתפריט ייעלם רק אצל מי שבאמת נכנס/ה.
  brainstormSeenAt: null,
  markBrainstormSeen: async () => {
    const email = normalizeEmail(get().currentUser().email);
    if (!email) return;
    const now = new Date().toISOString();
    set({ brainstormSeenAt: now });
    await setDoc(doc(crmDb, "userPrefs", email), { brainstormSeenAt: now }, { merge: true }).catch(() => {});
  },
  myUnseenMentions: () => {
    const { brainstormNotes, brainstormSeenAt, brainstormRounds } = get();
    const me = normalizeEmail(get().currentUser().email);
    if (!me) return [];
    // סופרים רק תיוגים בסבבים שהמשתמש/ת באמת רשאי/ת לראות
    const allowed = new Set(get().visibleRounds().map((r) => r.id));
    return unseenMentions(
      brainstormNotes.filter((n) => allowed.has(n.roundId)),
      me,
      brainstormSeenAt
    );
  },

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
      .map((c) => ({
        ...c,
        height: normalizeHeight(c.height),
        availabilityStatus: candidateStatus[c.id] || c.availabilityStatus,
      }))
      // הכרטיס החדש ביותר תמיד ראשון ברשימה
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
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
  pushTaskToStaff: async (title, dueDate, assigneeEmail, candidateId = null, description = "") => {
    // משווים ושומרים את כתובת הנציגה באותה צורה מנורמלת שבה מזוהה איש/אשת הצוות בכניסה,
    // אחרת המשימה לא תופיע אצלה תחת "משימות מהמנהלת".
    const email = normalizeEmail(assigneeEmail);
    const assignee = get().authAllowlist.find((e) => allowlistEmail(e) === email);
    const candidate = candidateId ? get().findCandidateById(candidateId) : null;
    await addDoc(collection(crmDb, "tasks"), {
      title,
      description: description || "",
      dueDate: dueDate || null,
      done: false,
      owner: assignee?.name || "לא משויך",
      assigneeId: email,
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
  // --- סנכרון מגיליון Google Sheets ---
  // הכתובת ומיפוי העמודות נשמרים במסמך ההגדרות הקיים, ולכן אין צורך
  // בכלל אבטחה חדש: המנהלת כותבת, והצוות קורא.
  sheetImport: { csvUrl: "", mapping: {} },
  setSheetImportConfig: async (config) => {
    await setDoc(
      doc(crmDb, "settings", "app"),
      { sheetImport: { ...get().sheetImport, ...config } },
      { merge: true }
    );
  },

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
