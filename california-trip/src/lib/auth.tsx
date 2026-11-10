"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut as fbSignOut,
} from "firebase/auth";
import { fb } from "./firebase";
import { isFirebaseConfigured } from "./firebase-config";
import type { AppUser } from "./types";

type AuthStatus = "loading" | "signedOut" | "signedIn";

type AuthContextValue = {
  status: AuthStatus;
  user: AppUser | null;
  demo: boolean;
  busy: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const DEMO_USER: AppUser = {
  uid: "demo-reut",
  name: "רעות",
  email: "demo@example.com",
  photoURL: null,
};

function friendlyError(code: string): string | null {
  switch (code) {
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return null;
    case "auth/network-request-failed":
      return "אין חיבור לאינטרנט כרגע. נסו שוב בעוד רגע.";
    case "auth/unauthorized-domain":
      return "כתובת האתר עוד לא אושרה ב-Firebase. צריך להוסיף אותה ברשימת הדומיינים המורשים.";
    default:
      return "ההתחברות לא הצליחה. נסו שוב.";
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const demo = !isFirebaseConfigured;
  const [status, setStatus] = useState<AuthStatus>(demo ? "signedOut" : "loading");
  const [user, setUser] = useState<AppUser | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (demo) return;
    const auth = fb.auth();
    getRedirectResult(auth).catch((e: { code?: string }) => {
      setError(friendlyError(e.code ?? ""));
    });
    return onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser({
          uid: u.uid,
          name: u.displayName?.split(" ")[0] ?? "מטייל/ת",
          email: (u.email ?? "").toLowerCase(),
          photoURL: u.photoURL,
        });
        setStatus("signedIn");
      } else {
        setUser(null);
        setStatus("signedOut");
      }
    });
  }, [demo]);

  const signIn = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      if (demo) {
        await new Promise((r) => setTimeout(r, 700));
        setUser(DEMO_USER);
        setStatus("signedIn");
        return;
      }
      const auth = fb.auth();
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      try {
        await signInWithPopup(auth, provider);
      } catch (e) {
        const code = (e as { code?: string }).code ?? "";
        if (
          code === "auth/popup-blocked" ||
          code === "auth/operation-not-supported-in-this-environment"
        ) {
          await signInWithRedirect(auth, provider);
          return;
        }
        throw e;
      }
    } catch (e) {
      setError(friendlyError((e as { code?: string }).code ?? ""));
    } finally {
      setBusy(false);
    }
  }, [demo]);

  const signOut = useCallback(async () => {
    if (demo) {
      setUser(null);
      setStatus("signedOut");
      return;
    }
    await fbSignOut(fb.auth());
  }, [demo]);

  const value = useMemo(
    () => ({ status, user, demo, busy, error, signIn, signOut }),
    [status, user, demo, busy, error, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
