"use client";

import { useAuth } from "@/lib/auth";

export default function DeniedCard({ error }: { error?: boolean }) {
  const { user, signOut } = useAuth();
  return (
    <section className="gate-card glass" aria-labelledby="denied-title">
      <h1 id="denied-title" className="gate-title gate-title--sm">{error ? "משהו השתבש" : "עוד לא הוזמנת"}</h1>
      <p className="gate-lede">
        {error
          ? "לא הצלחנו לטעון את הטיול. בדקו את החיבור לאינטרנט ונסו שוב."
          : `החשבון ${user?.email ?? ""} עדיין לא ברשימת המטיילים. מי שפתח/ה את הטיול יכול/ה להוסיף אותו.`}
      </p>
      <button className="pill-btn" onClick={signOut}>כניסה עם חשבון אחר</button>
    </section>
  );
}
