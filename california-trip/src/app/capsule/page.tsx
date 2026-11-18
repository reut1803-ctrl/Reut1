"use client";

import AppShell from "@/components/app/AppShell";
import CapsuleView from "@/components/views/CapsuleView";

export default function Page() {
  return (
    <AppShell eyebrow="קפסולת זמן" title="כל הטיול">
      <CapsuleView />
    </AppShell>
  );
}
