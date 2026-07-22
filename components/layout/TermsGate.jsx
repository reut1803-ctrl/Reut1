"use client";

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/supabase/AuthProvider";
import { fetchAppSettings, acceptTerms } from "@/lib/queries";

export default function TermsGate() {
  const { supabase, user, profile, refreshProfile } = useAuth();
  const [termsText, setTermsText] = useState("");
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);

  const needsGate = (profile?.role === "staff" || profile?.role === "admin") && profile?.terms_accepted === false;

  useEffect(() => {
    if (needsGate) fetchAppSettings(supabase).then((s) => setTermsText(s.terms_text));
  }, [needsGate, supabase]);

  if (!needsGate) return null;

  const confirm = async () => {
    setLoading(true);
    await acceptTerms(supabase, user.id);
    await refreshProfile();
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4">
      <div className="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-surface shadow-float">
        <div className="flex items-center gap-2 border-b border-black/5 px-5 py-4">
          <ShieldCheck size={20} className="text-bordeaux-500" />
          <h2 className="text-lg font-bold text-ink">נהלי עבודה וסודיות</h2>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <p className="whitespace-pre-line text-sm leading-relaxed text-ink">{termsText}</p>
        </div>

        <div className="border-t border-black/5 px-5 py-4">
          <label className="flex cursor-pointer items-start gap-2.5">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-bordeaux-500"
            />
            <span className="text-sm font-semibold text-ink">קראתי ואני מאשר/ת את הנהלים</span>
          </label>
          <button onClick={confirm} disabled={!checked || loading} className="btn-pink mt-3 w-full disabled:opacity-40">
            המשך למערכת
          </button>
        </div>
      </div>
    </div>
  );
}
