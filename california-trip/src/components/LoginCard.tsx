"use client";

import GoogleIcon from "./GoogleIcon";
import FlagEmblem from "./FlagEmblem";
import { useAuth } from "@/lib/auth";

export default function LoginCard() {
  const { signIn, busy, error, demo } = useAuth();
  return (
    <section className="gate-card glass" aria-labelledby="login-title">
      {demo && <span className="demo-pill">תצוגה מקדימה · ההתחברות כאן מדומה</span>}
      <FlagEmblem />
      <p className="gate-eyebrow">רעות וזכריה · המסע הגדול</p>
      <h1 id="login-title" className="gate-title">קליפורניה שלנו<span className="dot">.</span></h1>
      <p className="gate-lede">המסלול, המפה, הציוד והזיכרונות. הכול במקום אחד.</p>
      <button className="btn-google" onClick={signIn} disabled={busy}>
        {busy ? <span className="spinner" /> : <GoogleIcon />}
        {busy ? "מתחברים…" : "כניסה עם Google"}
      </button>
      {error && <p className="gate-error" role="alert">{error}</p>}
      <p className="gate-note">רק מי שהוזמן לטיול יכול להיכנס.</p>
    </section>
  );
}
