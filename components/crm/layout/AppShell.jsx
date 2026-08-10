"use client";

import { useEffect, useRef } from "react";
import TopBar from "./TopBar";
import BottomNav from "./BottomNav";
import FabButtons from "./FabButtons";
import TermsGate from "./TermsGate";
import Toast from "./Toast";
import SignInGate from "./SignInGate";
import AccessDeniedGate from "./AccessDeniedGate";
import { useScrollRestoration } from "@/lib/crm/useScrollRestoration";
import { useCrmStore } from "@/lib/crm/store";

export default function AppShell({ children }) {
  const scrollRef = useRef(null);
  const googleUser = useCrmStore((s) => s.googleUser);
  const authLoading = useCrmStore((s) => s.authLoading);
  const role = useCrmStore((s) => s.role);
  const allowlistLoaded = useCrmStore((s) => s.allowlistLoaded);
  useScrollRestoration(scrollRef);

  useEffect(() => {
    useCrmStore.getState().initCrmFirebase();
  }, []);

  if (authLoading) return <div className="h-dvh bg-[#F6F5F4]" />;
  if (!googleUser) return <SignInGate />;
  // מציגים את מסך "אין הרשאה" רק אחרי שרשימת ההרשאות נבדקה מול השרת,
  // כדי שאיש/אשת צוות מאושר/ת לא יראה/תראה אותו להרף עין בזמן הטעינה.
  if (allowlistLoaded && role === "unauthorized") return <AccessDeniedGate />;
  // כשלא הצלחנו לאמת מול השרת - מציגים הסבר ואפשרות לנסות שוב, ולא "אין הרשאה"
  if (allowlistLoaded && role === "unverified") return <AccessDeniedGate unverified />;

  return (
    <div className="flex h-dvh flex-col bg-[#F6F5F4] text-[#3A3335]" dir="rtl">
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
