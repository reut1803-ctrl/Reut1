"use client";

import { useEffect, useState } from "react";
import type { Store } from "./store";

// שמירה אוטומטית עם חיווי: כל כתיבה למסד נספרת, וכך יודעים להציג "שומר…" / "נשמר ✓" / "אין קליטה".

type State = { pending: number; lastSaved: number | null; failed: boolean };
let state: State = { pending: 0, lastSaved: null, failed: false };
const subs = new Set<(s: State) => void>();
const emit = () => subs.forEach((f) => f(state));

function track<T>(p: Promise<T>): Promise<T> {
  state = { ...state, pending: state.pending + 1, failed: false };
  emit();
  return p.then(
    (v) => { state = { pending: state.pending - 1, lastSaved: Date.now(), failed: false }; emit(); return v; },
    (e) => { state = { ...state, pending: state.pending - 1, failed: true }; emit(); throw e; },
  );
}

/** עוטף את שכבת הנתונים כך שכל שמירה מדווחת לחיווי */
export function withSaveTracking(store: Store): Store {
  return {
    ...store,
    add: (c, d) => track(store.add(c, d)),
    set: (c, i, d) => track(store.set(c, i, d)),
    update: (c, i, p) => track(store.update(c, i, p)),
    remove: (c, i) => track(store.remove(c, i)),
    updateTrip: (p) => track(store.updateTrip(p)),
    readTripFromServer: () => store.readTripFromServer(),
    cloud: store.cloud,
  };
}

export function useSaveStatus() {
  const [s, setS] = useState<State>(state);
  const [online, setOnline] = useState(true);
  useEffect(() => {
    subs.add(setS);
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { subs.delete(setS); window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);
  return { ...s, online };
}
