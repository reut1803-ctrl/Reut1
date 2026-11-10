"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutGrid, ScanText, Users2, Home, LogOut, UserCog } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import LuxeBackground from "@/components/LuxeBackground";
import HouseMark from "@/components/HouseMark";

const NAV = {
  admin: [
    { href: "/dashboard", label: "ראשי", icon: LayoutGrid },
    { href: "/admin/extract", label: "חילוץ משפחות", icon: ScanText },
    { href: "/admin/families", label: "כל המשפחות", icon: Home },
    { href: "/admin/users", label: "משתמשות", icon: UserCog },
  ],
  staff: [
    { href: "/dashboard", label: "ראשי", icon: LayoutGrid },
    { href: "/staff/families", label: "המשפחות שלי", icon: Users2 },
  ],
};

export function Loader() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <LuxeBackground />
      <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 1.6 }}>
        <HouseMark size={56} />
      </motion.div>
    </main>
  );
}

/**
 * מעטפת לכל מסך פנימי: בודקת התחברות ותפקיד, ומציגה כותרת וניווט.
 * roles: התפקידים שמותר להם לראות את המסך. מי שאינה מורשית חוזרת לראשי.
 */
export default function AppShell({ roles, children }) {
  const { user, profile, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const allowed = profile && (!roles || roles.includes(profile.role));

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/");
    else if (profile && !allowed) router.replace("/dashboard");
  }, [user, profile, loading, allowed, router]);

  if (loading || !profile || !allowed) return <Loader />;

  const links = NAV[profile.role] || [];

  return (
    <main className="relative min-h-screen px-4 pb-16 pt-6 sm:px-8">
      <LuxeBackground />
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="glass sticky top-4 z-40 mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-full px-4 py-2.5"
      >
        <Link href="/dashboard" className="flex shrink-0 items-center gap-2.5">
          <HouseMark size={32} />
          <span className="hidden font-display text-xl font-bold text-bordeaux sm:inline">יש לך בית</span>
        </Link>

        <nav className="flex min-w-0 items-center gap-1 overflow-x-auto">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href} className="relative shrink-0 rounded-full px-3 py-2 text-sm">
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-full bg-white shadow-glow"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <span className={`relative flex items-center gap-1.5 ${active ? "text-bordeaux" : "text-ink-soft hover:text-bordeaux"}`}>
                  <Icon size={16} strokeWidth={1.7} />
                  <span className="hidden md:inline">{label}</span>
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          {profile.photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.photo} alt="" className="h-8 w-8 rounded-full ring-2 ring-gold/60" referrerPolicy="no-referrer" />
          )}
          <button onClick={logout} aria-label="יציאה" className="rounded-full p-2 text-ink-soft transition hover:bg-white/70 hover:text-bordeaux">
            <LogOut size={17} strokeWidth={1.7} />
          </button>
        </div>
      </motion.header>

      <div className="mx-auto mt-10 max-w-6xl">{children}</div>
    </main>
  );
}

export function PageTitle({ eyebrow, title, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      className="mb-8"
    >
      {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
      <h1 className="font-display text-4xl font-bold text-shimmer sm:text-5xl">{title}</h1>
      <div className="gold-line my-4 !mx-0" />
      {children && <div className="max-w-2xl leading-relaxed text-ink-soft">{children}</div>}
    </motion.div>
  );
}
