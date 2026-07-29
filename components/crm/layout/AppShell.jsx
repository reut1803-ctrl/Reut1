"use client";

import { useEffect, useRef } from "react";
import TopBar from "./TopBar";
import BottomNav from "./BottomNav";
import FabButtons from "./FabButtons";
import TermsGate from "./TermsGate";
import Toast from "./Toast";
import SignInGate from "./SignInGate";
import { useScrollRestoration } from "@/lib/crm/useScrollRestoration";
import { useCrmStore } from "@/lib/crm/store";

export default function AppShell({ children }) {
  const scrollRef = useRef(null);
  const googleUser = useCrmStore((s) => s.googleUser);
  const authLoading = useCrmStore((s) => s.authLoading);
  useScrollRestoration(scrollRef);

  useEffect(() => {
    useCrmStore.getState().initCrmFirebase();
  }, []);

  if (authLoading) return <div className="h-dvh bg-[#E8DCCB]" />;
  if (!googleUser) return <SignInGate />;

  return (
    <div className="flex h-dvh flex-col bg-[#E8DCCB] text-[#3A2E26]" dir="rtl">
      <TopBar />
      <main ref={scrollRef} className="flex-1 overflow-y-auto pb-24">
        {children}
      </main>
      <FabButtons />
      <BottomNav />
      <TermsGate />
      <Toast />
    </div>
  );
}
