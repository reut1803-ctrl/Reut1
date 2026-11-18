"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "./auth";
import { useTrip, type TripApi } from "./trip";
import { demoStore, firebaseStore, type Row, type Store } from "./store";
import { addDays, caNow } from "./time";

export type TripDoc = {
  title?: string;
  startDate?: string | null;
  endDate?: string | null;
  dailyBudget?: number | null;
  flagsContent?: Record<string, string>;
};

type Ctx = { trip: TripApi; store: Store; tripDoc: TripDoc };
const TripCtx = createContext<Ctx | null>(null);

function demoSeed() {
  const today = caNow().date;
  const ex = "דוגמה · ";
  return {
    trip: { title: "הטיול שלנו לקליפורניה", startDate: today, endDate: addDays(today, 9), dailyBudget: 150 },
    rows: {
      activities: [
        { id: "a1", date: today, time: "09:30", title: `${ex}ארוחת בוקר`, address: "", status: "done", reminder: 0 },
        { id: "a2", date: today, time: "16:00", title: `${ex}שקיעה על גשר הזהב`, address: "Golden Gate Bridge Welcome Center", lat: 37.8077, lng: -122.475, status: "planned", reminder: 30 },
        { id: "a3", date: addDays(today, 1), time: "11:00", title: `${ex}מזח 39`, address: "Pier 39, San Francisco", lat: 37.8087, lng: -122.4098, status: "planned", reminder: 60 },
      ],
      days: [{ id: today, lodging: `${ex}אכסניה בסן פרנסיסקו`, lodgingAddress: "San Francisco" }],
      packing: [
        { id: "p1", label: "דרכונים", category: "מסמכים", checked: true },
        { id: "p2", label: "מטען לטלפון", category: "חשמל", checked: false },
        { id: "p3", label: "מעיל — בסן פרנסיסקו קריר בערב", category: "בגדים", checked: false },
        { id: "p4", label: "נרות שבת", category: "שבת", checked: false },
      ],
      expenses: [
        { id: "e1", date: today, amount: 18, category: "אוכל", note: `${ex}קפה ומאפה` },
        { id: "e2", date: today, amount: 42, category: "תחבורה", note: `${ex}דלק` },
      ],
      places: [
        { id: "pl1", name: `${ex}גשר הזהב`, category: "attraction", lat: 37.8199, lng: -122.4783, address: "Golden Gate Bridge" },
        { id: "pl2", name: `${ex}אכסניה א׳`, category: "lodging", lat: 37.7599, lng: -122.4148, address: "Mission District", price: 48 },
        { id: "pl3", name: `${ex}אכסניה ב׳`, category: "lodging", lat: 37.808, lng: -122.4177, address: "Fisherman's Wharf", price: 65 },
      ],
    } as Record<string, Row[]>,
  };
}

export function TripProvider({ children }: { children: ReactNode }) {
  const { user, demo } = useAuth();
  const trip = useTrip(user, demo);
  const store = useMemo(() => {
    if (!demo) return firebaseStore();
    const s = demoSeed();
    return demoStore(s.rows, s.trip);
  }, [demo]);
  const [tripDoc, setTripDoc] = useState<TripDoc>({});

  useEffect(() => {
    if (trip.state !== "member") return;
    return store.listenTrip((d) => setTripDoc(d as TripDoc));
  }, [trip.state, store]);

  const value = useMemo(() => ({ trip, store, tripDoc }), [trip, store, tripDoc]);
  return <TripCtx.Provider value={value}>{children}</TripCtx.Provider>;
}

export function useTripCtx(): Ctx {
  const c = useContext(TripCtx);
  if (!c) throw new Error("useTripCtx must be inside TripProvider");
  return c;
}

/** רשימה חיה מאוסף בתוך הטיול. null = עוד נטען. */
export function useRows<T>(col: string, filter?: [string, unknown]): T[] | null {
  const { store, trip } = useTripCtx();
  const [rows, setRows] = useState<T[] | null>(null);
  const fKey = filter ? `${filter[0]}=${String(filter[1])}` : "";
  useEffect(() => {
    if (trip.state !== "member") return;
    setRows(null);
    return store.listen(col, (r) => setRows(r as unknown as T[]), filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [col, fKey, store, trip.state]);
  return rows;
}

/** היום הנוכחי בטיול (בשעון קליפורניה), או היום הראשון אם עוד לא יצאנו */
export function useTripToday(tripDoc: TripDoc): string {
  const today = caNow().date;
  if (tripDoc.startDate && today < tripDoc.startDate) return tripDoc.startDate;
  if (tripDoc.endDate && today > tripDoc.endDate) return tripDoc.endDate;
  return today;
}
