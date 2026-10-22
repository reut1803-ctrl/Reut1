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
  increment,
  Bytes,
} from "firebase/firestore";
import { DEFAULT_OPEN_QUESTIONS, DEFAULT_INTRO } from "./questions";

// שכבת נתונים מבוססת ענן (Firestore) - משותפת לכל המכשירים.
// נשמרת מטמון מקומי שמתעדכן בזמן אמת, כך שהרכיבים ממשיכים לקרוא loadData() באופן רגיל.

const DEFAULT_POPUP = { enabled: false, message: "", tips: [] };
const DEFAULT_MAZALTOV = { enabled: false, coupleA: "", coupleB: "", matchmakers: "", message: "", id: "" };

// ברירת מחדל ל"הסיפור שלי" בעמוד הבית (ניתן לעריכה מלוח הבקרה).
export const DEFAULT_HOME_STORY = {
  heading: "קצת עליי",
  subtitle: "גללו כדי לעבור בין התחנות",
  stations: [
    { title: "נעים להכיר", text: `שמי רעות פריד, בת 26 — נשואה לזכריה ואמא למנוחה רחל וחיה מושקא. אנחנו גרים בקהילת חב"ד ביצהר, וברוך השם אני זוכה לעמוד מאחורי 'הקהילה איתך' ולרכז את צוות השגרירים.` },
    { title: "מי שלצידכם", text: `חשוב לנו שמי שמלווה אתכם יכיר באמת את העולם שלכם — שגריר מהיישוב, מהמקום שבו למדתם, או אנחנו מההנהלה. מישהו קרוב, שמקשיב, ושאכפת לו.` },
    { title: "הדרך שלנו", text: `בנינו אותה מתוך הקשבה: מערכת פנימית להתאמות מדויקות, ערבי סיעור מוחות עם הקהילה, שיחות אישיות וסדנאות — כי מאחורי כל התאמה עומד אדם, לא נתון.` },
    { title: "מהשטח, מהלב", text: `עד היום זכיתי לשדך יותר מ-20 זוגות וללוות מאות צעירים וצעירות, וכל מפגש לימד אותי שהקשבה אמיתית עושה את ההבדל.` },
    { title: "מכאן והלאה", text: `הכלים כאן חדשים, אבל הלב נשאר אותו לב: ללוות אתכם באכפתיות, בסבלנות ובהקשבה — עד שתפגשו את מי שמחכה לכם.` },
  ],
};

// טופס "איך עבר החודש?" — ברירת מחדל. המנהלת עורכת את הנוסח בלוח הבקרה,
// והוא נשמר במסמך ההגדרות meta/config (שדה reflectionForm).
export const DEFAULT_REFLECTION_FORM = {
  intro: "כמה מילים בכנות — זה עוזר לנו לדייק את הליווי שלך ואת המפגש הקרוב. נקרא רק על ידי ההנהלה.",
  questions: [
    { id: "q1", label: "איך היה לך החודש?", hint: "מה שימח אותך, מה הרגשת…" },
    { id: "q2", label: "באילו אתגרים נתקלת שניקח לתשומת ליבנו?", hint: "משהו שהיה קשה, חסר, או שהיית רוצה עזרה בו…" },
    { id: "q3", label: "מה נרצה לדייק למפגש הקרוב?", hint: "נושא לשיחה, כלי שחסר, שאלה…" },
  ],
};

// "לוח החזון" בעמוד השער — כל הטקסטים (חזית + גב של כל כרטיס) נערכים בלוח הבקרה
// ונשמרים ב-meta/config.visionBoard. style = רקע הכרטיס; size = גובה (s/m/l).
export const DEFAULT_VISION_BOARD = {
  title: "החזון שלנו",
  subtitle: "מה שמניע אותנו בכל שיחה ובכל הצעה",
  items: [
    { id: "v1", style: "harlequin", size: "m", front: "", back: "כל אחד ואחת ראויים למעטפת חמה, אישית ודיסקרטית." },
    { id: "v2", style: "cream", size: "m", front: "כל בית נאמן מתחיל בשיחה אחת", back: "שיחה כנה אחת עם שגריר שמכיר אותך — וממנה הכל מתחיל." },
    { id: "v3", style: "blush", size: "l", front: "בדיסקרטיות, בסבלנות ובאמונה", back: "המידע נשמר במאגר סגור, ורק מי שמלווה אתכם רואה אותו." },
    { id: "v4", style: "wine", size: "m", front: "לראות את האדם — לא רק את הפרטים", back: "אנחנו מכירים אתכם מעבר לטופס: את האופי, את הערכים ואת החלומות." },
    { id: "v5", style: "paper", size: "s", front: "", back: "שגרירים מהיישוב, מהישיבה ומהקהילה — קרובים אליכם." },
    { id: "v6", style: "cream", size: "m", front: "מאחורי כל הצעה עומד מישהו שאכפת לו", back: "כל הצעה נבחנת בסיעור מוחות של הצוות, לא באקראי." },
    { id: "v7", style: "sand", size: "l", front: "יחד, כקהילה אחת", back: "ערבי היכרות, שיחות אישיות, סדנאות ופאנלים — כדי שאף אחד לא ילך לבד." },
    { id: "v8", style: "harlequin", size: "s", front: "", back: "שירבו בתים נאמנים בישראל." },
  ],
};

const cache = {
  candidates: [],
  intakeSubmissions: [], // הרשמות מהטופס הציבורי - ממתינות לאישור, נפרד מהמאגר הראשי
  candidateStatus: [],   // אוסף ציבורי צר לאזור האישי (שם + סטטוס + מסלול בלבד)
  events: [],            // אירועים לפרסום (פלאייר + קישור הרשמה)
  testimonials: [],      // המלצות לעמוד הבית (צילומי מסך) - נשמרות דחוסות כ-dataURL
  reps: [],
  tasks: [],
  matches: [],
  recordings: [],
  logs: [],
  engagement: [],
  faq: [],               // שאלות ותשובות למרכז ההכשרה (ניתן לעריכה מלוח הבקרה)
  reflections: [],       // סיכומים חודשיים של השגרירים ("איך עבר החודש?")
  intro: DEFAULT_INTRO,
  openQuestions: DEFAULT_OPEN_QUESTIONS,
  // אין סיסמאות ברירת מחדל: אם לא הוגדרה סיסמה, הכניסה פשוט חסומה (אין "דלת אחורית").
  adminPassword: "",
  viewerPassword: "",
  admin2Password: "",
  admin2Name: "",
  popup: DEFAULT_POPUP,
  mazalTov: DEFAULT_MAZALTOV,
  homeStory: DEFAULT_HOME_STORY,
  reflectionForm: DEFAULT_REFLECTION_FORM,
  visionBoard: DEFAULT_VISION_BOARD,
};

let initialized = false;
let fullStarted = false; // האם כבר התחלנו להאזין לנתונים הכבדים (לוח הבקרה)
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

// חברי הצוות של נציג/ה לפי agency_name (שם צוות). מחזיר את כל הנציגים שחולקים
// את אותו שם צוות, כשהנציג/ה הנתון/ה ראשון/ה. אם אין שם צוות — מחזיר רק אותו/ה.
// שימו לב: אינו נוגע ב-agent_code/שיוך — רק מקבץ לתצוגה לפי השדה האופציונלי agency_name.
export function teamMembers(rep, reps) {
  if (!rep) return [];
  const team = (rep.agency_name || "").trim();
  const all = reps || [];
  if (!team) return [rep];
  const members = all.filter((r) => (r.agency_name || "").trim() === team);
  if (members.length === 0) return [rep];
  return [...members].sort((a, b) => (a.id === rep.id ? -1 : b.id === rep.id ? 1 : 0));
}

// קבוצת מזהי הנציגים ש"נחשבים אני" עבור נציג/ה מחובר/ת — הוא/היא עצמו/ה וכל חברי
// הצוות שחולקים את אותו agency_name. בלי שם צוות — רק המזהה האישי. משמש להרחבת
// הגישה למרחב עבודה משותף (מועמדים ומשימות), בלי לגעת במנגנון הסיסמאות/ההתחברות.
export function teamRepIds(repId, reps) {
  if (!repId) return new Set();
  const me = (reps || []).find((r) => r.id === repId);
  const ids = teamMembers(me, reps).map((r) => r.id);
  if (!ids.includes(repId)) ids.push(repId);
  return new Set(ids);
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
// ----- מעקב מעורבות צוות (Reads) -----
// מפתח השבוע = תאריך יום ראשון של השבוע הנוכחי (תחילת השבוע בישראל).
export function currentWeekKey() {
  const d = new Date();
  const sunday = new Date(d);
  sunday.setDate(d.getDate() - d.getDay());
  return sunday.toISOString().slice(0, 10);
}
// סופר פעולה שבועית לנציג/ה: "view" = צפייה בכרטיס, "play" = השמעת הקלטה.
// עוקבים אחר נציגים בלבד (לא מנהלת/צופה). fire-and-forget.
export function trackEngagement(kind) {
  const u = getCurrentUser();
  if (!u || u.role !== "rep" || !u.repId) return;
  const wk = currentWeekKey();
  const field = kind === "play" ? "plays" : "views";
  ensureAuth()
    .then(() =>
      setDoc(
        doc(db, "engagement", `${u.repId}_${wk}`),
        { repId: u.repId, week: wk, [field]: increment(1) },
        { merge: true }
      )
    )
    .catch(() => {});
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

// --- אתחול קל: רק מה שדרוש לעמודים הציבוריים (בית / טופס / אזור אישי) ---
// כך עמוד הבית ומסך ההתחברות עולים מיידית, בלי להוריד את הנתונים הכבדים
// (מועמדים עם תמונות Base64, משימות, התאמות, יומנים) של כל המערכת.
export function initStore() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  ensureAuth()
    .catch(() => {})
    .finally(() => startLightSubscriptions());
}

// --- אתחול מלא: הנתונים הכבדים של לוח הבקרה. נקרא רק ממסך הניהול (admin). ---
export function ensureFullData() {
  initStore();
  if (fullStarted || typeof window === "undefined") return;
  fullStarted = true;
  ensureAuth()
    .catch(() => {})
    .finally(() => startFullSubscriptions());
}

function startLightSubscriptions() {
  subscribeCollection("testimonials");      // המלצות לעמוד הבית (צילומי מסך)
  subscribeCollection("events");            // אירועים לפרסום
  subscribeCollection("candidateStatus");   // סטטוס/מסלול לאזור האישי (ציבורי וצר)
  subscribeConfig();                        // meta/config — טקסטים, שאלות, סיפור הבית, סיסמאות
}

function startFullSubscriptions() {
  subscribeCollection("candidates");        // כבד — כולל תמונות Base64
  subscribeCollection("intakeSubmissions"); // תור הממתינים (הרשמות ציבוריות)
  subscribeCollection("reps");
  subscribeCollection("tasks");
  subscribeCollection("matches");
  subscribeCollection("recordings"); // מטא-דאטה בלבד (בלי האודיו הכבד)
  subscribeCollection("logs"); // יומן פעילות
  subscribeCollection("engagement"); // מעקב מעורבות צוות (צפיות/השמעות שבועיות)
  subscribeCollection("faq"); // שאלות ותשובות למרכז ההכשרה (ניהול דינמי)
  subscribeCollection("reflections"); // סיכומים חודשיים של השגרירים
}

function subscribeConfig() {
  onSnapshot(doc(db, "meta", "config"), (snap) => {
    dataReady = true;
    if (snap.exists()) {
      const d = snap.data();
      cache.intro = d.intro || DEFAULT_INTRO;
      cache.openQuestions = d.openQuestions || DEFAULT_OPEN_QUESTIONS;
      cache.adminPassword = d.adminPassword || "";
      cache.viewerPassword = d.viewerPassword || "";
      cache.admin2Password = d.admin2Password || "";
      cache.admin2Name = d.admin2Name || "";
      cache.popup = d.popup || DEFAULT_POPUP;
      cache.mazalTov = d.mazalTov || DEFAULT_MAZALTOV;
      cache.homeStory = d.homeStory && Array.isArray(d.homeStory.stations) && d.homeStory.stations.length
        ? { ...DEFAULT_HOME_STORY, ...d.homeStory }
        : DEFAULT_HOME_STORY;
      cache.reflectionForm = d.reflectionForm && Array.isArray(d.reflectionForm.questions) && d.reflectionForm.questions.length
        ? { ...DEFAULT_REFLECTION_FORM, ...d.reflectionForm }
        : DEFAULT_REFLECTION_FORM;
      cache.visionBoard = d.visionBoard && Array.isArray(d.visionBoard.items) && d.visionBoard.items.length
        ? { ...DEFAULT_VISION_BOARD, ...d.visionBoard }
        : DEFAULT_VISION_BOARD;
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
          // לא זורעים סיסמת ברירת מחדל. בהקמה ראשונה יש להגדיר סיסמת מנהלת ידנית.
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
    intake: cache.intakeSubmissions,
    candidateStatus: cache.candidateStatus,
    events: cache.events,
    testimonials: cache.testimonials,
    reps: cache.reps,
    tasks: cache.tasks,
    matches: cache.matches,
    recordings: cache.recordings,
    logs: cache.logs,
    engagement: cache.engagement,
    faq: cache.faq,
    reflections: cache.reflections,
    intro: cache.intro,
    openQuestions: cache.openQuestions,
    adminPassword: cache.adminPassword,
    viewerPassword: cache.viewerPassword,
    admin2Password: cache.admin2Password,
    admin2Name: cache.admin2Name,
    popup: cache.popup,
    mazalTov: cache.mazalTov,
    homeStory: cache.homeStory,
    reflectionForm: cache.reflectionForm,
    visionBoard: cache.visionBoard,
  };
}

// ----- תור ממתינים (intakeSubmissions) -----
// הרשמה מהטופס הציבורי. נכנסת לאוסף נפרד עם status:"pending" ואינה נוגעת במאגר הראשי.
export async function addIntake(data) {
  await ensureAuth();
  const ref = await addDoc(collection(db, "intakeSubmissions"), {
    status: "pending",
    createdAt: new Date().toISOString(),
    track: "", // נבחר במסך התודה: "personal" | "callback"
    goldFrame: false, // סיווג פנימי של המנהלת בלבד
    ...data,
  });
  // אזור אישי: יוצרים מסמך סטטוס צר (שם בלבד + סטטוס + מסלול), בלי שאר השאלון.
  try {
    await setDoc(doc(db, "candidateStatus", ref.id), {
      name: (data.fullName || "").trim(),
      gender: data.gender || "",
      availabilityStatus: "",
      personalTrack: "",
      trackMessage: "",
      createdAt: new Date().toISOString(),
    });
  } catch (e) {}
  return ref;
}
// ----- אזור אישי (candidateStatus) - עדכון סטטוס/מסלול מהקישור האישי -----
export async function setStatusAvailability(id, availabilityStatus) {
  await ensureAuth();
  return setDoc(doc(db, "candidateStatus", id), { availabilityStatus }, { merge: true });
}
export async function setStatusTrack(id, personalTrack, trackMessage = "") {
  await ensureAuth();
  await setDoc(doc(db, "candidateStatus", id), { personalTrack, trackMessage, trackUpdatedAt: new Date().toISOString() }, { merge: true });
  // סנכרון לתור הממתינים כל עוד הפנייה קיימת (best-effort).
  try { await updateDoc(doc(db, "intakeSubmissions", id), { track: personalTrack, trackMessage }); } catch (e) {}
}
// ----- אירועים (events) -----
export async function addEvent(data) {
  await ensureAuth();
  return addDoc(collection(db, "events"), { createdAt: new Date().toISOString(), ...data });
}
export async function updateEvent(id, patch) {
  await ensureAuth();
  return updateDoc(doc(db, "events", id), patch);
}
export async function deleteEvent(id) {
  await ensureAuth();
  return deleteDoc(doc(db, "events", id));
}
// ----- המלצות (צילומי מסך לעמוד הבית) -----
// התמונה נשמרת כ-dataURL דחוס (JPEG) ישירות במסמך. מגבלת מסמך Firestore ~1MB.
export async function addTestimonial(image) {
  await ensureAuth();
  return addDoc(collection(db, "testimonials"), { image, createdAt: new Date().toISOString() });
}
export async function deleteTestimonial(id) {
  await ensureAuth();
  return deleteDoc(doc(db, "testimonials", id));
}
// ----- שאלות ותשובות (FAQ) למרכז ההכשרה של השגרירים -----
// ברירת מחדל שתוצג כל עוד לא הוגדרו שאלות בלוח הבקרה (נפילה חלקה, לא נשמרת בשרת).
export const DEFAULT_FAQ = [
  { id: "def1", question: "כל כמה זמן כדאי ליצור קשר עם מועמד?", answer: "מומלץ מגע חם לפחות אחת ל-30 יום — גם בלי הצעה קונקרטית, רק כדי שירגישו מעטפת ושייכות." },
  { id: "def2", question: "מה כותבים בתיבת 'מה התחדש'?", answer: "כל עדכון קצר: 'דיברנו, מחפש רצינית', 'ביקש הפסקה לחודש', 'הצעתי התאמה'. זה פרטי — גלוי רק לך ולצוות שלך." },
  { id: "def3", question: "מה עושים כשמועמד לא עונה?", answer: "משאירים הודעת וואטסאפ חמה, מסמנים 'נודניק' לתזכורת, ומנסים שוב בעוד יומיים-שלושה." },
];
export async function addFaq(item) {
  await ensureAuth();
  return addDoc(collection(db, "faq"), { question: "", answer: "", createdAt: new Date().toISOString(), ...item });
}
export async function updateFaq(id, patch) {
  await ensureAuth();
  return updateDoc(doc(db, "faq", id), patch);
}
// ----- סיכום חודשי של שגריר ("איך עבר החודש?") -----
// מסמך אחד לכל שגריר לכל חודש: reflections/{repId}_{YYYY-MM}. מילוי חוזר באותו חודש מעדכן.
export function monthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
export async function saveReflection({ repId, repName, month, answers, questions }) {
  await ensureAuth();
  const now = new Date().toISOString();
  const existing = cache.reflections.find((r) => r.id === `${repId}_${month}`);
  return setDoc(
    doc(db, "reflections", `${repId}_${month}`),
    {
      repId, repName: repName || "", month,
      answers: answers || {},
      // נוסח השאלות כפי שהיה בזמן המילוי — כדי שגם אם המנהלת תשנה אותן בהמשך,
      // הסיכום הישן ייקרא עם השאלות שנשאלו בפועל.
      questions: (questions || []).map((q) => ({ id: q.id, label: q.label })),
      updatedAt: now,
      ...(existing ? {} : { createdAt: now }),
    },
    { merge: true }
  );
}
export async function deleteFaq(id) {
  await ensureAuth();
  return deleteDoc(doc(db, "faq", id));
}
// עדכון פנייה ממתינה (בחירת מסלול מהתודה, או עריכה מלאה בלוח הבקרה).
export async function updateIntake(id, patch) {
  await ensureAuth();
  return updateDoc(doc(db, "intakeSubmissions", id), patch);
}
// דחייה - הסרת הפנייה מהתור.
export async function deleteIntake(id) {
  await ensureAuth();
  logAction(`דחה/תה הרשמה ממתינה`);
  return deleteDoc(doc(db, "intakeSubmissions", id));
}
// אישור - יצירת כרטיס במאגר הראשי מתוך הפנייה, והסרת הפנייה מהתור.
export async function approveIntake(id) {
  await ensureAuth();
  const item = cache.intakeSubmissions.find((x) => x.id === id);
  if (!item) return;
  const { id: _omit, status, createdAt, ...fields } = item;
  await addCandidate(fields); // fields כולל את שדות הכרטיס + track + goldFrame
  await deleteDoc(doc(db, "intakeSubmissions", id));
  logAction(`אישר/ה הרשמה למאגר: ${item.fullName || ""}`);
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
  const now = new Date().toISOString();
  const ref = await addDoc(collection(db, "matches"), {
    status: "נוצרה התאמה",
    createdAt: now,
    statusChangedAt: now, // למעקב "הצעה תקועה"
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
// ניהול מנהלת נוספת (Admin משני) - הרשאת בקרה (Supervisor) בלבד.
export async function updateAdmin2(admin2Name, admin2Password) {
  await ensureAuth();
  return setDoc(doc(db, "meta", "config"), { admin2Name, admin2Password }, { merge: true });
}
export async function updatePopup(popup) {
  await ensureAuth();
  return setDoc(doc(db, "meta", "config"), { popup }, { merge: true });
}
export async function updateMazalTov(mazalTov) {
  await ensureAuth();
  return setDoc(doc(db, "meta", "config"), { mazalTov }, { merge: true });
}
// עריכת "הסיפור שלי" בעמוד הבית (כותרת, תת-כותרת, ותחנות ציר הזמן) - מנהלת בלבד.
export async function updateVisionBoard(visionBoard) {
  await ensureAuth();
  return setDoc(doc(db, "meta", "config"), { visionBoard }, { merge: true });
}
export async function updateReflectionForm(reflectionForm) {
  await ensureAuth();
  return setDoc(doc(db, "meta", "config"), { reflectionForm }, { merge: true });
}
export async function updateHomeStory(homeStory) {
  await ensureAuth();
  return setDoc(doc(db, "meta", "config"), { homeStory }, { merge: true });
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
