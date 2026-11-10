"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPinned, RotateCcw } from "lucide-react";
import AppShell, { PageTitle } from "@/components/AppShell";
import { useAuth } from "@/context/AuthContext";
import { loadAllUsers, setRole, resetTerritory } from "@/lib/familiesStore";

const ROLES = [
  ["pending", "ממתינה"],
  ["ambassador", "שגרירה"],
  ["staff", "צוות"],
  ["admin", "הנהלה"],
];

export default function UsersPage() {
  return (
    <AppShell roles={["admin"]}>
      <Users />
    </AppShell>
  );
}

function Users() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [busy, setBusy] = useState("");

  const reload = () => loadAllUsers().then(setUsers).catch(console.error);
  useEffect(() => {
    reload();
  }, []);

  const act = async (id, fn) => {
    setBusy(id);
    try {
      await fn();
      await reload();
    } catch (e) {
      console.error(e);
    } finally {
      setBusy("");
    }
  };

  const sorted = [...users].sort((a, b) => (a.role === "pending" ? -1 : 0) - (b.role === "pending" ? -1 : 0));

  return (
    <>
      <PageTitle eyebrow="הנהלה" title="משתמשות ותפקידים">
        כל מי שנכנסה עם Google מופיעה כאן. משייכים תפקיד, והמסכים שלה נפתחים מיד.
      </PageTitle>
      <div className="grid gap-4 md:grid-cols-2">
        {sorted.map((u, i) => (
          <motion.div key={u.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.6 }} className="card">
            <div className="flex items-center gap-3">
              {u.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={u.photo} alt="" className="h-11 w-11 rounded-full ring-2 ring-gold/50" referrerPolicy="no-referrer" />
              ) : (
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-sand font-display text-lg text-bordeaux">{(u.name || "?")[0]}</span>
              )}
              <div className="min-w-0">
                <p className="truncate font-medium text-ink">{u.name || "ללא שם"}</p>
                <p className="truncate text-xs text-ink-soft" dir="ltr">{u.email}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-1 rounded-full bg-sand p-1">
              {ROLES.map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  disabled={busy === u.id || (u.id === user.uid && key !== "admin")}
                  onClick={() => act(u.id, () => setRole(u.id, key))}
                  className={`flex-1 rounded-full px-2 py-1.5 text-xs transition ${u.role === key ? "bg-white text-bordeaux shadow-glow" : "text-ink-soft hover:text-bordeaux"} disabled:opacity-50`}
                >
                  {label}
                </button>
              ))}
            </div>
            {u.role === "staff" && (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-soft">
                <MapPinned size={13} />
                {u.territory ? [...(u.territory.families || []), ...(u.territory.streets || [])].join(" · ") : "טרם הגדירה אזור אחריות"}
                {u.territory && (
                  <button type="button" className="ms-auto flex items-center gap-1 text-rose-dark hover:underline" disabled={busy === u.id} onClick={() => act(u.id, () => resetTerritory(u.id))}>
                    <RotateCcw size={12} /> איפוס אזור
                  </button>
                )}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </>
  );
}
