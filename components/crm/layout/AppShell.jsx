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
import { useCrmStore, allowlistEmail, OWNER_EMAIL } from "@/lib/crm/store";

export default function AppShell({ children }) {
  const scrollRef = useRef(null);
  const googleUser = useCrmStore((s) => s.googleUser);
  const authLoading = useCrmStore((s) => s.authLoading);
  const role = useCrmStore((s) => s.role);
  const myEntryStatus = useCrmStore((s) => s.myEntryStatus);
  const authAllowlist = useCrmStore((s) => s.authAllowlist);
  useScrollRestoration(scrollRef);

  useEffect(() => {
    useCrmStore.getState().initCrmFirebase();
  }, []);

  if (authLoading) return <div className="h-dvh bg-[#F6F5F4]" />;
  if (!googleUser) return <SignInGate />;

  // כל עוד בדיקת ההרשאה האישית לא הסתיימה - לא מציגים לא מסך חסימה ולא מאגר ריק,
  // אלא מסך המתנה. כך אף אחד לא רואה "אין הרשאה" להרף עין ולא מאגר שנראה ריק.
  const myEmail = String(googleUser.email || "").trim().toLowerCase();
  const decided =
    myEntryStatus !== "loading" ||
    myEmail === OWNER_EMAIL ||
    authAllowlist.some((e) => allowlistEmail(e) === myEmail);
  if (!decided) return <div className="h-dvh bg-[#F6F5F4]" />;

  // תשובה ודאית מהשרת: הכתובת אינה ברשימת ההרשאות
  if (role === "unauthorized") return <AccessDeniedGate />;
  // תקלת תקשורת - מציגים הסבר ואפשרות לנסות שוב, ולא "אין הרשאה"
  if (role === "unverified") return <AccessDeniedGate unverified />;

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
