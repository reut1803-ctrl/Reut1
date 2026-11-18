"use client";

import { useCallback, useEffect, useState } from "react";
import Gate, { type GatePhase } from "@/components/Gate";
import LoginCard from "@/components/LoginCard";
import WelcomeCard from "@/components/WelcomeCard";
import DeniedCard from "@/components/DeniedCard";
import Home from "@/components/home/Home";
import { useAuth } from "@/lib/auth";
import { useTrip } from "@/lib/trip";

const LANDED_KEY = "ct-landed";

function readLanded() {
  try { return sessionStorage.getItem(LANDED_KEY) === "1"; } catch { return false; }
}
function writeLanded(v: boolean) {
  try { if (v) sessionStorage.setItem(LANDED_KEY, "1"); else sessionStorage.removeItem(LANDED_KEY); } catch { /* גלישה פרטית */ }
}

export default function Page() {
  const { status, user, demo } = useAuth();
  const trip = useTrip(user, demo);
  const [phase, setPhase] = useState<GatePhase>("idle");
  const [run, setRun] = useState(0);
  const [entered, setEntered] = useState(false);

  const ready = status === "signedIn" && trip.state === "member";

  useEffect(() => {
    if (!ready) {
      setPhase("idle");
      setEntered(false);
      if (status === "signedOut") writeLanded(false);
      return;
    }
    // כבר המראנו בביקור הזה? ישר לעמוד הבית.
    if (run === 0 && readLanded()) {
      setPhase("arrived");
      setEntered(true);
      return;
    }
    setPhase("flying");
  }, [ready, run, status]);

  const flown = useCallback(() => setPhase((p) => (p === "flying" ? "arrived" : p)), []);

  const enter = useCallback(() => {
    writeLanded(true);
    window.scrollTo(0, 0);
    setEntered(true);
  }, []);

  const replay = useCallback(() => {
    setEntered(false);
    setPhase("idle");
    window.scrollTo(0, 0);
    requestAnimationFrame(() => setRun((r) => r + 1));
  }, []);

  if (ready && entered) {
    return <Home trip={trip} onReplay={replay} />;
  }

  let content: React.ReactNode = null;
  if (status === "loading" || (status === "signedIn" && trip.state === "loading")) {
    content = (
      <div className="loading-chip glass" role="status">
        <span className="spinner" /> {status === "loading" ? "רגע…" : "מכינים את הטיסה…"}
      </div>
    );
  } else if (status === "signedOut") {
    content = <LoginCard />;
  } else if (trip.state === "denied" || trip.state === "error") {
    content = <DeniedCard error={trip.state === "error"} />;
  } else if (phase === "arrived") {
    content = <WelcomeCard trip={trip} onReplay={replay} onEnter={enter} />;
  }

  return (
    <Gate phase={phase} onFlown={flown}>
      {content}
      {phase === "flying" && (
        <button type="button" className="text-btn gate-skip" onClick={() => setPhase("arrived")}>
          דילוג
        </button>
      )}
    </Gate>
  );
}
