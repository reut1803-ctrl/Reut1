"use client";

import { useState } from "react";
import Link from "next/link";
import { BarChart3, Mail, ShieldCheck, Lightbulb, Check, KeyRound, Trash2, UserPlus, Target, Wallet } from "lucide-react";
import { useCrmStore } from "@/lib/crm/store";
import Button from "@/components/crm/ui/Button";

function metricColor(ratio) {
  if (ratio >= 1) return "bg-[#7FB33F]";
  if (ratio >= 0.5) return "bg-[#C9A227]";
  return "bg-[#C24545]";
}

function MetricBar({ label, value, goal }) {
  const ratio = goal === 0 ? 0 : value / goal;
  const pct = Math.min(100, Math.round(ratio * 100));
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[12px]">
        <span className="text-[#8B8175]">{label}</span>
        <span className="font-bold text-[#3B332A]">
          {value} / {goal}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[#F2EADE]">
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
  const tips = useCrmStore((s) => s.tips);
  const addTip = useCrmStore((s) => s.addTip);
  const removeTip = useCrmStore((s) => s.removeTip);
  const emailLog = useCrmStore((s) => s.emailLog);
  const authAllowlist = useCrmStore((s) => s.authAllowlist);
  const addAllowlistEntry = useCrmStore((s) => s.addAllowlistEntry);
  const removeAllowlistEntry = useCrmStore((s) => s.removeAllowlistEntry);
  const staffList = useCrmStore((s) => s.staffList());
  const weeklyGoals = useCrmStore((s) => s.weeklyGoals);
  const setWeeklyGoals = useCrmStore((s) => s.setWeeklyGoals);
  const openCandidateDebt = useCrmStore((s) => s.openCandidateDebt());
  const pendingStaffCommission = useCrmStore((s) => s.pendingStaffCommission());

  const [termsDraft, setTermsDraft] = useState(termsText);
  const [newTip, setNewTip] = useState("");
  const [savedTerms, setSavedTerms] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("staff");
  const [goalViewsDraft, setGoalViewsDraft] = useState(weeklyGoals.profileViews);
  const [goalPlaysDraft, setGoalPlaysDraft] = useState(weeklyGoals.audioPlays);

  if (role !== "admin") {
    return <p className="px-4 py-10 text-center text-sm text-[#8B8175]">אזור זה זמין למנהלת בלבד</p>;
  }

  const handleAddAllowlist = () => {
    if (!newEmail.trim()) return;
    addAllowlistEntry({
      email: newEmail.trim().toLowerCase(),
      name: newName.trim() || newEmail.trim(),
      role: newRole,
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
  const handleAddTip = () => {
    if (!newTip.trim()) return;
    addTip(newTip);
    setNewTip("");
  };

  return (
    <div className="px-4 py-6">
      <h1 className="flex items-center gap-2 text-xl font-bold text-[#3B332A]">
        <BarChart3 size={22} /> לוח בקרה
      </h1>
      <p className="mt-1 text-[13px] text-[#8B8175]">מעורבות צוות, נהלים, טיפים ומעקב מיילים</p>

      <h2 className="mt-6 mb-3 flex items-center gap-1.5 text-[15px] font-bold text-[#3B332A]">
        <KeyRound size={17} /> הרשאות כניסה (Google)
      </h2>
      <div className="rounded-3xl border border-[#E7DECD] bg-white p-4 shadow-[0_4px_18px_rgba(58,51,53,0.06)]">
        <div className="space-y-2">
          {authAllowlist.map((entry) => (
            <div key={entry.email} className="flex items-center justify-between rounded-xl bg-[#FAF6EE] px-3 py-2">
              <div>
                <p className="text-[13px] font-semibold text-[#3B332A]">{entry.name}</p>
                <p dir="ltr" className="text-left text-[11px] text-[#8B8175]">
                  {entry.email} · {entry.role === "admin" ? "מנהלת" : "צוות"}
                </p>
              </div>
              <button onClick={() => removeAllowlistEntry(entry.email)} aria-label="הסרה" className="rounded-full p-1.5 hover:bg-white">
                <Trash2 size={14} className="text-[#C24545]" />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-3 space-y-2 border-t border-[#E7DECD] pt-3">
          <input
            type="email"
            dir="ltr"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="name@gmail.com"
            className="w-full rounded-xl border border-[#E7DECD] bg-white px-3 py-2 text-left text-sm outline-none focus:border-[#6F4A2E]"
          />
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="שם תצוגה"
            className="w-full rounded-xl border border-[#E7DECD] bg-white px-3 py-2 text-sm outline-none focus:border-[#6F4A2E]"
          />
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            className="w-full rounded-xl border border-[#E7DECD] bg-white px-3 py-2 text-sm outline-none focus:border-[#6F4A2E]"
          >
            <option value="staff">צוות</option>
            <option value="admin">מנהלת</option>
          </select>
          <Button variant="primary" className="w-full" onClick={handleAddAllowlist}>
            <UserPlus size={16} /> הוספת הרשאה
          </Button>
        </div>
      </div>

      <h2 className="mt-6 mb-3 flex items-center gap-1.5 text-[15px] font-bold text-[#3B332A]">
        <Wallet size={17} /> כספים
      </h2>
      <Link
        href="/crm/finance"
        className="mb-6 flex items-center justify-between rounded-3xl border border-[#E7DECD] bg-white p-4 shadow-[0_4px_18px_rgba(58,51,53,0.06)] transition active:scale-[0.99]"
      >
        <div className="flex gap-6">
          <div>
            <p className="text-[11px] text-[#8B8175]">חובות מועמדים פתוחים</p>
            <p className="text-lg font-bold text-[#C24545]">₪{openCandidateDebt.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[11px] text-[#8B8175]">עמלות ממתינות לצוות</p>
            <p className="text-lg font-bold text-[#C9A227]">₪{pendingStaffCommission.toLocaleString()}</p>
          </div>
        </div>
        <span className="text-[12px] font-semibold text-[#6F4A2E]">לניהול ←</span>
      </Link>

      <h2 className="mt-6 mb-3 flex items-center gap-1.5 text-[15px] font-bold text-[#3B332A]">
        <Target size={17} /> יעדי פעילות שבועיים
      </h2>
      <div className="mb-6 rounded-3xl border border-[#E7DECD] bg-white p-4 shadow-[0_4px_18px_rgba(58,51,53,0.06)]">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="mb-1 text-[12px] font-semibold text-[#3B332A]">צפיות בכרטיסים</p>
            <input
              type="number"
              value={goalViewsDraft}
              onChange={(e) => setGoalViewsDraft(e.target.value)}
              className="w-full rounded-xl border border-[#E7DECD] bg-white px-3 py-2 text-sm outline-none focus:border-[#6F4A2E]"
            />
          </div>
          <div>
            <p className="mb-1 text-[12px] font-semibold text-[#3B332A]">השמעות הקלטות</p>
            <input
              type="number"
              value={goalPlaysDraft}
              onChange={(e) => setGoalPlaysDraft(e.target.value)}
              className="w-full rounded-xl border border-[#E7DECD] bg-white px-3 py-2 text-sm outline-none focus:border-[#6F4A2E]"
            />
          </div>
        </div>
        <Button variant="ghost" className="mt-2 w-full" onClick={handleSaveGoals}>
          שמירת יעדים
        </Button>
      </div>

      <h2 className="mt-6 mb-3 text-[15px] font-bold text-[#3B332A]">מעורבות צוות (השבוע)</h2>
      <div className="space-y-3">
        {staffList.map((s) => {
          const t = telemetry[s.email] || {};
          return (
            <div key={s.email} className="rounded-3xl border border-[#E7DECD] bg-white p-4 shadow-[0_4px_18px_rgba(58,51,53,0.06)]">
              <p className="mb-3 text-sm font-bold text-[#3B332A]">{s.name}</p>
              <div className="space-y-2.5">
                <MetricBar label="צפיות בכרטיסי מועמדים" value={t.profileViews || 0} goal={weeklyGoals.profileViews} />
                <MetricBar label="השמעות הקלטות היכרות" value={t.audioPlays || 0} goal={weeklyGoals.audioPlays} />
              </div>
            </div>
          );
        })}
      </div>

      <h2 className="mt-8 mb-3 flex items-center gap-1.5 text-[15px] font-bold text-[#3B332A]">
        <ShieldCheck size={17} /> תקנון סודיות
      </h2>
      <div className="rounded-3xl border border-[#E7DECD] bg-white p-4 shadow-[0_4px_18px_rgba(58,51,53,0.06)]">
        <textarea
          value={termsDraft}
          onChange={(e) => setTermsDraft(e.target.value)}
          rows={7}
          className="w-full resize-none rounded-xl border border-[#E7DECD] bg-white px-3 py-2 text-[13px] leading-relaxed outline-none focus:border-[#6F4A2E]"
        />
        <Button variant="primary" className="mt-2 w-full" onClick={handleSaveTerms}>
          {savedTerms ? <Check size={16} /> : null}
          {savedTerms ? "נשמר!" : "שמירת תקנון"}
        </Button>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {staffList.map((s) => (
            <span
              key={s.email}
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                termsAccepted[s.email] ? "bg-[#EEF6E1] text-[#5E9128]" : "bg-[#FAF6EE] text-[#B4AA9C]"
              }`}
            >
              {s.name} {termsAccepted[s.email] ? "✓ אישרה" : "טרם אישרה"}
            </span>
          ))}
        </div>
      </div>

      <h2 className="mt-8 mb-3 flex items-center gap-1.5 text-[15px] font-bold text-[#3B332A]">
        <Lightbulb size={17} /> טיפים לצוות ({tips.length})
      </h2>
      <div className="rounded-3xl border border-[#E7DECD] bg-white p-4 shadow-[0_4px_18px_rgba(58,51,53,0.06)]">
        <div className="space-y-2">
          {tips.map((tip, i) => (
            <div key={i} className="flex items-start justify-between gap-2 rounded-xl bg-[#FAF6EE] px-3 py-2">
              <p className="text-[13px] leading-relaxed text-[#3B332A]">{tip}</p>
              <button onClick={() => removeTip(i)} aria-label="הסרת טיפ" className="shrink-0 rounded-full p-1 hover:bg-white">
                <Trash2 size={14} className="text-[#C24545]" />
              </button>
            </div>
          ))}
          {tips.length === 0 && <p className="text-center text-[12px] text-[#B4AA9C]">אין עדיין טיפים</p>}
        </div>
        <div className="mt-3 flex gap-2 border-t border-[#E7DECD] pt-3">
          <input
            type="text"
            value={newTip}
            onChange={(e) => setNewTip(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddTip()}
            placeholder="טיפ חדש..."
            className="flex-1 rounded-xl border border-[#E7DECD] bg-white px-3 py-2 text-sm outline-none focus:border-[#6F4A2E]"
          />
          <Button variant="primary" onClick={handleAddTip}>
            הוספה
          </Button>
        </div>
      </div>

      <h2 className="mt-8 mb-3 flex items-center gap-1.5 text-[15px] font-bold text-[#3B332A]">
        <Mail size={17} /> יומן מיילים (הדגמה)
      </h2>
      {emailLog.length === 0 ? (
        <p className="text-center text-sm text-[#8B8175]">עדיין לא נשלחו מיילים</p>
      ) : (
        <div className="space-y-2">
          {emailLog.map((m) => (
            <div key={m.id} className="rounded-2xl border border-[#E7DECD] bg-white p-3 text-[12px]">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#3B332A]">{m.subject}</span>
                <span className="text-[#B4AA9C]">{new Date(m.date).toLocaleString("he-IL")}</span>
              </div>
              <p className="mt-1 text-[#8B8175]">{m.body}</p>
              <p className="mt-1 text-[10px] text-[#B4AA9C]">אל: {m.to}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
