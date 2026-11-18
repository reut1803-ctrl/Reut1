"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { useTripCtx } from "@/lib/tripContext";
import { useBatteryNight } from "@/lib/battery";
import AppNav from "./AppNav";
import TabBar from "./TabBar";
import Reminders from "./Reminders";

export default function AppShell({ eyebrow, title, children, wide }: { eyebrow: string; title: string; children: ReactNode; wide?: boolean }) {
  const { status } = useAuth();
  const { trip } = useTripCtx();
  const { night, turnOff } = useBatteryNight();

  if (status === "loading" || (status === "signedIn" && trip.state === "loading")) {
    return (
      <div className="app app--center">
        <div className="loading-chip glass" role="status"><span className="spinner" /> רגע…</div>
      </div>
    );
  }
  if (status !== "signedIn" || trip.state !== "member") {
    return (
      <div className="app app--center">
        <section className="gate-card glass">
          <h1 className="gate-title gate-title--sm">צריך להתחבר</h1>
          <p className="gate-lede">החלק הזה פתוח רק למטיילים.</p>
          <Link className="pill-btn pill-btn--dark pill-btn--block link-btn" href="/">לכניסה</Link>
        </section>
      </div>
    );
  }
  return (
    <div className="app">
      <AppNav night={night} onNightOff={turnOff} />
      <main className={`app-main ${wide ? "app-main--wide" : ""}`}>
        <header className="page-head">
          <p className="eyebrow-home">{eyebrow}</p>
          <h1 className="page-title">{title}</h1>
        </header>
        {children}
      </main>
      <Reminders />
      <TabBar />
    </div>
  );
}
