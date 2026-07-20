"use client";

import { useState } from "react";
import Link from "next/link";
import { BarChart3, Mail, ShieldCheck, Lightbulb, Check, KeyRound, Trash2, UserPlus, Target, Wallet } from "lucide-react";
import { useCrmStore } from "@/lib/crm/store";
import { STAFF_USERS } from "@/lib/crm/mockData";
import Button from "@/components/crm/ui/Button";

function metricColor(ratio) {
  if (ratio >= 1) return "bg-[#20A66B]";
  if (ratio >= 0.5) return "bg-[#D6A93A]";
  return "bg-[#C24545]";
}

function MetricBar({ label, value, goal }) {
  const ratio = goal === 0 ? 0 : value / goal;
  const pct = Math.min(100, Math.round(ratio * 100));
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[12px]">
        <span className="text-[#8A8285]">{label}</span>
        <span className="font-bold text-[#3A3335]">
          {value} / {goal}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[#F0EBE9]">
        <div className={`h-full rounded-full transition-all ${metricColor(ratio)}`} style={{ width: `${Math.max(pct, value > 0 ? 4 : 0)}%` }} />
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
  const googleAuthEnabled = useCrmStore((s) => s.googleAuthEnabled);
  const authAllowlist = useCrmStore((s) => s.authAllowlist);
  const addAllowlistEntry = useCrmStore((s) => s.addAllowlistEntry);
  const removeAllowlistEntry = useCrmStore((s) => s.removeAllowlistEntry);
  const weeklyGoals = useCrmStore((s) => s.weeklyGoals);
  const setWeeklyGoals = useCrmStore((s) => s.setWeeklyGoals);
  const openCandidateDebt = useCrmStore((s) => s.openCandidateDebt());
  const pendingStaffCommission = useCrmStore((s) => s.pendingStaffCommission());

  const [termsDraft, setTermsDraft] = useState(termsText);
  const [tipDraft, setTipDraft] = useState(dailyTip);
  const [savedTerms, setSavedTerms] = useState(false);
  const [savedTip, setSavedTip] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("staff");
  const [newStaffId, setNewStaffId] = useState(STAFF_USERS[0].id);
  const [goalViewsDraft, setGoalViewsDraft] = useState(weeklyGoals.profileViews);
  const [goalPlaysDraft, setGoalPlaysDraft] = useState(weeklyGoals.audioPlays);

  if (role !== "admin") {
    return <p className="px-4 py-10 text-center text-sm text-[#8A8285]">אזור זה זמין למנהלת בלבד</p>;
  }

  const handleAddAllowlist = () => {
    if (!newEmail.trim()) return;
    addAllowlistEntry({
      email: newEmail.trim().toLowerCase(),
      name: newName.trim() || newEmail.trim(),
      role: newRole,
      staffId: newRole === "staff" ? newStaffId : null,
    });
    setNewEmail("");
    setNewName("");
  };

  const handleSaveGoals = () => {
    setWeeklyGoals({ profileViews: Number(goalViewsDraft) || 0, audioPlays: Number(goalPlaysDraft) || 0 });
  };

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

      {googleAuthEnabled && (
        <>
          <h2 className="mt-6 mb-3 flex items-center gap-1.5 text-[15px] font-bold text-[#3A3335]">
            <KeyRound size={17} /> הרשאות כניסה (Google)
          </h2>
          <div className="rounded-3xl border border-[#EAE5E3] bg-white p-4 shadow-[0_4px_18px_rgba(58,51,53,0.06)]">
            <div className="space-y-2">
              {authAllowlist.map((entry) => (
                <div key={entry.email} className="flex items-center justify-between rounded-xl bg-[#F6F5F4] px-3 py-2">
                  <div>
                    <p className="text-[13px] font-semibold text-[#3A3335]">{entry.name}</p>
                    <p dir="ltr" className="text-left text-[11px] text-[#8A8285]">
                      {entry.email} · {entry.role === "admin" ? "מנהלת" : "צוות"}
                    </p>
                  </div>
                  <button onClick={() => removeAllowlistEntry(entry.email)} aria-label="הסרה" className="rounded-full p-1.5 hover:bg-white">
                    <Trash2 size={14} className="text-[#C24545]" />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-3 space-y-2 border-t border-[#EAE5E3] pt-3">
              <input
                type="email"
                dir="ltr"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="name@gmail.com"
                className="w-full rounded-xl border border-[#EAE5E3] bg-white px-3 py-2 text-left text-sm outline-none focus:border-[#8C4A55]"
              />
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="שם תצוגה"
                className="w-full rounded-xl border border-[#EAE5E3] bg-white px-3 py-2 text-sm outline-none focus:border-[#8C4A55]"
              />
              <div className="flex gap-2">
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="flex-1 rounded-xl border border-[#EAE5E3] bg-white px-3 py-2 text-sm outline-none focus:border-[#8C4A55]"
                >
                  <option value="staff">צוות</option>
                  <option value="admin">מנהלת</option>
                </select>
                {newRole === "staff" && (
                  <select
                    value={newStaffId}
                    onChange={(e) => setNewStaffId(e.target.value)}
                    className="flex-1 rounded-xl border border-[#EAE5E3] bg-white px-3 py-2 text-sm outline-none focus:border-[#8C4A55]"
                  >
                    {STAFF_USERS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <Button variant="primary" className="w-full" onClick={handleAddAllowlist}>
                <UserPlus size={16} /> הוספת הרשאה
              </Button>
            </div>
          </div>
        </>
      )}

      <h2 className="mt-6 mb-3 flex items-center gap-1.5 text-[15px] font-bold text-[#3A3335]">
        <Wallet size={17} /> כספים
      </h2>
      <Link
        href="/crm/finance"
        className="mb-6 flex items-center justify-between rounded-3xl border border-[#EAE5E3] bg-white p-4 shadow-[0_4px_18px_rgba(58,51,53,0.06)] transition active:scale-[0.99]"
      >
        <div className="flex gap-6">
          <div>
            <p className="text-[11px] text-[#8A8285]">חובות מועמדים פתוחים</p>
            <p className="text-lg font-bold text-[#C24545]">₪{openCandidateDebt.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[11px] text-[#8A8285]">עמלות ממתינות לצוות</p>
            <p className="text-lg font-bold text-[#D6A93A]">₪{pendingStaffCommission.toLocaleString()}</p>
          </div>
        </div>
        <span className="text-[12px] font-semibold text-[#8C4A55]">לניהול ←</span>
      </Link>

      <h2 className="mt-6 mb-3 flex items-center gap-1.5 text-[15px] font-bold text-[#3A3335]">
        <Target size={17} /> יעדי פעילות שבועיים
      </h2>
      <div className="mb-6 rounded-3xl border border-[#EAE5E3] bg-white p-4 shadow-[0_4px_18px_rgba(58,51,53,0.06)]">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="mb-1 text-[12px] font-semibold text-[#3A3335]">צפיות בכרטיסים</p>
            <input
              type="number"
              value={goalViewsDraft}
              onChange={(e) => setGoalViewsDraft(e.target.value)}
              className="w-full rounded-xl border border-[#EAE5E3] bg-white px-3 py-2 text-sm outline-none focus:border-[#8C4A55]"
            />
          </div>
          <div>
            <p className="mb-1 text-[12px] font-semibold text-[#3A3335]">השמעות הקלטות</p>
            <input
              type="number"
              value={goalPlaysDraft}
              onChange={(e) => setGoalPlaysDraft(e.target.value)}
              className="w-full rounded-xl border border-[#EAE5E3] bg-white px-3 py-2 text-sm outline-none focus:border-[#8C4A55]"
            />
          </div>
        </div>
        <Button variant="ghost" className="mt-2 w-full" onClick={handleSaveGoals}>
          שמירת יעדים
        </Button>
      </div>

      <h2 className="mt-6 mb-3 text-[15px] font-bold text-[#3A3335]">מעורבות צוות (השבוע)</h2>
      <div className="space-y-3">
        {STAFF_USERS.map((s) => {
          const t = telemetry[s.id] || {};
          return (
            <div key={s.id} className="rounded-3xl border border-[#EAE5E3] bg-white p-4 shadow-[0_4px_18px_rgba(58,51,53,0.06)]">
              <p className="mb-3 text-sm font-bold text-[#3A3335]">{s.name}</p>
              <div className="space-y-2.5">
                <MetricBar label="צפיות בכרטיסי מועמדים" value={t.profileViews || 0} goal={weeklyGoals.profileViews} />
                <MetricBar label="השמעות הקלטות היכרות" value={t.audioPlays || 0} goal={weeklyGoals.audioPlays} />
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
