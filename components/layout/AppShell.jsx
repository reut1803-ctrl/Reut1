"use client";

import TopNavbar from "./TopNavbar";
import BottomNav from "./BottomNav";
import FloatingButtons from "./FloatingButtons";

export default function AppShell({ children }) {
  return (
    <div className="min-h-screen bg-bg">
      <TopNavbar />
      <main className="mx-auto max-w-md px-4 pb-28 pt-2">{children}</main>
      <FloatingButtons />
      <BottomNav />
    </div>
  );
}
