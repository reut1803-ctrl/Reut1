"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ScanText, Home, UserCog, Users2, ArrowLeft, Hourglass } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import AppShell from "@/components/AppShell";

const ROLE_LABELS = { pending: "ממתינה לשיוך תפקיד", ambassador: "שגרירה", staff: "צוות", admin: "הנהלה" };

const TILES = {
  admin: [
    { href: "/admin/extract", icon: ScanText, title: "חילוץ משפחות חכם", text: "העלאת צילומי דפי קשר. ה-AI מחלץ את הרשימה השמית, מחשב גילאים ומשגר לכל אשת צוות את המשפחות שלה." },
    { href: "/admin/families", icon: Home, title: "מאגר המשפחות", text: "כל המשפחות מכל השכונות, לפי אשת צוות אחראית, כולל משפחות שעדיין לא שויכו." },
    { href: "/admin/users", icon: UserCog, title: "משתמשות ותפקידים", text: "שיוך תפקיד לכל מי שנכנסה למערכת, וצפייה בטריטוריות של הצוות." },
  ],
  staff: [
    { href: "/staff/families", icon: Users2, title: "המשפחות שלי", text: "המשפחות שבטריטוריה שלך, עדכון סטטוס, פנייה מהירה והפצת אירועים." },
  ],
};

const list = { hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: 0.35 } } };
const item = {
  hidden: { opacity: 0, y: 30, filter: "blur(8px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
};

export default function DashboardPage() {
  return (
    <AppShell>
      <Hub />
    </AppShell>
  );
}

function Hub() {
  const { profile } = useAuth();
  const firstName = (profile.name || "").split(" ")[0];
  const tiles = TILES[profile.role] || [];

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        className="mb-10 text-center"
      >
        <p className="eyebrow mb-3">יש לך בית · יצהר</p>
        <h1 className="font-display text-5xl font-bold text-shimmer sm:text-6xl">שלום, {firstName}</h1>
        <div className="gold-line mx-auto my-5" />
        <motion.span
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
          className="inline-block rounded-full bg-gradient-to-l from-gold to-gold-dark px-5 py-1.5 text-sm font-medium text-white shadow-glow"
        >
          {ROLE_LABELS[profile.role] || profile.role}
        </motion.span>
      </motion.section>

      {profile.role === "pending" && (
        <motion.div variants={item} initial="hidden" animate="show" className="card mx-auto max-w-xl text-center">
          <Hourglass className="mx-auto mb-3 text-gold-dark" size={28} strokeWidth={1.5} />
          <p className="leading-relaxed text-ink-soft">
            החשבון נוצר בהצלחה.
            <br />
            ההנהלה תשייך לך תפקיד בקרוב, והמסכים שלך ייפתחו כאן אוטומטית.
          </p>
        </motion.div>
      )}

      <motion.div variants={list} initial="hidden" animate="show" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map(({ href, icon: Icon, title, text }) => (
          <motion.div key={href} variants={item} whileHover={{ y: -6 }} transition={{ type: "spring", stiffness: 300, damping: 22 }}>
            <Link href={href} className="card group flex h-full flex-col">
              <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-light to-gold text-bordeaux shadow-glow">
                <Icon size={24} strokeWidth={1.6} />
              </span>
              <h2 className="font-display text-2xl font-bold text-bordeaux">{title}</h2>
              <p className="mt-2 flex-1 leading-relaxed text-ink-soft">{text}</p>
              <span className="mt-5 flex items-center gap-1.5 text-sm font-medium text-gold-dark transition group-hover:gap-3">
                כניסה <ArrowLeft size={16} strokeWidth={1.8} />
              </span>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </>
  );
}
