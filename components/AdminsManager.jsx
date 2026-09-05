"use client";

import { useState } from "react";
import { updateAdmin2 } from "../lib/store";

// ניהול מנהלות (Admins) - נגיש לבעלת הבקרה (Supervisor) בלבד.
export default function AdminsManager({ data }) {
  const [name, setName] = useState(data.admin2Name || "");
  const [password, setPassword] = useState(data.admin2Password || "");
  const [saved, setSaved] = useState("");

  function save() {
    if (!password.trim()) { setSaved("יש להזין סיסמה למנהלת הנוספת."); return; }
    updateAdmin2(name.trim(), password.trim());
    setSaved("✓ נשמר. המנהלת הנוספת יכולה להיכנס עם הסיסמה הזו.");
    setTimeout(() => setSaved(""), 2500);
  }

  function remove() {
    if (!confirm("להסיר את המנהלת הנוספת? היא לא תוכל להיכנס יותר.")) return;
    updateAdmin2("", "");
    setName(""); setPassword("");
    setSaved("המנהלת הנוספת הוסרה.");
    setTimeout(() => setSaved(""), 2500);
  }

  return (
    <div className="card space-y-2">
      <h2 className="text-lg font-bold text-roseDark">👑 ניהול מנהלות (בקרה עליונה)</h2>
      <p className="text-xs text-ink/60">
        את מוגדרת כ<b>מנהלת ראשית ובקרה (Supervisor)</b>. כאן אפשר להוסיף <b>מנהלת נוספת</b> עם גישת ניהול מלאה לצידך.
        רק את (הבקרה) רואה ומנהלת את המסך הזה.
      </p>
      <input className="field-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="שם המנהלת הנוספת (לא חובה)" />
      <input className="field-input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="סיסמת כניסה למנהלת הנוספת" />
      <div className="flex flex-wrap gap-2">
        <button className="btn-primary" onClick={save}>שמירת מנהלת נוספת</button>
        {(data.admin2Password || data.admin2Name) && <button className="btn-soft text-roseDark" onClick={remove}>הסרה</button>}
      </div>
      {saved && <p className="text-sm font-medium text-roseDark">{saved}</p>}
    </div>
  );
}
