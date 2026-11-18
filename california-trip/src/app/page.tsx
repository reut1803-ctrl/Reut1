"use client";

import { useCallback, useEffect, useState } from "react";
import Scene, { type ScenePhase } from "@/components/Scene";
import LoginCard from "@/components/LoginCard";
import WelcomeCard from "@/components/WelcomeCard";
import DeniedCard from "@/components/DeniedCard";
import Home from "@/components/home/Home";
import { useAuth } from "@/lib/auth";
import { useTrip } from "@/lib/trip";

const LANDING_MS = 9200;
const LANDED_KEY = "ct-landed";

function readLanded() {
  try { return sessionStorage.getItem(LANDED_KEY) === "1"; } catch { return false; }
}
function writeLanded(v: boolean) {
  try { if (v) sessionStorage.setItem(LANDED_KEY, "1"); else sessionStorage.removeItem(LANDED_KEY); } catch { /* מצב גלישה פרטית */ }
}

export default function Page() {
  const { status, user, demo } = useAuth();
  const trip = useTrip(user, demo);
  const [phase, setPhase] = useState<ScenePhase>("idle");
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
    // כבר נחתנו בביקור הזה? ישר לעמוד הבית.
    if (run === 0 && readLanded()) {
      setPhase("arrived");
      setEntered(true);
      return;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setPhase("arrived");
      return;
    }
    setPhase("landing");
    const t = setTimeout(() => setPhase("arrived"), LANDING_MS);
    return () => clearTimeout(t);
  }, [ready, run, status]);

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

  const me = trip.members.find((m) => m.uid === user?.uid);
  const others = trip.members.filter((m) => m.uid !== user?.uid);
  const sceneAvatars = [me, ...others]
    .filter((m): m is NonNullable<typeof m> => !!m)
    .map((m) => ({ photoUrl: m.avatarUrl, look: m.look }));

  let overlay: React.ReactNode = null;
  let center = true;
  if (status === "loading" || (status === "signedIn" && trip.state === "loading")) {
    overlay = (
      <div className="loading-chip" role="status">
        <span className="spinner" /> {status === "loading" ? "רגע…" : "מכינים את הנחיתה…"}
      </div>
    );
  } else if (status === "signedOut") {
    overlay = <LoginCard />;
  } else if (trip.state === "denied" || trip.state === "error") {
    overlay = <DeniedCard error={trip.state === "error"} />;
  } else if (phase === "arrived") {
    overlay = <WelcomeCard trip={trip} onReplay={replay} onEnter={enter} />;
    center = false;
  }

  return (
    <main className="stage">
      <Scene key={run} phase={phase} avatars={sceneAvatars} />
      <div className={`overlay ${center ? "overlay--center" : "overlay--side"}`}>{overlay}</div>
      {phase === "landing" && (
        <button type="button" className="btn btn-soft skip" onClick={() => setPhase("arrived")}>
          דילוג
        </button>
      )}
    </main>
  );
}
