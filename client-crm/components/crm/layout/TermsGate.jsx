"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useCrmStore } from "@/lib/crm/store";
import Button from "@/components/crm/ui/Button";

export default function TermsGate() {
  const role = useCrmStore((s) => s.role);
  const currentStaffEmail = useCrmStore((s) => s.currentStaffEmail);
  const termsAccepted = useCrmStore((s) => s.termsAccepted);
  const termsText = useCrmStore((s) => s.termsText);
  const acceptTerms = useCrmStore((s) => s.acceptTerms);
  const [checked, setChecked] = useState(false);

  if (role !== "staff" || termsAccepted[currentStaffEmail]) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4" dir="rtl">
      <div className="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center gap-2 border-b border-[#CFE3EC] px-5 py-4">
          <ShieldCheck size={20} className="text-[#2E8BA8]" />
          <h2 className="text-lg font-bold text-[#23414E]">נהלי עבודה וסודיות</h2>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <p className="whitespace-pre-line text-[13px] leading-relaxed text-[#23414E]">{termsText}</p>
        </div>

        <div className="border-t border-[#CFE3EC] px-5 py-4">
          <label className="flex cursor-pointer items-start gap-2.5">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[#2E8BA8]"
            />
            <span className="text-[13px] font-semibold text-[#23414E]">קראתי ואני מאשר/ת את הנהלים</span>
          </label>
          <Button
            variant="primary"
            className="mt-3 w-full"
            disabled={!checked}
            onClick={() => acceptTerms(currentStaffEmail)}
          >
            המשך למערכת
          </Button>
        </div>
      </div>
    </div>
  );
}
