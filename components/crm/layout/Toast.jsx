"use client";

import { useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import { useCrmStore } from "@/lib/crm/store";

export default function Toast() {
  const toast = useCrmStore((s) => s.toast);
  const clearToast = useCrmStore((s) => s.clearToast);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => clearToast(), 2500);
    return () => clearTimeout(timer);
  }, [toast, clearToast]);

  if (!toast) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[200] flex justify-center px-4">
      <div className="pointer-events-auto flex items-center gap-2 rounded-2xl bg-[#3B332A] px-4 py-3 text-sm font-semibold text-white shadow-xl">
        <CheckCircle2 size={17} className="shrink-0 text-[#7FB33F]" />
        {toast.message}
      </div>
    </div>
  );
}
