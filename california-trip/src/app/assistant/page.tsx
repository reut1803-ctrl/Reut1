"use client";

import AppShell from "@/components/app/AppShell";
import AssistantView from "@/components/views/AssistantView";

export default function Page() {
  return (
    <AppShell eyebrow="העוזרת" title="שאלו אותי הכול">
      <AssistantView />
    </AppShell>
  );
}
