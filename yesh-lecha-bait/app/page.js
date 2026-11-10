"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import LuxeBackground from "@/components/LuxeBackground";
import HouseMark from "@/components/HouseMark";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15, delayChildren: 0.2 } },
};
const item = {
  hidden: { opacity: 0, y: 30, filter: "blur(8px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } },
};

export default function LoginPage() {
  const { user, loading, loginWithGoogle, firebaseReady } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [user, loading, router]);

  const handleLogin = async () => {
    setError("");
    setBusy(true);
    try {
      await loginWithGoogle();
    } catch (e) {
      setError("ההתחברות לא הצליחה. נסי שוב בעוד רגע.");
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 py-12">
      <LuxeBackground />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="glass relative w-full max-w-md rounded-[2.5rem] px-8 py-12 text-center sm:px-12"
      >
        <motion.div variants={item} className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-white/70 shadow-glow">
          <HouseMark size={64} />
        </motion.div>

        <motion.p variants={item} className="mb-3 text-sm tracking-[0.35em] text-gold-dark">
          מיזם · יצהר
        </motion.p>

        <motion.h1 variants={item} className="font-display text-5xl font-bold leading-tight text-shimmer sm:text-6xl">
          יש לך בית
        </motion.h1>

        <motion.div variants={item} className="gold-line mx-auto my-6" />

        <motion.p variants={item} className="mb-10 text-lg leading-relaxed text-ink-soft">
          ברוכה הבאה למרחב של השגרירות, הצוות וההנהלה.
          <br />
          כניסה מאובטחת עם חשבון Google.
        </motion.p>

        <motion.div variants={item}>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleLogin}
            disabled={busy || loading || !firebaseReady}
            className="btn-luxe w-full"
          >
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-l from-transparent via-white/25 to-transparent transition-transform duration-700 hover:translate-x-full" />
            <GoogleIcon />
            {busy ? "מתחברת…" : "כניסה עם Google"}
          </motion.button>
        </motion.div>

        {!firebaseReady && (
          <motion.p variants={item} className="mt-5 text-sm text-gold-dark">
            המערכת בהקמה. הכניסה תיפתח בקרוב.
          </motion.p>
        )}

        {error && (
          <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="mt-5 text-sm text-rose-dark">
            {error}
          </motion.p>
        )}
      </motion.div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white">
      <svg width="18" height="18" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
        <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
        <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
        <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
      </svg>
    </span>
  );
}
