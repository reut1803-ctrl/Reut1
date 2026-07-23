"use client";

import { db, auth } from "./firebase";
import { signInAnonymously } from "firebase/auth";
import {
  collection,
  doc,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  getDoc,
  arrayUnion,
  Bytes,
} from "firebase/firestore";
import { DEFAULT_OPEN_QUESTIONS, DEFAULT_INTRO } from "./questions";

// שכבת נתונים מבוססת ענן (Firestore) - משותפת לכל המכשירים.
// נשמרת מטמון מקומי שמתעדכן בזמן אמת, כך שהרכיבים ממשיכים לקרוא loadData() באופן רגיל.

const DEFAULT_POPUP = { enabled: false, message: "", tips: [] };

const cache = {
  candidates: [],
  reps: [],
  tasks: [],
  matches: [],
  recordings: [],
  logs: [],
  intro: DEFAULT_INTRO,
  openQuestions: DEFAULT_OPEN_QUESTIONS,
  adminPassword: "admin1234",
  viewerPassword: "view1234",
  popup: DEFAULT_POPUP,
};

let initialized = false;
let seeded = false;

// מעקב אחר מצב החיבור לשרת - לצורך הצגת הודעות שגיאה ברורות במסך ההתחברות.
let lastError = "";
let dataReady = false;
export function getConnectionError() {
  return lastError;
}
export function isDataReady() {
  return dataReady;
}
function recordError(where, e) {
  const code = (e && (e.code || e.name)) || "";
  const msg = (e && e.message) || String(e);
  lastError = `[${where}] ${code} ${msg}`.trim();
  notify();
}

// בדיקה אם האחסון המקומי (localStorage) זמין - נחסם בגלישה פרטית/דפדפן בתוך אפליקציה.
export function storageAvailable() {
  try {
    const k = "__store_test__";
    localStorage.setItem(k, "1");
    localStorage.removeItem(k);
    return true;
  } catch (e) {
    return false;
  }
}

// מוודא שהמכשיר מחובר (התחברות אנונימית) לפני כל פעולת כתיבה.
// זה מונע כשלים בנייד כשהטופס נשלח לפני שההתחברות הספיקה להסתיים.
let authPromise = null;
export function ensureAuth() {
  if (auth.currentUser) return Promise.resolve();
  if (!authPromise) {
    authPromise = signInAnonymously(auth).catch((e) => {
      authPromise = null; // מאפשר ניסיון חוזר בפעם הבאה
      recordError("auth", e); // כשל התחברות אנונימית (בד"כ חסימת עוגיות/אחסון או דפדפן בתוך אפליקציה)
      throw e;
    });
  }
  return authPromise;
}

function notify() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("shidduch_update"));
}

// הנציג/ה שמוצג/ת לגולשים ליצירת קשר עבור מועמד נתון.
// אם הנציג/ה המשויך/ת בחופשה (readOnly) ויש לו/ה מחליף/ה (coveredBy) - מציגים את המחליף/ה,
// כך שהשם של מי שבחופשה "נקבר" ופניות מנותבות למחליף/ה. השיוך במסד לא משתנה.
export function displayRep(candidate, reps) {
  if (!candidate) return null;
  const assigned = reps.find((r) => r.id === candidate.assignedRep);
  if (assigned && assigned.readOnly && (assigned.coveredBy || []).length > 0) {
    const cover = reps.find((r) => r.id === assigned.coveredBy[0]);
    if (cover) return cover;
  }
  return assigned || null;
}

// ----- יומן פעילות (Audit) -----
function actorName() {
  const u = getCurrentUser();
  if (!u) return "לא ידוע";
  if (u.role === "admin") return "מנהלת";
  if (u.role === "viewer") return "צופה";
  const rep = cache.reps.find((r) => r.id === u.repId);
  return rep ? rep.name : "נציג";
}
export function logAction(action) {
  // רישום פעולה תחת שם המבצע (fire-and-forget)
  ensureAuth()
    .then(() =>
      addDoc(collection(db, "logs"), {
        actor: actorName(),
        action,
        at: new Date().toISOString(),
      })
    )
    .catch(() => {});
}

function subscribeCollection(name) {
  onSnapshot(
    collection(db, name),
    (snap) => {
      cache[name] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      dataReady = true; // הגיעו נתונים מהשרת - המערכת טעונה
      notify();
    },
    (e) => recordError(`load:${name}`, e) // כשל קריאה (למשל חסימת אחסון/הרשאות)
  );
}

export function initStore() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  // התחברות אנונימית כדי לגשת למסד; לאחר מכן מתחילים להאזין לנתונים.
  ensureAuth()
    .catch(() => {})
    .finally(() => startSubscriptions());
}

function startSubscriptions() {
  subscribeCollection("candidates");
  subscribeCollection("reps");
  subscribeCollection("tasks");
  subscribeCollection("matches");
  subscribeCollection("recordings"); // מטא-דאטה בלבד (בלי האודיו הכבד)
  subscribeCollection("logs"); // יומן פעילות
  onSnapshot(doc(db, "meta", "config"), (snap) => {
    dataReady = true;
    if (snap.exists()) {
      const d = snap.data();
      cache.intro = d.intro || DEFAULT_INTRO;
      cache.openQuestions = d.openQuestions || DEFAULT_OPEN_QUESTIONS;
      cache.adminPassword = d.adminPassword || "admin1234";
      cache.viewerPassword = d.viewerPassword || "view1234";
      cache.popup = d.popup || DEFAULT_POPUP;
    } else if (!seeded && !snap.metadata.fromCache) {
      // יצירה ראשונית - רק אם השרת עצמו מאשר שהמסמך אינו קיים.
      // חשוב: לא לפעול על סמך מטמון מקומי ריק (fromCache), אחרת הסיסמאות
      // וההגדרות היו נדרסות בכל טעינה במכשיר עם מטמון קר. merge מונע דריסה של שדות קיימים.
      seeded = true;
      setDoc(
        doc(db, "meta", "config"),
        {
          intro: DEFAULT_INTRO,
          openQuestions: DEFAULT_OPEN_QUESTIONS,
          adminPassword: "admin1234",
        },
        { merge: true }
      );
    }
    notify();
  }, (e) => recordError("load:config", e));
}

export function loadData() {
  initStore();
  return {
    candidates: cache.candidates,
    reps: cache.reps,
    tasks: cache.tasks,
    matches: cache.matches,
    recordings: cache.recordings,
    logs: cache.logs,
    intro: cache.intro,
    openQuestions: cache.openQuestions,
    adminPassword: cache.adminPassword,
    viewerPassword: cache.viewerPassword,
    popup: cache.popup,
  };
}

// ----- מועמדים -----
export async function addCandidate(candidate) {
  await ensureAuth();
  const ref = await addDoc(collection(db, "candidates"), {
    createdAt: new Date().toISOString(),
    assignedRep: "",
    sensitiveInfo: "",
    ...candidate,
  });
  logAction(`הוסיף/ה מועמד: ${candidate.fullName || ""}`);
  return ref;
}
export async function updateCandidate(id, patch) {
  await ensureAuth();
  const name = cache.candidates.find((c) => c.id === id)?.fullName || patch.fullName || "";
  const res = await updateDoc(doc(db, "candidates", id), patch);
  logAction(`ערך/ה מועמד: ${name}`);
  return res;
}
export async function deleteCandidate(id) {
  await ensureAuth();
  const name = cache.candidates.find((c) => c.id === id)?.fullName || "";
  logAction(`מחק/ה מועמד: ${name}`);
  await deleteDoc(doc(db, "candidates", id));
  await Promise.all(
    cache.matches
      .filter((m) => m.manId === id || m.womanId === id)
      .map((m) => deleteDoc(doc(db, "matches", m.id)))
  );
  await Promise.all(
    cache.tasks
      .filter((t) => t.candidateId === id)
      .map((t) => deleteDoc(doc(db, "tasks", t.id)))
  );
}

// ----- נציגים -----
export async function addRep(rep) {
  await ensureAuth();
  return addDoc(collection(db, "reps"), rep);
}
export async function updateRep(id, patch) {
  await ensureAuth();
  return updateDoc(doc(db, "reps", id), patch);
}
export async function deleteRep(id) {
  await ensureAuth();
  // מעבירים את המועמדים של הנציג ל"ללא שיוך" כדי שלא ייעלמו
  await Promise.all(
    cache.candidates
      .filter((c) => c.assignedRep === id)
      .map((c) => updateDoc(doc(db, "candidates", c.id), { assignedRep: "" }))
  );
  return deleteDoc(doc(db, "reps", id));
}

// ----- משימות -----
export async function addTask(task) {
  await ensureAuth();
  return addDoc(collection(db, "tasks"), { done: false, ...task });
}
export async function updateTask(id, patch) {
  await ensureAuth();
  return updateDoc(doc(db, "tasks", id), patch);
}
export async function deleteTask(id) {
  await ensureAuth();
  return deleteDoc(doc(db, "tasks", id));
}

// ----- התאמות -----
export async function addMatch(match) {
  await ensureAuth();
  const man = cache.candidates.find((c) => c.id === match.manId)?.fullName || "";
  const woman = cache.candidates.find((c) => c.id === match.womanId)?.fullName || "";
  const ref = await addDoc(collection(db, "matches"), {
    status: "נוצרה התאמה",
    createdAt: new Date().toISOString(),
    ...match,
  });
  logAction(`יצר/ה התאמה: ${man} — ${woman}`);
  return ref;
}
export async function updateMatch(id, patch) {
  await ensureAuth();
  return updateDoc(doc(db, "matches", id), patch);
}
export async function deleteMatch(id) {
  await ensureAuth();
  return deleteDoc(doc(db, "matches", id));
}
// הוספת עדכון/הערה ליומן המעקב של ההתאמה - עם שם המבצע/ת והתאריך.
export async function addMatchUpdate(id, text) {
  await ensureAuth();
  const entry = { by: actorName(), at: new Date().toISOString(), text };
  const res = await updateDoc(doc(db, "matches", id), { updates: arrayUnion(entry) });
  logAction(`הוסיף/ה עדכון להתאמה`);
  return res;
}

// ----- הגדרות (הקדמה, שאלות, סיסמת מנהלת) -----
export async function updateOpenQuestions(questions) {
  await ensureAuth();
  return setDoc(doc(db, "meta", "config"), { openQuestions: questions }, { merge: true });
}
export async function updateIntro(intro) {
  await ensureAuth();
  return setDoc(doc(db, "meta", "config"), { intro }, { merge: true });
}
export async function updateAdminPassword(password) {
  await ensureAuth();
  return setDoc(doc(db, "meta", "config"), { adminPassword: password }, { merge: true });
}
export async function updateViewerPassword(password) {
  await ensureAuth();
  return setDoc(doc(db, "meta", "config"), { viewerPassword: password }, { merge: true });
}
export async function updatePopup(popup) {
  await ensureAuth();
  return setDoc(doc(db, "meta", "config"), { popup }, { merge: true });
}

// ----- הקלטות שמע -----
// המטא-דאטה נשמר באוסף recordings; האודיו עצמו נשמר בנפרד (recordingBlobs) ונטען רק בהשמעה.
export async function addRecording({ candidateId, repId, mime, durationSec, bytes }) {
  await ensureAuth();
  const ref = await addDoc(collection(db, "recordings"), {
    candidateId,
    repId: repId || "",
    mime: mime || "audio/webm",
    durationSec: durationSec || 0,
    createdAt: new Date().toISOString(),
  });
  await setDoc(doc(db, "recordingBlobs", ref.id), { audio: Bytes.fromUint8Array(bytes) });
  const name = cache.candidates.find((c) => c.id === candidateId)?.fullName || "";
  logAction(`הוסיף/ה הקלטה למועמד: ${name}`);
  return ref;
}

export async function getRecordingAudio(id) {
  await ensureAuth();
  const snap = await getDoc(doc(db, "recordingBlobs", id));
  if (!snap.exists()) return null;
  const b = snap.data().audio;
  return b && b.toUint8Array ? b.toUint8Array() : null;
}

export async function deleteRecording(id) {
  await ensureAuth();
  await deleteDoc(doc(db, "recordings", id));
  await deleteDoc(doc(db, "recordingBlobs", id));
}

// ----- מצב התחברות (מקומי לכל מכשיר) -----
const USER_KEY = "shidduch_user_v1";

export function getCurrentUser() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function setCurrentUser(user) {
  if (typeof window === "undefined") return;
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event("shidduch_update"));
}
