"use client";

import Link from "next/link";
import OrigamiPlane from "../home/OrigamiPlane";
import { useAuth } from "@/lib/auth";
import { useTripCtx } from "@/lib/tripContext";

export default function AppNav({ night }: { night?: boolean }) {
  const { signOut, demo } = useAuth();
  const { trip } = useTripCtx();
  const names = trip.members.map((m) => m.name).filter(Boolean);
  return (
    <header className="nav">
      <div className="nav-inner">
        <Link className="nav-brand" href="/">
          <OrigamiPlane tone="yellow" className="nav-plane" />
          קליפורניה שלנו
        </Link>
        <div className="nav-side">
          {night && <span className="nav-demo">מצב חיסכון</span>}
          {demo && !night && <span className="nav-demo">מצב תצוגה</span>}
          <div className="nav-faces" aria-label={`מטיילים: ${names.join(", ")}`}>
            {trip.members.slice(0, 3).map((m) => (
              <span key={m.uid} className="nav-face" style={m.avatarUrl ? { backgroundImage: `url("${m.avatarUrl}")` } : undefined}>
                {!m.avatarUrl && m.name.slice(0, 1)}
              </span>
            ))}
          </div>
          <button type="button" className="nav-link" onClick={signOut}>יציאה</button>
        </div>
      </div>
    </header>
  );
}
