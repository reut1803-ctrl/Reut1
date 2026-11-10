"use client";

import GoogleIcon from "./GoogleIcon";
import { useAuth } from "@/lib/auth";

export default function LoginCard() {
  const { signIn, busy, error, demo } = useAuth();
  return (
    <section className="card" aria-labelledby="login-title">
      {demo && <span className="demo-pill">מצב תצוגה · Firebase עוד לא מחובר</span>}
      <p className="eyebrow">רעות וזכריה · המסע הגדול</p>
      <h1 id="login-title" className="title">
        קליפורניה <em>שלנו</em>
      </h1>
      <p className="lead">המסלול, המפה, הציוד והזיכרונות. הכול במקום אחד, בכיס.</p>
      <button className="btn-google" onClick={signIn} disabled={busy}>
        {busy ? <span className="spinner" /> : <GoogleIcon />}
        {busy ? "מתחברים…" : "כניסה עם Google"}
      </button>
      {error && <p className="error" role="alert">{error}</p>}
      <p className="note">רק מי שהוזמן לטיול יכול להיכנס.</p>
    </section>
  );
}
