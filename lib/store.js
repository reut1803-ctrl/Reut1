"use client";

import { DEFAULT_OPEN_QUESTIONS, DEFAULT_INTRO } from "./questions";

// שכבת נתונים מבוססת דפדפן (localStorage).
// כל הנתונים נשמרים במכשיר - מתאים לאתר דמה ולשימוש מיידי ללא שרת.

const KEY = "shidduch_data_v1";

function emptyData() {
  return {
    candidates: [],
    reps: [
      { id: "rep_demo", name: "נציג לדוגמה", institution: "מוסד לדוגמה", phone: "", password: "1234" },
    ],
    tasks: [],
    matches: [],
    openQuestions: DEFAULT_OPEN_QUESTIONS,
    intro: DEFAULT_INTRO,
    adminPassword: "admin1234",
  };
}

// המרת נתונים ישנים למבנה החדש (שאלות עם ניסוח לזכר/נקבה, סיסמאות).
function migrate(data) {
  if (!data.adminPassword) data.adminPassword = "admin1234";
  if (!data.intro || (!data.intro.male && !data.intro.female)) data.intro = DEFAULT_INTRO;
  data.reps = (data.reps || []).map((r) => ({
    phone: "",
    password: r.password || "1234",
    ...r,
  }));
  data.openQuestions = (data.openQuestions || DEFAULT_OPEN_QUESTIONS).map((q) => {
    if (q.male || q.female) return q;
    // המרה משאלה ישנה (label בודד) לשני ניסוחים
    return { key: q.key, male: q.label || "", female: q.label || "" };
  });
  return data;
}

export function loadData() {
  if (typeof window === "undefined") return emptyData();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const d = emptyData();
      localStorage.setItem(KEY, JSON.stringify(d));
      return d;
    }
    const parsed = JSON.parse(raw);
    return migrate({ ...emptyData(), ...parsed });
  } catch (e) {
    return emptyData();
  }
}

export function updateIntro(intro) {
  const data = loadData();
  data.intro = intro;
  saveData(data);
}

export function updateAdminPassword(password) {
  const data = loadData();
  data.adminPassword = password;
  saveData(data);
}

export function saveData(data) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(data));
  window.dispatchEvent(new Event("shidduch_update"));
}

export function uid(prefix = "id") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

// ----- מועמדים -----
export function addCandidate(candidate) {
  const data = loadData();
  const c = {
    id: uid("cand"),
    createdAt: new Date().toISOString(),
    assignedRep: "",
    sensitiveInfo: "",
    ...candidate,
  };
  data.candidates.push(c);
  saveData(data);
  return c;
}

export function updateCandidate(id, patch) {
  const data = loadData();
  data.candidates = data.candidates.map((c) =>
    c.id === id ? { ...c, ...patch } : c
  );
  saveData(data);
}

export function deleteCandidate(id) {
  const data = loadData();
  data.candidates = data.candidates.filter((c) => c.id !== id);
  data.matches = data.matches.filter(
    (m) => m.manId !== id && m.womanId !== id
  );
  data.tasks = data.tasks.filter((t) => t.candidateId !== id);
  saveData(data);
}

// ----- נציגים -----
export function addRep(rep) {
  const data = loadData();
  const r = { id: uid("rep"), ...rep };
  data.reps.push(r);
  saveData(data);
  return r;
}

export function updateRep(id, patch) {
  const data = loadData();
  data.reps = data.reps.map((r) => (r.id === id ? { ...r, ...patch } : r));
  saveData(data);
}

export function deleteRep(id) {
  const data = loadData();
  data.reps = data.reps.filter((r) => r.id !== id);
  saveData(data);
}

// ----- משימות -----
export function addTask(task) {
  const data = loadData();
  const t = { id: uid("task"), done: false, ...task };
  data.tasks.push(t);
  saveData(data);
  return t;
}

export function updateTask(id, patch) {
  const data = loadData();
  data.tasks = data.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t));
  saveData(data);
}

export function deleteTask(id) {
  const data = loadData();
  data.tasks = data.tasks.filter((t) => t.id !== id);
  saveData(data);
}

// ----- התאמות -----
export function addMatch(match) {
  const data = loadData();
  const m = {
    id: uid("match"),
    status: "נוצרה התאמה",
    createdAt: new Date().toISOString(),
    ...match,
  };
  data.matches.push(m);
  saveData(data);
  return m;
}

export function updateMatch(id, patch) {
  const data = loadData();
  data.matches = data.matches.map((m) =>
    m.id === id ? { ...m, ...patch } : m
  );
  saveData(data);
}

export function deleteMatch(id) {
  const data = loadData();
  data.matches = data.matches.filter((m) => m.id !== id);
  saveData(data);
}

// ----- שאלות פתוחות (עריכה ע"י מנהלת) -----
export function updateOpenQuestions(questions) {
  const data = loadData();
  data.openQuestions = questions;
  saveData(data);
}

// ----- מצב התחברות (מקומי) -----
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
