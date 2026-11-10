"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from "firebase/auth";
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider, firebaseReady } from "@/lib/firebase";

// תפקידים: pending (ממתין לאישור) | ambassador (שגרירה) | staff (צוות) | admin (הנהלה)
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    let unsubProfile = () => {};
    const unsubAuth = onAuthStateChanged(auth, async (fbUser) => {
      unsubProfile();
      setUser(fbUser);
      if (!fbUser) {
        setProfile(null);
        setLoading(false);
        return;
      }
      const ref = doc(db, "users", fbUser.uid);
      try {
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          // משתמש חדש נכנס בפעם הראשונה – נוצר עם תפקיד "ממתין"
          await setDoc(ref, {
            name: fbUser.displayName || "",
            email: fbUser.email || "",
            photo: fbUser.photoURL || "",
            role: "pending",
            createdAt: serverTimestamp(),
          });
        }
      } catch (e) {
        console.error("profile init failed", e);
      }
      // האזנה חיה – כשמנהלת משנה תפקיד, המסך מתעדכן מיד
      unsubProfile = onSnapshot(ref, (s) => {
        setProfile(s.exists() ? { id: s.id, ...s.data() } : null);
        setLoading(false);
      });
    });
    return () => {
      unsubAuth();
      unsubProfile();
    };
  }, []);

  const loginWithGoogle = async () => {
    if (!auth) throw new Error("firebase-not-configured");
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      // אם הדפדפן חוסם חלון קופץ – עוברים להתחברות בהפניה
      if (e?.code === "auth/popup-blocked" || e?.code === "auth/operation-not-supported-in-this-environment") {
        await signInWithRedirect(auth, googleProvider);
      } else if (e?.code !== "auth/popup-closed-by-user" && e?.code !== "auth/cancelled-popup-request") {
        throw e;
      }
    }
  };

  const logout = () => (auth ? signOut(auth) : null);

  return (
    <AuthContext.Provider value={{ user, profile, loading, loginWithGoogle, logout, firebaseReady }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
