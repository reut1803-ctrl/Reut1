"use client";

import { useEffect, useState } from "react";
import GoogleIcon from "./GoogleIcon";
import FlagEmblem from "./FlagEmblem";
import { useAuth } from "@/lib/auth";
import { chromeIntentUrl, inAppBrowser, isAndroid } from "@/lib/browser";

export default function LoginCard() {
  const { signIn, busy, error, demo } = useAuth();
  const [embedded, setEmbedded] = useState(false);
  const [android, setAndroid] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setEmbedded(!demo && inAppBrowser());
    setAndroid(isAndroid());
  }, [demo]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="gate-card glass" aria-labelledby="login-title">
      {demo && <span className="demo-pill">תצוגה מקדימה · ההתחברות כאן מדומה</span>}
      <FlagEmblem />
      <p className="gate-eyebrow">רעות וזכריה · המסע הגדול</p>
      <h1 id="login-title" className="gate-title">קליפורניה שלנו<span className="dot">.</span></h1>
      <p className="gate-lede">המסלול, המפה, הציוד והזיכרונות. הכול במקום אחד.</p>

      {embedded ? (
        <div className="open-outside">
          <p>האתר נפתח בתוך אפליקציה, וגוגל לא מאפשרת להתחבר מכאן. פתחו אותו בדפדפן:</p>
          {android ? (
            <a className="pill-btn pill-btn--dark pill-btn--block" href={chromeIntentUrl()}>פתיחה בכרום</a>
          ) : (
            <p className="open-outside-hint">לחצו על שלוש הנקודות או על סמל השיתוף בפינת המסך, ובחרו ״פתיחה בספארי״.</p>
          )}
          <button type="button" className="text-btn" onClick={copyLink}>
            {copied ? "הקישור הועתק ✓" : "העתקת הקישור"}
          </button>
        </div>
      ) : (
        <button className="btn-google" onClick={signIn} disabled={busy}>
          {busy ? <span className="spinner" /> : <GoogleIcon />}
          {busy ? "מתחברים…" : "כניסה עם Google"}
        </button>
      )}
      {error && <p className="gate-error" role="alert">{error}</p>}
      <p className="gate-note">רק מי שהוזמן לטיול יכול להיכנס.</p>
    </section>
  );
}
