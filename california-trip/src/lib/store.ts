"use client";

import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocFromServer, onSnapshot, query, setDoc, updateDoc, where,
} from "firebase/firestore";
import { fb } from "./firebase";
import { TRIP_ID } from "./types";

export type Row = { id: string } & Record<string, unknown>;
export type Data = Record<string, unknown>;

/** שכבת נתונים אחת לכל האפליקציה — אותו ממשק במצב אמיתי (Firestore) ובמצב תצוגה. */
export type Store = {
  listen: (col: string, cb: (rows: Row[]) => void, filter?: [string, unknown]) => () => void;
  get: (col: string, id: string) => Promise<Row | null>;
  add: (col: string, data: Data) => Promise<string>;
  set: (col: string, id: string, data: Data) => Promise<void>;
  update: (col: string, id: string, patch: Data) => Promise<void>;
  remove: (col: string, id: string) => Promise<void>;
  listenTrip: (cb: (data: Data) => void) => () => void;
  updateTrip: (patch: Data) => Promise<void>;
  /** קריאה ישירה מהשרת (לא מהזיכרון המקומי) — כדי לוודא ששמירה באמת הגיעה לענן */
  readTripFromServer: () => Promise<Data | null>;
  /** האם הנתונים נשמרים בענן (Firebase) או רק בדפדפן (תצוגה מקדימה) */
  cloud: boolean;
};

export function firebaseStore(): Store {
  const tripRef = () => doc(fb.db(), "trips", TRIP_ID);
  const col = (c: string) => collection(tripRef(), c);
  return {
    listen(c, cb, filter) {
      const q = filter ? query(col(c), where(filter[0], "==", filter[1])) : col(c);
      return onSnapshot(
        q,
        (qs) => cb(qs.docs.map((d) => ({ id: d.id, ...d.data() }))),
        () => cb([]),
      );
    },
    async get(c, id) {
      const s = await getDoc(doc(col(c), id));
      return s.exists() ? { id: s.id, ...s.data() } : null;
    },
    async add(c, data) {
      const r = await addDoc(col(c), { ...data, createdAt: Date.now() });
      return r.id;
    },
    async set(c, id, data) {
      await setDoc(doc(col(c), id), data, { merge: true });
    },
    async update(c, id, patch) {
      await updateDoc(doc(col(c), id), patch);
    },
    async remove(c, id) {
      await deleteDoc(doc(col(c), id));
    },
    listenTrip(cb) {
      return onSnapshot(tripRef(), (s) => cb(s.data() ?? {}), () => cb({}));
    },
    async updateTrip(patch) {
      await updateDoc(tripRef(), patch);
    },
    async readTripFromServer() {
      const snap = await getDocFromServer(tripRef());
      return snap.exists() ? snap.data() : null;
    },
    cloud: true,
  };
}

/** מצב תצוגה: נשמר רק בדפדפן הזה. */
export function demoStore(seed: Record<string, Row[]>, seedTrip: Data): Store {
  const KEY = "ct-demo-v2";
  let db: Record<string, Row[]> = seed;
  let trip: Data = seedTrip;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      db = saved.db ?? db;
      trip = saved.trip ?? trip;
    }
  } catch { /* אין אחסון — זה בסדר */ }
  const subs = new Set<() => void>();
  const save = () => {
    try { localStorage.setItem(KEY, JSON.stringify({ db, trip })); } catch { /* מלא או חסום */ }
    subs.forEach((f) => f());
  };
  const rows = (c: string) => (db[c] ??= []);
  const id = () => Math.random().toString(36).slice(2, 10);
  return {
    listen(c, cb, filter) {
      const run = () => cb(rows(c).filter((r) => !filter || r[filter[0]] === filter[1]).map((r) => ({ ...r })));
      subs.add(run);
      run();
      return () => { subs.delete(run); };
    },
    async get(c, i) { return rows(c).find((r) => r.id === i) ?? null; },
    async add(c, data) { const n = id(); rows(c).push({ ...data, id: n, createdAt: Date.now() }); save(); return n; },
    async set(c, i, data) {
      const list = rows(c);
      const at = list.findIndex((r) => r.id === i);
      if (at >= 0) list[at] = { ...list[at], ...data }; else list.push({ ...data, id: i });
      save();
    },
    async update(c, i, patch) { db[c] = rows(c).map((r) => (r.id === i ? { ...r, ...patch } : r)); save(); },
    async remove(c, i) { db[c] = rows(c).filter((r) => r.id !== i); save(); },
    listenTrip(cb) { const run = () => cb({ ...trip }); subs.add(run); run(); return () => { subs.delete(run); }; },
    async updateTrip(patch) { trip = { ...trip, ...patch }; save(); },
    async readTripFromServer() { return { ...trip }; },
    cloud: false,
  };
}
