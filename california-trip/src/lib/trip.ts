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
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { fb } from "./firebase";
import { squareFace } from "./image";
import { TRIP_ID, TRIP_TIMEZONE, type AppUser, type Look, type Member } from "./types";

export type TripState = "loading" | "member" | "denied" | "error";

export type TripApi = {
  state: TripState;
  members: Member[];
  isOwner: boolean;
  invite: (email: string) => Promise<void>;
  uploadFace: (file: File) => Promise<void>;
  setLook: (look: Look) => Promise<void>;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** מצב תצוגה: הכול נשמר בזיכרון של הדפדפן בלבד. */
function useDemoTrip(user: AppUser | null): TripApi {
  const [members, setMembers] = useState<Member[]>([]);
  useEffect(() => {
    if (!user) return;
    setMembers([
      { uid: user.uid, name: user.name, email: user.email, avatarUrl: null, look: "hat", joinedAt: 1 },
      { uid: "demo-zecharia", name: "זכריה", email: "", avatarUrl: null, look: "kippah", joinedAt: 2 },
    ]);
  }, [user]);

  const patchMe = useCallback(
    (patch: Partial<Member>) =>
      setMembers((ms) => ms.map((m) => (m.uid === user?.uid ? { ...m, ...patch } : m))),
    [user],
  );

  return {
    state: user ? "member" : "loading",
    members,
    isOwner: true,
    invite: async () => {},
    uploadFace: async (file) => {
      const blob = await squareFace(file);
      patchMe({ avatarUrl: URL.createObjectURL(blob) });
    },
    setLook: async (look) => patchMe({ look }),
  };
}

/** מצב אמיתי: הטיול נשמר ב-Firestore, ותמונות הפנים ב-Storage. */
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
            look: owner === user.uid ? "hat" : "kippah",
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
              look: v.look === "kippah" ? "kippah" : "hat",
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

  const uploadFace = useCallback(async (file: File) => {
    const u = userRef.current;
    if (!u) return;
    const blob = await squareFace(file);
    const r = ref(fb.storage(), `trips/${TRIP_ID}/avatars/${u.uid}.jpg`);
    await uploadBytes(r, blob, { contentType: "image/jpeg" });
    const url = await getDownloadURL(r);
    await updateDoc(doc(fb.db(), "trips", TRIP_ID, "members", u.uid), { avatarUrl: url });
  }, []);

  const setLook = useCallback(async (look: Look) => {
    const u = userRef.current;
    if (!u) return;
    await updateDoc(doc(fb.db(), "trips", TRIP_ID, "members", u.uid), { look });
  }, []);

  return { state, members, isOwner: !!user && ownerUid === user.uid, invite, uploadFace, setLook };
}

export function useTrip(user: AppUser | null, demo: boolean): TripApi {
  // demo לא משתנה במהלך חיי הדף, ולכן סדר ה-hooks נשאר קבוע.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return demo ? useDemoTrip(user) : useFirebaseTrip(user);
}
