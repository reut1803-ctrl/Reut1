"use client";

import { useEffect, useRef } from "react";
import TopBar from "./TopBar";
import BottomNav from "./BottomNav";
import FabButtons from "./FabButtons";
import TermsGate from "./TermsGate";
import Toast from "./Toast";
import SignInGate from "./SignInGate";
import AccessDeniedGate from "./AccessDeniedGate";
import ConnectionStuckGate from "./ConnectionStuckGate";
import ErrorBoundary from "./ErrorBoundary";
import { useScrollRestoration } from "@/lib/crm/useScrollRestoration";
import { useCrmStore, allowlistEmail, OWNER_EMAIL } from "@/lib/crm/store";

export default function AppShell({ children }) {
  return (
    <ErrorBoundary>
      <CrmShell>{children}</CrmShell>
    </ErrorBoundary>
  );
}

function CrmShell({ children }) {
  const scrollRef = useRef(null);
  const googleUser = useCrmStore((s) => s.googleUser);
  const authLoading = useCrmStore((s) => s.authLoading);
  const role = useCrmStore((s) => s.role);
  const myEntryStatus = useCrmStore((s) => s.myEntryStatus);
  const authAllowlist = useCrmStore((s) => s.authAllowlist);
  const authTimedOut = useCrmStore((s) => s.authTimedOut);
  useScrollRestoration(scrollRef);

  useEffect(() => {
    useCrmStore.getState().initCrmFirebase();
  }, []);

  // שני מסכי ההמתנה שהיו כאן היו div ריק לגמרי. כשההמתנה לא נגמרה, זה נראה
  // בדיוק כמו מסך לבן שבור. מעתה מוצג חיווי טעינה, ואחרי 20 שניות בלי תשובה
  // מוצג הסבר עם כפתור רענון במקום מסך ריק.
  if (authLoading) return authTimedOut ? <ConnectionStuckGate /> : <LoadingScreen label="מתחבר..." />;
  if (!googleUser) return <SignInGate />;

  // כל עוד בדיקת ההרשאה האישית לא הסתיימה - לא מציגים לא מסך חסימה ולא מאגר ריק,
  // אלא מסך המתנה. כך אף אחד לא רואה "אין הרשאה" להרף עין ולא מאגר שנראה ריק.
  const myEmail = String(googleUser.email || "").trim().toLowerCase();
  const decided =
    myEntryStatus !== "loading" ||
    myEmail === OWNER_EMAIL ||
    authAllowlist.some((e) => allowlistEmail(e) === myEmail);
  if (!decided) return <LoadingScreen label="בודק הרשאות..." />;

  // תשובה ודאית מהשרת: הכתובת אינה ברשימת ההרשאות
  if (role === "unauthorized") return <AccessDeniedGate />;
  // תקלת תקשורת - מציגים הסבר ואפשרות לנסות שוב, ולא "אין הרשאה"
  if (role === "unverified") return <AccessDeniedGate unverified />;

  return (
    <div className="flex h-dvh flex-col bg-[#F6F5F4] text-[#3A3335]" dir="rtl">
      <TopBar />
      <main ref={scrollRef} className="flex-1 overflow-y-auto pb-24">
        {/* קריסה במסך פנימי לא תמחק את כל האפליקציה: הניווט והכותרת נשארים,
            ובמקום התוכן מוצגת השגיאה המדויקת */}
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
      <FabButtons />
      <BottomNav />
      <TermsGate />
      <Toast />
    </div>
  );
}

// מסך המתנה עם חיווי גלוי. מסך ריק אינו מבחין בין "עוד רגע" לבין "נשבר".
function LoadingScreen({ label }) {
  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-3 bg-[#F6F5F4]" dir="rtl">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#EAE5E3] border-t-[#8C4A55]" />
      <p className="text-[13px] font-semibold text-[#8A8285]">{label}</p>
    </div>
  );
}
