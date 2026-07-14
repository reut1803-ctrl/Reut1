"use client";

import { useEffect, useRef } from "react";
import TopBar from "./TopBar";
import BottomNav from "./BottomNav";
import FabButtons from "./FabButtons";
import { useScrollRestoration } from "@/lib/crm/useScrollRestoration";
import { useCrmStore } from "@/lib/crm/store";

export default function AppShell({ children }) {
  const scrollRef = useRef(null);
  useScrollRestoration(scrollRef);

  useEffect(() => {
    useCrmStore.persist.rehydrate();
  }, []);

  return (
    <div className="flex h-dvh flex-col bg-[#F6F5F4] text-[#3A3335]" dir="rtl">
      <TopBar />
      <main ref={scrollRef} className="flex-1 overflow-y-auto pb-24">
        {children}
      </main>
      <FabButtons />
      <BottomNav />
    </div>
  );
}
