"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Timestamp,
} from "firebase/firestore";
import { fb } from "./firebase";
import { blobToDataUrl, squareFace } from "./image";
import { TRIP_ID, TRIP_TIMEZONE, type AppUser, type Member } from "./types";

export type TripState = "loading" | "member" | "denied" | "error";

export type TripApi = {
  state: TripState;
  members: Member[];
  isOwner: boolean;
  invite: (email: string) => Promise<void>;
  uploadFace: (file: File, memberUid: string) => Promise<void>;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// בתצוגה המקדימה הפרטית אפשר להזריק תמונות פנים מראש (הן לא נשמרות בקוד).
function demoFace(uid: string): string | null {
  if (typeof window === "undefined") return null;
  const faces = (window as unknown as { __ctDemoFaces?: Record<string, string> }).__ctDemoFaces;
  return faces?.[uid] ?? null;
}

/** מצב תצוגה: הכול נשמר בזיכרון של הדפדפן בלבד. */
function useDemoTrip(user: AppUser | null): TripApi {
  const [members, setMembers] = useState<Member[]>([]);
  useEffect(() => {
    if (!user) return;
    setMembers([
      { uid: user.uid, name: user.name, email: user.email, avatarUrl: demoFace(user.uid), joinedAt: 1 },
      { uid: "demo-zecharia", name: "זכריה", email: "", avatarUrl: demoFace("demo-zecharia"), joinedAt: 2 },
    ]);
  }, [user]);

  return {
    state: user ? "member" : "loading",
    members,
    isOwner: true,
    invite: async () => {},
    uploadFace: async (file, memberUid) => {
      const blob = await squareFace(file);
      const url = URL.createObjectURL(blob);
      setMembers((ms) => ms.map((m) => (m.uid === memberUid ? { ...m, avatarUrl: url } : m)));
    },
  };
}

/** מצב אמיתי: הטיול ותמונות הפנים נשמרים ב-Firestore. */
function useFirebaseTrip(user: AppUser | null): TripApi {
  const [state, setState] = useState<TripState>("loading");
  const [members, setMembers] = useState<Member[]>([]);
  const [ownerUid, setOwnerUid] = useState<string | null>(null);
  const userRef = useRef(user);
  userRef.current = user;

  useEffect(() => {
    if (!user) return;
    let unsub: (() => void) | undefined;
    let cancelled = false;
    const db = fb.db();
    const tripRef = doc(db, "trips", TRIP_ID);

    (async () => {
      setState("loading");
      try {
        const snap = await getDoc(tripRef);
        let owner: string;
        if (!snap.exists()) {
          // הכניסה הראשונה אי פעם: מי שנכנס/ה ראשון/ה פותח/ת את הטיול.
          owner = user.uid;
          await setDoc(tripRef, {
            title: "הטיול שלנו לקליפורניה",
            ownerUid: user.uid,
            memberEmails: [user.email],
            timezone: TRIP_TIMEZONE,
            startDate: null,
            endDate: null,
            dailyBudget: null,
            currency: "USD",
            createdAt: serverTimestamp(),
          });
        } else {
          const data = snap.data();
          const emails: string[] = data.memberEmails ?? [];
          if (!emails.includes(user.email)) {
            if (!cancelled) setState("denied");
            return;
          }
          owner = data.ownerUid;
        }
        if (cancelled) return;
        setOwnerUid(owner);

        const meRef = doc(tripRef, "members", user.uid);
        const meSnap = await getDoc(meRef);
        if (!meSnap.exists()) {
          await setDoc(meRef, {
            name: user.name,
            email: user.email,
            avatarUrl: null,
            joinedAt: serverTimestamp(),
          });
        }
        if (cancelled) return;

        unsub = onSnapshot(collection(tripRef, "members"), (qs) => {
          const list: Member[] = qs.docs.map((d) => {
            const v = d.data();
            const ts = v.joinedAt as Timestamp | null;
            return {
              uid: d.id,
              name: v.name ?? "",
              email: v.email ?? "",
              avatarUrl: v.avatarUrl ?? null,
              joinedAt: ts?.toMillis?.() ?? Date.now(),
            };
          });
          list.sort((a, b) => a.joinedAt - b.joinedAt);
          setMembers(list);
          setState("member");
        });
      } catch (e) {
        const code = (e as { code?: string }).code;
        if (!cancelled) setState(code === "permission-denied" ? "denied" : "error");
      }
    })();

    return () => {
      cancelled = true;
      unsub?.();
    };
  }, [user]);

  const invite = useCallback(async (raw: string) => {
    const email = raw.trim().toLowerCase();
    if (!EMAIL_RE.test(email)) throw new Error("כתובת המייל לא נראית תקינה");
    await updateDoc(doc(fb.db(), "trips", TRIP_ID), { memberEmails: arrayUnion(email) });
  }, []);

  // כל אחד מאיתנו יכול להעלות תמונה גם בשביל השני.
  const uploadFace = useCallback(async (file: File, memberUid: string) => {
    // תמונת פנים קטנה (בערך 20KB) נשמרת ישירות במסד הנתונים — בלי צורך בשירות אחסון בתשלום.
    const blob = await squareFace(file, 256);
    const url = await blobToDataUrl(blob);
    await updateDoc(doc(fb.db(), "trips", TRIP_ID, "members", memberUid), { avatarUrl: url });
  }, []);


  return { state, members, isOwner: !!user && ownerUid === user.uid, invite, uploadFace };
}

export function useTrip(user: AppUser | null, demo: boolean): TripApi {
  // demo לא משתנה במהלך חיי הדף, ולכן סדר ה-hooks נשאר קבוע.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return demo ? useDemoTrip(user) : useFirebaseTrip(user);
}
