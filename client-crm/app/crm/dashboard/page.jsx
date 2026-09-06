"use client";

import { useState } from "react";
import Link from "next/link";
import { BarChart3, Mail, ShieldCheck, Lightbulb, Check, KeyRound, Trash2, UserPlus, Target, Wallet, ChevronLeft, Stethoscope, Sheet } from "lucide-react";
import { useCrmStore, allowlistEmail, isBrokenAllowlistEntry } from "@/lib/crm/store";
import { whatsappNumber } from "@/lib/crm/brainstorm";
import Button from "@/components/crm/ui/Button";

function metricColor(ratio) {
  if (ratio >= 1) return "bg-[#8C9A78]";
  if (ratio >= 0.5) return "bg-[#C9A063]";
  return "bg-[#C4584C]";
}

function MetricBar({ label, value, goal }) {
  const ratio = goal === 0 ? 0 : value / goal;
  const pct = Math.min(100, Math.round(ratio * 100));
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[12px]">
        <span className="text-[#8C7B6B]">{label}</span>
        <span className="font-bold text-[#5A4A3C]">
          {value} / {goal}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[#F0EBE9]">
        <div className={`h-full rounded-full transition-all ${metricColor(ratio)}`} style={{ width: `${Math.max(pct, value > 0 ? 4 : 0)}%` }} />
      </div>
    </div>
  );
}

// רשומות שנוספו לפני שהטלפון הפך לשדה חובה. אפשר להשלים את המספר כאן,
// כדי שאיש/אשת הצוות יקבל/תקבל עדכון בוואטסאפ על סבב סיעור מוחות חדש.
function MissingPhoneRow({ entry }) {
  const setAllowlistPhone = useCrmStore((s) => s.setAllowlistPhone);
  const [value, setValue] = useState(entry.phone || "");
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const valid = !!whatsappNumber(value);

  const save = async () => {
    if (!valid || saving) return;
    setSaving(true);
    setFailed(false);
    try {
      await setAllowlistPhone(allowlistEmail(entry), value.trim());
    } catch {
      setFailed(true);
    }
    setSaving(false);
  };

  return (
    <div className="mt-2 rounded-lg bg-[#FDF6EC] px-2.5 py-2">
      <p className="text-[11px] leading-relaxed text-[#8A6A32]">
        חסר מספר טלפון. בלעדיו אי אפשר לעדכן בוואטסאפ על סבב סיעור מוחות חדש.
      </p>
      <div className="mt-1.5 flex gap-1.5">
        <input
          type="tel"
          dir="ltr"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="050-1234567"
          className="min-w-0 flex-1 rounded-lg border border-[#EADCCB] bg-white px-2.5 py-1.5 text-left text-[12px] outline-none focus:border-[#C06E5E]"
        />
        <button
          onClick={save}
          disabled={!valid || saving}
          className="shrink-0 rounded-lg bg-[#C06E5E] px-3 py-1.5 text-[11px] font-semibold text-white disabled:opacity-40"
        >
          {saving ? "שומרת" : "שמירה"}
        </button>
      </div>
      {failed && <p className="mt-1 text-[10px] text-[#C4584C]">השמירה נכשלה, נסי שוב.</p>}
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
  const repairAllowlistEntry = useCrmStore((s) => s.repairAllowlistEntry);
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
  const [newPhone, setNewPhone] = useState("");
  const [adding, setAdding] = useState(false);
  const [addResult, setAddResult] = useState(null);
  const [goalViewsDraft, setGoalViewsDraft] = useState(weeklyGoals.profileViews);
  const [goalPlaysDraft, setGoalPlaysDraft] = useState(weeklyGoals.audioPlays);

  if (role !== "admin") {
    return <p className="px-4 py-10 text-center text-sm text-[#8C7B6B]">אזור זה זמין למנהלת בלבד</p>;
  }

  // חשוב: בעבר ההוספה נשלחה בלי לחכות לתשובה ובלי לבדוק אם היא נכשלה. אם השרת
  // דחה את הכתיבה, השדות פשוט התרוקנו והכל נראה תקין - בזמן שאיש הצוות לא נוסף
  // בפועל ולא הצליח להיכנס. כאן ממתינים לתשובה ומדווחים בבירור מה קרה.
  const handleAddAllowlist = async () => {
    const email = newEmail.trim().toLowerCase();
    if (!email) return;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setAddResult({ ok: false, text: "הכתובת אינה נראית ככתובת מייל תקינה. בדקי אותה שוב." });
      return;
    }
    // הטלפון הוא שדה חובה: בלעדיו אי אפשר לעדכן את איש/אשת הצוות בוואטסאפ
    // כשנפתח סבב סיעור מוחות חדש.
    if (!whatsappNumber(newPhone)) {
      setAddResult({ ok: false, text: "צריך מספר טלפון נייד תקין (למשל 050-1234567). בלעדיו אי אפשר לשלוח עדכונים בוואטסאפ." });
      return;
    }
    setAdding(true);
    setAddResult(null);
    try {
      await addAllowlistEntry({ email, name: newName.trim() || email, role: newRole, phone: newPhone.trim() });
      setNewEmail("");
      setNewName("");
      setNewPhone("");
      setAddResult({ ok: true, text: `${email} נוסף/ה בהצלחה. אפשר לשלוח לו/ה את הקישור לאתר.` });
    } catch (err) {
      setAddResult({
        ok: false,
        text:
          err?.code === "permission-denied"
            ? "השרת דחה את ההוספה. אין לחשבון שלך הרשאת מנהלת בשרת עצמו - כדאי שנבדוק את זה יחד."
            : "ההוספה לא נשמרה בגלל תקלת תקשורת. נסי שוב בעוד רגע, ובדקי שהרשומה אכן מופיעה ברשימה למעלה.",
      });
    }
    setAdding(false);
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
      <h1 className="flex items-center gap-2 text-xl font-bold text-[#5A4A3C]">
        <BarChart3 size={22} /> לוח בקרה
      </h1>
      <p className="mt-1 text-[13px] text-[#8C7B6B]">מעורבות צוות, נהלים, טיפים ומעקב מיילים</p>

      <h2 className="mt-6 mb-3 flex items-center gap-1.5 text-[15px] font-bold text-[#5A4A3C]">
        <KeyRound size={17} /> הרשאות כניסה (Google)
      </h2>
      <div className="rounded-3xl border border-[#EADCCB] bg-white p-4 shadow-[0_4px_18px_rgba(58,51,53,0.06)]">
        <div className="space-y-2">
          {authAllowlist.map((entry) => (
            <div key={entry.id} className="rounded-xl bg-[#FBF3EA] px-3 py-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-semibold text-[#5A4A3C]">{entry.name || allowlistEmail(entry)}</p>
                  <p dir="ltr" className="text-left text-[11px] text-[#8C7B6B]">
                    {allowlistEmail(entry)} · {entry.role === "admin" ? "מנהלת" : "צוות"}
                  </p>
                  {entry.phone && (
                    <p dir="ltr" className="text-left text-[11px] text-[#8C7B6B]">{entry.phone}</p>
                  )}
                </div>
                <button onClick={() => removeAllowlistEntry(entry.id)} aria-label="הסרה" className="rounded-full p-1.5 hover:bg-white">
                  <Trash2 size={14} className="text-[#C4584C]" />
                </button>
              </div>
              {!whatsappNumber(entry.phone) && <MissingPhoneRow entry={entry} />}
              {isBrokenAllowlistEntry(entry) && (
                <div className="mt-2 rounded-lg bg-[#FBEDE9] px-2.5 py-2">
                  <p className="text-[11px] leading-relaxed text-[#C4584C]">
                    בכתובת הזו נשמר תו או רווח מיותר, ולכן הכניסה לא תזוהה. לחצי לתיקון אוטומטי.
                  </p>
                  <button
                    onClick={() => repairAllowlistEntry(entry)}
                    className="mt-1.5 rounded-lg bg-[#C4584C] px-3 py-1.5 text-[11px] font-semibold text-white"
                  >
                    תיקון הכתובת
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-3 space-y-2 border-t border-[#EADCCB] pt-3">
          <input
            type="email"
            dir="ltr"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="name@gmail.com"
            className="w-full rounded-xl border border-[#EADCCB] bg-white px-3 py-2 text-left text-sm outline-none focus:border-[#C06E5E]"
          />
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="שם תצוגה"
            className="w-full rounded-xl border border-[#EADCCB] bg-white px-3 py-2 text-sm outline-none focus:border-[#C06E5E]"
          />
          <input
            type="tel"
            dir="ltr"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            placeholder="050-1234567 (חובה)"
            className="w-full rounded-xl border border-[#EADCCB] bg-white px-3 py-2 text-left text-sm outline-none focus:border-[#C06E5E]"
          />
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            className="w-full rounded-xl border border-[#EADCCB] bg-white px-3 py-2 text-sm outline-none focus:border-[#C06E5E]"
          >
            <option value="staff">צוות</option>
            <option value="admin">מנהלת</option>
          </select>
          <Button variant="primary" className="w-full" onClick={handleAddAllowlist} disabled={adding}>
            <UserPlus size={16} /> {adding ? "שומרת..." : "הוספת הרשאה"}
          </Button>

          {addResult && (
            <p
              className={`rounded-xl px-3 py-2 text-[11px] leading-relaxed ${
                addResult.ok ? "bg-[#E8F6EF] text-[#6F7D5C]" : "bg-[#FBEDE9] text-[#C4584C]"
              }`}
            >
              {addResult.text}
            </p>
          )}

          <p className="text-[11px] leading-relaxed text-[#8C7B6B]">
            אחרי ההוספה, ודאי שהשם מופיע ברשימה שלמעלה. הכתובת חייבת להיות בדיוק אותה כתובת גוגל
            שאיתה הוא/היא נכנס/ת - אות באות.
          </p>
        </div>
      </div>

      <Link
        href="/crm/sheet-import"
        className="mt-6 flex items-center justify-between rounded-3xl border border-[#EADCCB] bg-white p-4 shadow-[0_4px_18px_rgba(58,51,53,0.06)] transition active:scale-[0.99]"
      >
        <div className="flex items-center gap-2">
          <Sheet size={17} className="text-[#C06E5E]" />
          <div>
            <p className="text-[13px] font-bold text-[#5A4A3C]">ייבוא מגיליון Google</p>
            <p className="text-[11px] text-[#8C7B6B]">שאיבת מועמדים חדשים מתוך גיליון התשובות</p>
          </div>
        </div>
        <ChevronLeft size={18} className="text-[#C06E5E]" />
      </Link>

      <Link
        href="/crm/diagnostics"
        className="mt-6 flex items-center justify-between rounded-3xl border border-[#EADCCB] bg-white p-4 shadow-[0_4px_18px_rgba(58,51,53,0.06)] transition active:scale-[0.99]"
      >
        <div className="flex items-center gap-2">
          <Stethoscope size={17} className="text-[#C06E5E]" />
          <div>
            <p className="text-[13px] font-bold text-[#5A4A3C]">בדיקת מערכת</p>
            <p className="text-[11px] text-[#8C7B6B]">איתור תקלות בהעלאת קבצים</p>
          </div>
        </div>
        <ChevronLeft size={18} className="text-[#C06E5E]" />
      </Link>

      <h2 className="mt-6 mb-3 flex items-center gap-1.5 text-[15px] font-bold text-[#5A4A3C]">
        <Wallet size={17} /> כספים
      </h2>
      <Link
        href="/crm/finance"
        className="mb-6 flex items-center justify-between rounded-3xl border border-[#EADCCB] bg-white p-4 shadow-[0_4px_18px_rgba(58,51,53,0.06)] transition active:scale-[0.99]"
      >
        <div className="flex gap-6">
          <div>
            <p className="text-[11px] text-[#8C7B6B]">חובות מועמדים פתוחים</p>
            <p className="text-lg font-bold text-[#C4584C]">₪{openCandidateDebt.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[11px] text-[#8C7B6B]">עמלות ממתינות לצוות</p>
            <p className="text-lg font-bold text-[#C9A063]">₪{pendingStaffCommission.toLocaleString()}</p>
          </div>
        </div>
        <span className="text-[12px] font-semibold text-[#C06E5E]">לניהול ←</span>
      </Link>

      <h2 className="mt-6 mb-3 flex items-center gap-1.5 text-[15px] font-bold text-[#5A4A3C]">
        <Target size={17} /> יעדי פעילות שבועיים
      </h2>
      <div className="mb-6 rounded-3xl border border-[#EADCCB] bg-white p-4 shadow-[0_4px_18px_rgba(58,51,53,0.06)]">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="mb-1 text-[12px] font-semibold text-[#5A4A3C]">צפיות בכרטיסים</p>
            <input
              type="number"
              value={goalViewsDraft}
              onChange={(e) => setGoalViewsDraft(e.target.value)}
              className="w-full rounded-xl border border-[#EADCCB] bg-white px-3 py-2 text-sm outline-none focus:border-[#C06E5E]"
            />
          </div>
          <div>
            <p className="mb-1 text-[12px] font-semibold text-[#5A4A3C]">השמעות הקלטות</p>
            <input
              type="number"
              value={goalPlaysDraft}
              onChange={(e) => setGoalPlaysDraft(e.target.value)}
              className="w-full rounded-xl border border-[#EADCCB] bg-white px-3 py-2 text-sm outline-none focus:border-[#C06E5E]"
            />
          </div>
        </div>
        <Button variant="ghost" className="mt-2 w-full" onClick={handleSaveGoals}>
          שמירת יעדים
        </Button>
      </div>

      <h2 className="mt-6 mb-3 text-[15px] font-bold text-[#5A4A3C]">מעורבות צוות (השבוע)</h2>
      <div className="space-y-3">
        {staffList.map((s) => {
          const t = telemetry[s.email] || {};
          return (
            <div key={s.email} className="rounded-3xl border border-[#EADCCB] bg-white p-4 shadow-[0_4px_18px_rgba(58,51,53,0.06)]">
              <p className="mb-3 text-sm font-bold text-[#5A4A3C]">{s.name}</p>
              <div className="space-y-2.5">
                <MetricBar label="צפיות בכרטיסי מועמדים" value={t.profileViews || 0} goal={weeklyGoals.profileViews} />
                <MetricBar label="השמעות הקלטות היכרות" value={t.audioPlays || 0} goal={weeklyGoals.audioPlays} />
              </div>
            </div>
          );
        })}
      </div>

      <h2 className="mt-8 mb-3 flex items-center gap-1.5 text-[15px] font-bold text-[#5A4A3C]">
        <ShieldCheck size={17} /> תקנון סודיות
      </h2>
      <div className="rounded-3xl border border-[#EADCCB] bg-white p-4 shadow-[0_4px_18px_rgba(58,51,53,0.06)]">
        <textarea
          value={termsDraft}
          onChange={(e) => setTermsDraft(e.target.value)}
          rows={7}
          className="w-full resize-none rounded-xl border border-[#EADCCB] bg-white px-3 py-2 text-[13px] leading-relaxed outline-none focus:border-[#C06E5E]"
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
                termsAccepted[s.email] ? "bg-[#EDF2E6] text-[#6F7D5C]" : "bg-[#FBF3EA] text-[#C3B5A5]"
              }`}
            >
              {s.name} {termsAccepted[s.email] ? "✓ אישרה" : "טרם אישרה"}
            </span>
          ))}
        </div>
      </div>

      <h2 className="mt-8 mb-3 flex items-center gap-1.5 text-[15px] font-bold text-[#5A4A3C]">
        <Lightbulb size={17} /> טיפים לצוות ({tips.length})
      </h2>
      <div className="rounded-3xl border border-[#EADCCB] bg-white p-4 shadow-[0_4px_18px_rgba(58,51,53,0.06)]">
        <div className="space-y-2">
          {tips.map((tip, i) => (
            <div key={i} className="flex items-start justify-between gap-2 rounded-xl bg-[#FBF3EA] px-3 py-2">
              <p className="text-[13px] leading-relaxed text-[#5A4A3C]">{tip}</p>
              <button onClick={() => removeTip(i)} aria-label="הסרת טיפ" className="shrink-0 rounded-full p-1 hover:bg-white">
                <Trash2 size={14} className="text-[#C4584C]" />
              </button>
            </div>
          ))}
          {tips.length === 0 && <p className="text-center text-[12px] text-[#C3B5A5]">אין עדיין טיפים</p>}
        </div>
        <div className="mt-3 flex gap-2 border-t border-[#EADCCB] pt-3">
          <input
            type="text"
            value={newTip}
            onChange={(e) => setNewTip(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddTip()}
            placeholder="טיפ חדש..."
            className="flex-1 rounded-xl border border-[#EADCCB] bg-white px-3 py-2 text-sm outline-none focus:border-[#C06E5E]"
          />
          <Button variant="primary" onClick={handleAddTip}>
            הוספה
          </Button>
        </div>
      </div>

      <h2 className="mt-8 mb-3 flex items-center gap-1.5 text-[15px] font-bold text-[#5A4A3C]">
        <Mail size={17} /> יומן מיילים (הדגמה)
      </h2>
      {emailLog.length === 0 ? (
        <p className="text-center text-sm text-[#8C7B6B]">עדיין לא נשלחו מיילים</p>
      ) : (
        <div className="space-y-2">
          {emailLog.map((m) => (
            <div key={m.id} className="rounded-2xl border border-[#EADCCB] bg-white p-3 text-[12px]">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#5A4A3C]">{m.subject}</span>
                <span className="text-[#C3B5A5]">{new Date(m.date).toLocaleString("he-IL")}</span>
              </div>
              <p className="mt-1 text-[#8C7B6B]">{m.body}</p>
              <p className="mt-1 text-[10px] text-[#C3B5A5]">אל: {m.to}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
