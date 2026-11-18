"use client";

import AppShell from "@/components/app/AppShell";
import JournalView from "@/components/views/JournalView";

export default function Page() {
  return (
    <AppShell eyebrow="יומן הודיה" title="היומן שלנו">
      <JournalView />
    </AppShell>
  );
}
