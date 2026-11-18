"use client";

import AppShell from "@/components/app/AppShell";
import PackingView from "@/components/views/PackingView";

export default function Page() {
  return (
    <AppShell eyebrow="ציוד חכם" title="מה לארוז">
      <PackingView />
    </AppShell>
  );
}
