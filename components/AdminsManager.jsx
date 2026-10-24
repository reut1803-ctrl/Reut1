"use client";

import { useState } from "react";
import { updateAdmin2, updateAdminPassword, updateFounder } from "../lib/store";
import { KeyRound, Crown, Sparkles } from "lucide-react";

// ניהול מנהלות (Admins) + סיסמת המנהלת הראשית - נגיש לבקרה (Supervisor) בלבד.
export default function AdminsManager({ data }) {
  // ----- שינוי סיסמת המנהלת הראשית (מאובטח: נוכחית + חדשה, ללא הצגת הקיימת) -----
  const [curPw, setCurPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confPw, setConfPw] = useState("");
  const [pwMsg, setPwMsg] = useState("");

  function changeAdminPw() {
    if (curPw !== (data.adminPassword || "")) { setPwMsg("הסיסמה הנוכחית שגויה."); return; }
    if (!newPw.trim()) { setPwMsg("יש להזין סיסמה חדשה."); return; }
    if (newPw !== confPw) { setPwMsg("הסיסמה החדשה ואימותה אינם תואמים."); return; }
    updateAdminPassword(newPw.trim());
    setCurPw(""); setNewPw(""); setConfPw("");
    setPwMsg("✓ סיסמת המנהלת עודכנה.");
    setTimeout(() => setPwMsg(""), 2500);
  }

  // ----- מנהלת נוספת -----
  const [name, setName] = useState(data.admin2Name || "");
  const [password, setPassword] = useState(""); // לא טוענים את הסיסמה הקיימת
  const [saved, setSaved] = useState("");

  function saveAdmin2() {
    if (!password.trim()) { setSaved("יש להזין סיסמה למנהלת הנוספת."); return; }
    updateAdmin2(name.trim(), password.trim());
    setPassword("");
    setSaved("✓ נשמר. המנהלת הנוספת יכולה להיכנס עם הסיסמה החדשה.");
    setTimeout(() => setSaved(""), 2500);
  }

  function removeAdmin2() {
    if (!confirm("להסיר את המנהלת הנוספת? היא לא תוכל להיכנס יותר.")) return;
    updateAdmin2("", "");
    setName(""); setPassword("");
    setSaved("המנהלת הנוספת הוסרה.");
    setTimeout(() => setSaved(""), 2500);
  }

  // ----- יזמית הפרויקט (גישה מלאה לכל הנתונים) -----
  const [fName, setFName] = useState(data.founderName || "");
  const [fPassword, setFPassword] = useState("");
  const [fSaved, setFSaved] = useState("");
  const flash = (m) => { setFSaved(m); setTimeout(() => setFSaved(""), 3000); };

  function saveFounder() {
    const pw = fPassword.trim();
    if (!pw) { flash("יש להזין סיסמה ליזמית."); return; }
    // הכניסה מזהה לפי סיסמה — סיסמה כפולה הייתה מכניסה אותה בתפקיד אחר
    const taken = [data.adminPassword, data.admin2Password, data.viewerPassword, ...(data.reps || []).map((r) => r.password)]
      .some((x) => x && x.toString().trim() === pw);
    if (taken) { flash("הסיסמה הזו כבר בשימוש אצל מישהו אחר במערכת — בחרי סיסמה אחרת."); return; }
    updateFounder(fName.trim(), pw);
    setFPassword("");
    flash("✓ נשמר. היזמית יכולה להיכנס עם הסיסמה החדשה.");
  }

  function removeFounder() {
    if (!confirm("להסיר את גישת היזמית? היא לא תוכל להיכנס יותר.")) return;
    updateFounder("", "");
    setFName(""); setFPassword("");
    flash("גישת היזמית הוסרה.");
  }

  return (
    <div className="space-y-3">
      {/* שינוי סיסמת המנהלת הראשית - מאובטח */}
      <div className="card space-y-2">
        <h2 className="flex items-center gap-2 text-lg font-bold text-roseDark"><KeyRound className="h-5 w-5" strokeWidth={1.75} /> סיסמת המנהלת הראשית שלך</h2>
        <p className="text-xs text-ink/60">מטעמי אבטחה הסיסמה הנוכחית אינה מוצגת. להחלפה — הזיני את הנוכחית ואת החדשה.</p>
        <input className="field-input" type="password" autoComplete="current-password" value={curPw} onChange={(e) => setCurPw(e.target.value)} placeholder="סיסמה נוכחית" />
        <input className="field-input" type="password" autoComplete="new-password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="סיסמה חדשה" />
        <input className="field-input" type="password" autoComplete="new-password" value={confPw} onChange={(e) => setConfPw(e.target.value)} placeholder="אימות סיסמה חדשה" />
        <button className="btn-primary" onClick={changeAdminPw}>עדכון סיסמה</button>
        {pwMsg && <p className="text-sm font-medium text-roseDark">{pwMsg}</p>}
      </div>

      {/* ניהול מנהלת נוספת */}
      <div className="card space-y-2">
        <h2 className="flex items-center gap-2 text-lg font-bold text-roseDark"><Crown className="h-5 w-5" strokeWidth={1.75} /> ניהול מנהלות (בקרה עליונה)</h2>
        <p className="text-xs text-ink/60">
          את מוגדרת כ<b>מנהלת ראשית ובקרה (Supervisor)</b>. כאן אפשר להוסיף <b>מנהלת נוספת</b> עם גישת ניהול מלאה לצידך.
          רק את (הבקרה) רואה ומנהלת את המסך הזה — ולמנהלת הנוספת אין גישה לסיסמאות שלך.
        </p>
        {(data.admin2Name || data.admin2Password) && (
          <div className="rounded-2xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
            מנהלת נוספת פעילה{data.admin2Name ? `: ${data.admin2Name}` : ""}
          </div>
        )}
        <input className="field-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="שם המנהלת הנוספת (לא חובה)" />
        <input className="field-input" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="סיסמה חדשה למנהלת הנוספת" />
        <div className="flex flex-wrap gap-2">
          <button className="btn-primary" onClick={saveAdmin2}>שמירה</button>
          {(data.admin2Password || data.admin2Name) && <button className="btn-soft text-roseDark" onClick={removeAdmin2}>הסרה</button>}
        </div>
        {saved && <p className="text-sm font-medium text-roseDark">{saved}</p>}
      </div>

      {/* יזמית הפרויקט */}
      <div className="card space-y-2">
        <h2 className="flex items-center gap-2 text-lg font-bold text-roseDark"><Sparkles className="h-5 w-5" strokeWidth={1.75} /> יזמית הפרויקט</h2>
        <p className="text-xs text-ink/60">
          ליזמית יש <b>גישה מלאה וגורפת</b> לכל הנתונים: כל המועמדים, ההתאמות, המשימות, הדיווחים והסיכומים החודשיים, ויומן הפעילות —
          של כל השגרירים, בלי הגבלה לשגריר מסוים. רק מסך הסיסמאות הזה נשאר אצלך בלבד.
        </p>
        {(data.founderName || data.founderPassword) && (
          <div className="rounded-2xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
            גישת יזמית פעילה{data.founderName ? `: ${data.founderName}` : ""}
          </div>
        )}
        <input className="field-input" value={fName} onChange={(e) => setFName(e.target.value)} placeholder="שם היזמית (למשל: לימור)" />
        <input className="field-input" type="password" autoComplete="new-password" value={fPassword} onChange={(e) => setFPassword(e.target.value)} placeholder="סיסמה חדשה ליזמית" />
        <div className="flex flex-wrap gap-2">
          <button className="btn-primary" onClick={saveFounder}>שמירה</button>
          {(data.founderPassword || data.founderName) && <button className="btn-soft text-roseDark" onClick={removeFounder}>הסרה</button>}
        </div>
        {fSaved && <p className="text-sm font-medium text-roseDark">{fSaved}</p>}
      </div>
    </div>
  );
}
