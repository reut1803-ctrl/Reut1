"use client";

import { useAuth } from "@/lib/auth";

export default function DeniedCard({ error }: { error?: boolean }) {
  const { user, signOut } = useAuth();
  return (
    <section className="card" aria-labelledby="denied-title">
      <h1 id="denied-title" className="title">{error ? "משהו השתבש" : "עוד לא הוזמנת"}</h1>
      <p className="lead">
        {error
          ? "לא הצלחנו לטעון את הטיול. בדקו את החיבור לאינטרנט ונסו שוב."
          : `החשבון ${user?.email ?? ""} עדיין לא ברשימת המטיילים. מי שפתח/ה את הטיול יכול/ה להוסיף אותו.`}
      </p>
      <button className="btn btn-soft" onClick={signOut}>כניסה עם חשבון אחר</button>
    </section>
  );
}
