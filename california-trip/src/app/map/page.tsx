"use client";

import AppShell from "@/components/app/AppShell";
import MapView from "@/components/views/MapView";

export default function Page() {
  return (
    <AppShell eyebrow="מפת קליפורניה" title="המפה שלנו">
      <MapView />
    </AppShell>
  );
}
