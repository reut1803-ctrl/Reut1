"use client";

import { useState } from "react";
import { addRep, updateRep, deleteRep } from "../lib/store";

// ניהול נציגים - הרשאת מנהלת בלבד.
export default function RepsManager({ data }) {
  const [name, setName] = useState("");
  const [institution, setInstitution] = useState("");
  const [phone, setPhone] = useState("");

  function add() {
    if (!name.trim()) return;
    addRep({ name, institution, phone });
    setName("");
    setInstitution("");
    setPhone("");
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-roseDark">👥 ניהול נציגים</h2>
      {data.reps.map((r) => (
        <div key={r.id} className="card space-y-2">
          <input className="field-input" value={r.name} onChange={(e) => updateRep(r.id, { name: e.target.value })} placeholder="שם הנציג" />
          <input className="field-input" value={r.institution || ""} onChange={(e) => updateRep(r.id, { institution: e.target.value })} placeholder="שם המוסד" />
          <input className="field-input" value={r.phone || ""} onChange={(e) => updateRep(r.id, { phone: e.target.value })} placeholder="טלפון (לוואטסאפ)" />
          <button className="btn-soft text-roseDark" onClick={() => { if (confirm("למחוק נציג?")) deleteRep(r.id); }}>🗑️ מחיקה</button>
        </div>
      ))}
      <div className="card space-y-2">
        <p className="font-semibold text-ink">הוספת נציג</p>
        <input className="field-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="שם הנציג" />
        <input className="field-input" value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="שם המוסד" />
        <input className="field-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="טלפון (לוואטסאפ)" />
        <button className="btn-primary" onClick={add}>הוספה</button>
      </div>
    </div>
  );
}
