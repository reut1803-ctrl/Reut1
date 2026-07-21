"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createClient } from "./client";

const AuthContext = createContext(null);

const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export function AuthProvider({ children }) {
  if (!isSupabaseConfigured) return <SupabaseNotConfigured />;
  return <AuthProviderInner>{children}</AuthProviderInner>;
}

function SupabaseNotConfigured() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-lg font-bold text-ink">חסר חיבור למסד הנתונים</p>
      <p className="text-sm leading-relaxed text-muted">
        צריך להגדיר את משתני הסביבה NEXT_PUBLIC_SUPABASE_URL ו-NEXT_PUBLIC_SUPABASE_ANON_KEY
        (בקובץ .env.local בפיתוח, ובהגדרות הפרויקט ב-Vercel בייצור).
      </p>
    </div>
  );
}

function AuthProviderInner({ children }) {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(
    async (currentUser) => {
      if (!currentUser) {
        setProfile(null);
        return;
      }
      const { data } = await supabase.from("profiles").select("*").eq("id", currentUser.id).single();
      setProfile(data);
    },
    [supabase]
  );

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUser(user);
      await loadProfile(user);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      await loadProfile(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase, loadProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, [supabase]);

  const refreshProfile = useCallback(() => loadProfile(user), [loadProfile, user]);

  return (
    <AuthContext.Provider value={{ supabase, user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
