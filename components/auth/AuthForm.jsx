"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, User as UserIcon } from "lucide-react";
import { useAuth } from "@/lib/supabase/AuthProvider";

export default function AuthForm({ mode }) {
  const isSignup = mode === "signup";
  const router = useRouter();
  const { supabase } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [signupDone, setSignupDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (isSignup) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      setLoading(false);
      if (error) return setError(error.message);
      setSignupDone(true);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setError("אימייל או סיסמה שגויים");
    router.push("/profiles");
    router.refresh();
  };

  const googleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  if (signupDone) {
    return (
      <div className="card flex flex-col items-center gap-3 p-8 text-center">
        <p className="text-lg font-bold text-ink">נרשמת בהצלחה</p>
        <p className="text-sm text-muted">
          נשלח אלייך מייל אימות ל-{email}. אחרי אישור המייל אפשר להתחבר.
        </p>
        <Link href="/login" className="btn-pink w-full">
          מעבר להתחברות
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card flex flex-col gap-4 p-6">
      <h1 className="text-center text-lg font-bold text-ink">
        {isSignup ? "הרשמה למאגר" : "התחברות"}
      </h1>

      {isSignup && (
        <Field icon={UserIcon} type="text" placeholder="שם מלא" value={fullName} onChange={setFullName} required />
      )}
      <Field icon={Mail} type="email" placeholder="אימייל" value={email} onChange={setEmail} required />
      <Field
        icon={Lock}
        type="password"
        placeholder="סיסמה"
        value={password}
        onChange={setPassword}
        required
        minLength={6}
      />

      {error && <p className="text-center text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={loading} className="btn-pink w-full">
        {loading ? "רגע..." : isSignup ? "הרשמה" : "התחברות"}
      </button>

      <button
        type="button"
        onClick={googleLogin}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white py-3 text-sm font-semibold text-ink transition active:scale-95"
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] font-bold text-blue-500 shadow">
          G
        </span>
        המשך עם גוגל
      </button>

      <Link href={isSignup ? "/login" : "/signup"} className="text-center text-xs font-medium text-muted">
        {isSignup ? "כבר יש לי חשבון - להתחברות" : "עדיין אין לי חשבון - להרשמה"}
      </Link>
    </form>
  );
}

function Field({ icon: Icon, value, onChange, ...props }) {
  return (
    <div className="relative">
      <Icon size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
      <input
        {...props}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-black/10 bg-white py-3 pr-9 pl-3 text-sm outline-none focus:border-pink-400"
      />
    </div>
  );
}
