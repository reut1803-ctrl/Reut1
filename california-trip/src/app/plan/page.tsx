"use client";

import AppShell from "@/components/app/AppShell";
import PlanView from "@/components/views/PlanView";

export default function Page() {
  return (
    <AppShell eyebrow="מסלול וזמנים" title="המסלול">
      <PlanView />
    </AppShell>
  );
}
