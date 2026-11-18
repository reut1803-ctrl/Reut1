"use client";

import AppShell from "@/components/app/AppShell";
import BudgetView from "@/components/views/BudgetView";

export default function Page() {
  return (
    <AppShell eyebrow="מד תקציב" title="התקציב">
      <BudgetView />
    </AppShell>
  );
}
