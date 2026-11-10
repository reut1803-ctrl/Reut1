"use client";

import { useCallback, useEffect, useState } from "react";
import Scene, { type ScenePhase } from "@/components/Scene";
import LoginCard from "@/components/LoginCard";
import WelcomeCard from "@/components/WelcomeCard";
import DeniedCard from "@/components/DeniedCard";
import { useAuth } from "@/lib/auth";
import { useTrip } from "@/lib/trip";

const LANDING_MS = 9200;

export default function Home() {
  const { status, user, demo } = useAuth();
  const trip = useTrip(user, demo);
  const [phase, setPhase] = useState<ScenePhase>("idle");
  const [run, setRun] = useState(0);

  const ready = status === "signedIn" && trip.state === "member";

  useEffect(() => {
    if (!ready) {
      setPhase("idle");
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
  }, [ready, run]);

  const replay = useCallback(() => {
    setPhase("idle");
    requestAnimationFrame(() => setRun((r) => r + 1));
  }, []);

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
    overlay = <WelcomeCard trip={trip} onReplay={replay} />;
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
