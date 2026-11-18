"use client";

import AppShell from "@/components/app/AppShell";
import DiscoverView from "@/components/views/DiscoverView";

export default function Page() {
  return (
    <AppShell eyebrow="גילוי" title="מה עושים עכשיו?">
      <DiscoverView />
    </AppShell>
  );
}
