"use client";

import { useState } from "react";
import { BarChart3, Mail, ShieldCheck, Lightbulb, Check } from "lucide-react";
import { useCrmStore } from "@/lib/crm/store";
import { STAFF_USERS } from "@/lib/crm/mockData";
import Button from "@/components/crm/ui/Button";

function metricColor(value, max) {
  if (max === 0) return "bg-[#EAE5E3]";
  const ratio = value / max;
  if (ratio >= 0.66) return "bg-[#20A66B]";
  if (ratio >= 0.33) return "bg-[#D6A93A]";
  return "bg-[#C24545]";
}

function MetricBar({ label, value, max }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[12px]">
        <span className="text-[#8A8285]">{label}</span>
        <span className="font-bold text-[#3A3335]">{value}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[#F0EBE9]">
        <div className={`h-full rounded-full transition-all ${metricColor(value, max)}`} style={{ width: `${Math.max(pct, value > 0 ? 4 : 0)}%` }} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const role = useCrmStore((s) => s.role);
  const telemetry = useCrmStore((s) => s.telemetry);
  const termsText = useCrmStore((s) => s.termsText);
  const setTermsText = useCrmStore((s) => s.setTermsText);
  const termsAccepted = useCrmStore((s) => s.termsAccepted);
  const dailyTip = useCrmStore((s) => s.dailyTip);
  const setDailyTip = useCrmStore((s) => s.setDailyTip);
  const emailLog = useCrmStore((s) => s.emailLog);

  const [termsDraft, setTermsDraft] = useState(termsText);
  const [tipDraft, setTipDraft] = useState(dailyTip);
  const [savedTerms, setSavedTerms] = useState(false);
  const [savedTip, setSavedTip] = useState(false);

  if (role !== "admin") {
    return <p className="px-4 py-10 text-center text-sm text-[#8A8285]">אזור זה זמין למנהלת בלבד</p>;
  }

  const maxViews = Math.max(1, ...STAFF_USERS.map((s) => telemetry[s.id]?.profileViews || 0));
  const maxPlays = Math.max(1, ...STAFF_USERS.map((s) => telemetry[s.id]?.audioPlays || 0));

  const handleSaveTerms = () => {
    setTermsText(termsDraft);
    setSavedTerms(true);
    setTimeout(() => setSavedTerms(false), 2000);
  };
  const handleSaveTip = () => {
    setDailyTip(tipDraft);
    setSavedTip(true);
    setTimeout(() => setSavedTip(false), 2000);
  };

  return (
    <div className="px-4 py-6">
      <h1 className="flex items-center gap-2 text-xl font-bold text-[#3A3335]">
        <BarChart3 size={22} /> לוח בקרה
      </h1>
      <p className="mt-1 text-[13px] text-[#8A8285]">מעורבות צוות, נהלים, טיפים ומעקב מיילים</p>

      <h2 className="mt-6 mb-3 text-[15px] font-bold text-[#3A3335]">מעורבות צוות</h2>
      <div className="space-y-3">
        {STAFF_USERS.map((s) => {
          const t = telemetry[s.id] || {};
          return (
            <div key={s.id} className="rounded-3xl border border-[#EAE5E3] bg-white p-4 shadow-[0_4px_18px_rgba(58,51,53,0.06)]">
              <p className="mb-3 text-sm font-bold text-[#3A3335]">{s.name}</p>
              <div className="space-y-2.5">
                <MetricBar label="צפיות בכרטיסי מועמדים" value={t.profileViews || 0} max={maxViews} />
                <MetricBar label="השמעות הקלטות היכרות" value={t.audioPlays || 0} max={maxPlays} />
              </div>
            </div>
          );
        })}
      </div>

      <h2 className="mt-8 mb-3 flex items-center gap-1.5 text-[15px] font-bold text-[#3A3335]">
        <ShieldCheck size={17} /> תקנון סודיות
      </h2>
      <div className="rounded-3xl border border-[#EAE5E3] bg-white p-4 shadow-[0_4px_18px_rgba(58,51,53,0.06)]">
        <textarea
          value={termsDraft}
          onChange={(e) => setTermsDraft(e.target.value)}
          rows={7}
          className="w-full resize-none rounded-xl border border-[#EAE5E3] bg-white px-3 py-2 text-[13px] leading-relaxed outline-none focus:border-[#8C4A55]"
        />
        <Button variant="primary" className="mt-2 w-full" onClick={handleSaveTerms}>
          {savedTerms ? <Check size={16} /> : null}
          {savedTerms ? "נשמר!" : "שמירת תקנון"}
        </Button>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {STAFF_USERS.map((s) => (
            <span
              key={s.id}
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                termsAccepted[s.id] ? "bg-[#E7F5EC] text-[#178A57]" : "bg-[#F6F5F4] text-[#B5AEB0]"
              }`}
            >
              {s.name} {termsAccepted[s.id] ? "✓ אישרה" : "טרם אישרה"}
            </span>
          ))}
        </div>
      </div>

      <h2 className="mt-8 mb-3 flex items-center gap-1.5 text-[15px] font-bold text-[#3A3335]">
        <Lightbulb size={17} /> טיפ שידוכים לצוות
      </h2>
      <div className="rounded-3xl border border-[#EAE5E3] bg-white p-4 shadow-[0_4px_18px_rgba(58,51,53,0.06)]">
        <textarea
          value={tipDraft}
          onChange={(e) => setTipDraft(e.target.value)}
          rows={3}
          className="w-full resize-none rounded-xl border border-[#EAE5E3] bg-white px-3 py-2 text-[13px] leading-relaxed outline-none focus:border-[#8C4A55]"
        />
        <Button variant="primary" className="mt-2 w-full" onClick={handleSaveTip}>
          {savedTip ? <Check size={16} /> : null}
          {savedTip ? "נשמר!" : "שמירת טיפ"}
        </Button>
      </div>

      <h2 className="mt-8 mb-3 flex items-center gap-1.5 text-[15px] font-bold text-[#3A3335]">
        <Mail size={17} /> יומן מיילים (הדגמה)
      </h2>
      {emailLog.length === 0 ? (
        <p className="text-center text-sm text-[#8A8285]">עדיין לא נשלחו מיילים</p>
      ) : (
        <div className="space-y-2">
          {emailLog.map((m) => (
            <div key={m.id} className="rounded-2xl border border-[#EAE5E3] bg-white p-3 text-[12px]">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#3A3335]">{m.subject}</span>
                <span className="text-[#B5AEB0]">{new Date(m.date).toLocaleString("he-IL")}</span>
              </div>
              <p className="mt-1 text-[#8A8285]">{m.body}</p>
              <p className="mt-1 text-[10px] text-[#B5AEB0]">אל: {m.to}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
