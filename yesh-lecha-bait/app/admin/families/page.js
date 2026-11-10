"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import AppShell, { PageTitle } from "@/components/AppShell";
import FamilyCard from "@/components/FamilyCard";
import { useFamilyFilter, FilterBar } from "@/components/FamilyFilters";
import { watchAllFamilies, loadAllUsers, setFamilyStatus } from "@/lib/familiesStore";

export default function AdminFamiliesPage() {
  return (
    <AppShell roles={["admin"]}>
      <AllFamilies />
    </AppShell>
  );
}

function AllFamilies() {
  const [families, setFamilies] = useState([]);
  const [users, setUsers] = useState([]);
  const [owner, setOwner] = useState("all");
  const [error, setError] = useState("");

  useEffect(() => {
    loadAllUsers().then(setUsers).catch(console.error);
    return watchAllFamilies(setFamilies, (e) => {
      console.error(e);
      setError("לא הצלחתי לטעון את המאגר.");
    });
  }, []);

  const staff = users.filter((u) => u.role === "staff");
  const nameOf = (id) => (users.find((u) => u.id === id)?.name || "").split(" ")[0] || "צוות";
  const byOwner = useMemo(
    () =>
      owner === "all"
        ? families
        : owner === "none"
          ? families.filter((f) => !(f.assignedTo || []).length)
          : families.filter((f) => (f.assignedTo || []).includes(owner)),
    [families, owner]
  );
  const flt = useFamilyFilter(byOwner);

  return (
    <>
      <PageTitle eyebrow="חשיפה מלאה · הנהלה" title="מאגר המשפחות">
        כל המשפחות מכל השכונות. אפשר לסנן לפי אשת צוות, או לראות מי עדיין לא שויכה לאף אחת.
      </PageTitle>

      <div className="mb-4 flex flex-wrap gap-2">
        {[["all", "כל הצוות"], ...staff.map((s) => [s.id, s.name]), ["none", "ללא שיוך"]].map(([id, label]) => (
          <button key={id} type="button" onClick={() => setOwner(id)} className={`rounded-full px-4 py-1.5 text-sm transition ${owner === id ? "bg-gradient-to-l from-bordeaux to-rose-dark text-cream shadow-glow" : "bg-white/60 text-ink-soft hover:bg-white"}`}>
            {label}
          </button>
        ))}
      </div>

      <FilterBar {...flt} />
      {error && <p className="mb-4 text-sm text-rose-dark">{error}</p>}
      {families.length === 0 && !error && <div className="card text-center text-ink-soft">המאגר עדיין ריק. מתחילים במסך חילוץ המשפחות.</div>}

      <motion.div layout className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <AnimatePresence>
          {flt.shown.map((f) => (
            <FamilyCard key={f.id} family={f} assigneeNames={(f.assignedTo || []).map(nameOf)} onStatus={(s) => setFamilyStatus(f.id, s).catch(console.error)} />
          ))}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
