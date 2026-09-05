"use client";

import { useState } from "react";
import { updateAdmin2, updateAdminPassword } from "../lib/store";

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

  return (
    <div className="space-y-3">
      {/* שינוי סיסמת המנהלת הראשית - מאובטח */}
      <div className="card space-y-2">
        <h2 className="text-lg font-bold text-roseDark">🔐 סיסמת המנהלת הראשית שלך</h2>
        <p className="text-xs text-ink/60">מטעמי אבטחה הסיסמה הנוכחית אינה מוצגת. להחלפה — הזיני את הנוכחית ואת החדשה.</p>
        <input className="field-input" type="password" autoComplete="current-password" value={curPw} onChange={(e) => setCurPw(e.target.value)} placeholder="סיסמה נוכחית" />
        <input className="field-input" type="password" autoComplete="new-password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="סיסמה חדשה" />
        <input className="field-input" type="password" autoComplete="new-password" value={confPw} onChange={(e) => setConfPw(e.target.value)} placeholder="אימות סיסמה חדשה" />
        <button className="btn-primary" onClick={changeAdminPw}>עדכון סיסמה</button>
        {pwMsg && <p className="text-sm font-medium text-roseDark">{pwMsg}</p>}
      </div>

      {/* ניהול מנהלת נוספת */}
      <div className="card space-y-2">
        <h2 className="text-lg font-bold text-roseDark">👑 ניהול מנהלות (בקרה עליונה)</h2>
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
    </div>
  );
}
