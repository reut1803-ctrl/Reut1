"use client";

import { useState } from "react";
import { addRep, updateRep, deleteRep, updateAdminPassword } from "../lib/store";

// ניהול נציגים וסיסמאות - הרשאת מנהלת בלבד.
export default function RepsManager({ data }) {
  const [name, setName] = useState("");
  const [institution, setInstitution] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [adminPw, setAdminPw] = useState(data.adminPassword || "");
  const [adminSaved, setAdminSaved] = useState(false);

  function add() {
    if (!name.trim()) return;
    addRep({ name, institution, phone, password: password || "1234" });
    setName("");
    setInstitution("");
    setPhone("");
    setPassword("");
  }

  function saveAdminPw() {
    if (!adminPw.trim()) return;
    updateAdminPassword(adminPw.trim());
    setAdminSaved(true);
    setTimeout(() => setAdminSaved(false), 1500);
  }

  return (
    <div className="space-y-3">
      {/* סיסמת מנהלת */}
      <div className="card space-y-2">
        <h2 className="text-lg font-bold text-roseDark">🔐 סיסמת מנהלת</h2>
        <p className="text-xs text-ink/60">זו הסיסמה שאיתה נכנסים כמנהלת. אפשר לשנות אותה כאן.</p>
        <input className="field-input" value={adminPw} onChange={(e) => setAdminPw(e.target.value)} placeholder="סיסמת מנהלת" />
        <button className="btn-primary" onClick={saveAdminPw}>{adminSaved ? "נשמר!" : "שמירת סיסמה"}</button>
      </div>

      <h2 className="text-lg font-bold text-roseDark">👥 ניהול נציגים</h2>

      {/* הוספת נציג - תמיד זמין למנהלת, בראש הרשימה */}
      <div className="card space-y-2 border-2 border-rose/40">
        <p className="text-base font-bold text-roseDark">➕ הוספת נציג חדש</p>
        <input className="field-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="שם הנציג" />
        <input className="field-input" value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="שם המוסד" />
        <input className="field-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="טלפון (לשיחה / SMS / וואטסאפ)" />
        <input className="field-input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="סיסמת הנציג" />
        <button className="btn-primary w-full" onClick={add}>הוספת נציג</button>
      </div>

      <p className="pt-2 text-sm font-semibold text-ink/70">נציגים קיימים:</p>
      {data.reps.map((r) => (
        <div key={r.id} className="card space-y-2">
          <input className="field-input" value={r.name} onChange={(e) => updateRep(r.id, { name: e.target.value })} placeholder="שם הנציג" />
          <input className="field-input" value={r.institution || ""} onChange={(e) => updateRep(r.id, { institution: e.target.value })} placeholder="שם המוסד" />
          <input className="field-input" value={r.phone || ""} onChange={(e) => updateRep(r.id, { phone: e.target.value })} placeholder="טלפון (לשיחה / SMS / וואטסאפ)" />
          <input className="field-input" value={r.password || ""} onChange={(e) => updateRep(r.id, { password: e.target.value })} placeholder="סיסמת הנציג" />
          <button className="btn-soft text-roseDark" onClick={() => { if (confirm("למחוק נציג?")) deleteRep(r.id); }}>🗑️ מחיקה</button>
        </div>
      ))}
    </div>
  );
}
