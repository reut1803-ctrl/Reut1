"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import LuxeBackground from "@/components/LuxeBackground";
import HouseMark from "@/components/HouseMark";

const ROLE_LABELS = {
  pending: "ממתינה לשיוך תפקיד",
  ambassador: "שגרירה",
  staff: "צוות",
  admin: "הנהלה",
};

export default function DashboardPage() {
  const { user, profile, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [user, loading, router]);

  if (loading || !profile) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <LuxeBackground />
        <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 1.6 }}>
          <HouseMark size={56} />
        </motion.div>
      </main>
    );
  }

  const firstName = (profile.name || "").split(" ")[0];

  return (
    <main className="relative min-h-screen px-4 py-8 sm:px-8">
      <LuxeBackground />

      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="glass mx-auto flex max-w-5xl items-center justify-between rounded-full px-5 py-3"
      >
        <div className="flex items-center gap-3">
          <HouseMark size={34} />
          <span className="font-display text-xl font-bold text-bordeaux">יש לך בית</span>
        </div>
        <div className="flex items-center gap-3">
          {profile.photo && <img src={profile.photo} alt="" className="h-9 w-9 rounded-full ring-2 ring-gold/60" referrerPolicy="no-referrer" />}
          <button onClick={logout} className="rounded-full px-4 py-2 text-sm text-ink-soft transition hover:bg-white/70 hover:text-bordeaux">
            יציאה
          </button>
        </div>
      </motion.header>

      <motion.section
        initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="glass mx-auto mt-16 max-w-2xl rounded-[2.5rem] p-10 text-center sm:p-14"
      >
        <h1 className="font-display text-4xl font-bold text-shimmer sm:text-5xl">שלום, {firstName}</h1>
        <div className="gold-line mx-auto my-6" />
        <p className="text-lg text-ink-soft">התפקיד שלך במערכת:</p>
        <motion.span
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.7, type: "spring", stiffness: 200 }}
          className="mt-4 inline-block rounded-full bg-gradient-to-l from-gold to-gold-dark px-6 py-2 text-lg font-medium text-white shadow-glow"
        >
          {ROLE_LABELS[profile.role] || profile.role}
        </motion.span>
        {profile.role === "pending" && (
          <p className="mt-8 leading-relaxed text-ink-soft">
            החשבון נוצר בהצלחה 🌸
            <br />
            ההנהלה תשייך לך תפקיד בקרוב, והמסכים שלך ייפתחו כאן אוטומטית.
          </p>
        )}
      </motion.section>
    </main>
  );
}
