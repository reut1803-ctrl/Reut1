"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Wordmark from "../components/Wordmark";

// כתובת הבית של המערכת נכנסת ישירות למאגר השידוכים, בלי מסך ביניים.
// שאלון ההיכרות למועמד/ת נשאר זמין בכתובות /form/male ו-/form/female.
export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/crm");
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <Wordmark size="lg" />
    </main>
  );
}
