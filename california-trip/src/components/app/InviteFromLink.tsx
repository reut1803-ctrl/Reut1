"use client";

import { useEffect, useState } from "react";
import { useTripCtx } from "@/lib/tripContext";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// קישור הזמנה: ‎/?invite=name@gmail.com‎ — מבקש אישור ומוסיף את המייל לרשימת המטיילים.
// המייל מגיע רק מהקישור, ולא נשמר בקוד של האתר.
export default function InviteFromLink() {
  const { trip } = useTripCtx();
  const [email, setEmail] = useState<string | null>(null);
  const [state, setState] = useState<"ask" | "busy" | "done" | "error">("ask");

  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("invite");
    if (p && EMAIL_RE.test(p.trim())) setEmail(p.trim().toLowerCase());
  }, []);

  if (!email || trip.state !== "member") return null;

  const already = trip.members.some((m) => m.email.toLowerCase() === email);

  function clearLink() {
    const url = new URL(window.location.href);
    url.searchParams.delete("invite");
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    setEmail(null);
  }

  async function confirm() {
    setState("busy");
    try {
      await trip.invite(email!);
      setState("done");
    } catch {
      setState("error");
    }
  }

  return (
    <div className="invite-pop glass" role="dialog" aria-labelledby="invite-pop-title">
      {state === "done" || already ? (
        <>
          <h2 id="invite-pop-title" className="panel-title">{already ? "כבר בטיול ✓" : "נוסף לטיול ✓"}</h2>
          <p className="hint"><bdi>{email}</bdi> יכול להיכנס עכשיו לאתר עם חשבון הגוגל הזה.</p>
          <button type="button" className="pill-btn pill-btn--dark pill-btn--block" onClick={clearLink}>מעולה</button>
        </>
      ) : (
        <>
          <h2 id="invite-pop-title" className="panel-title">להוסיף מטייל לטיול?</h2>
          <p className="hint">החשבון <bdi className="invite-email">{email}</bdi> יוכל להיכנס לאתר ולראות ולערוך את כל הטיול.</p>
          {state === "error" && <p className="gate-error">ההוספה לא הצליחה. בדקו את החיבור ונסו שוב.</p>}
          <button type="button" className="pill-btn pill-btn--dark pill-btn--block" onClick={confirm} disabled={state === "busy"}>
            {state === "busy" ? "מוסיפים…" : "כן, להוסיף"}
          </button>
          <button type="button" className="text-btn" onClick={clearLink}>לא עכשיו</button>
        </>
      )}
    </div>
  );
}
