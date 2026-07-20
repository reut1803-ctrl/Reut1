"use client";

import { useState } from "react";
import { addRep, updateRep, deleteRep, updateAdminPassword, updateViewerPassword } from "../lib/store";

// ניהול נציגים וסיסמאות - הרשאת מנהלת בלבד.
export default function RepsManager({ data }) {
  const [name, setName] = useState("");
  const [institution, setInstitution] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [adminPw, setAdminPw] = useState(data.adminPassword || "");
  const [adminSaved, setAdminSaved] = useState(false);

  const [viewerPw, setViewerPw] = useState(data.viewerPassword || "");
  const [viewerSaved, setViewerSaved] = useState(false);

  // הנציג/ה שפתוח/ה כרגע לעריכה (הרשימה מכווצת כברירת מחדל כדי לא להעמיס)
  const [openRepId, setOpenRepId] = useState(null);
  const [showReps, setShowReps] = useState(false);

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

  function saveViewerPw() {
    if (!viewerPw.trim()) return;
    updateViewerPassword(viewerPw.trim());
    setViewerSaved(true);
    setTimeout(() => setViewerSaved(false), 1500);
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

      {/* סיסמת צפייה בלבד */}
      <div className="card space-y-2">
        <h2 className="text-lg font-bold text-roseDark">👁️ סיסמת צפייה בלבד</h2>
        <p className="text-xs text-ink/60">מי שנכנס עם סיסמה זו יוכל לצפות במועמדים בלבד — בלי לערוך, להוסיף או למחוק.</p>
        <input className="field-input" value={viewerPw} onChange={(e) => setViewerPw(e.target.value)} placeholder="סיסמת צפייה" />
        <button className="btn-primary" onClick={saveViewerPw}>{viewerSaved ? "נשמר!" : "שמירת סיסמה"}</button>
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

      {/* רשימת הנציגים - מכווצת כברירת מחדל, נפתחת בלחיצה */}
      <button
        className="flex w-full items-center justify-between rounded-2xl bg-blush/60 px-4 py-3 text-right"
        onClick={() => setShowReps((v) => !v)}
      >
        <span className="text-base font-bold text-roseDark">נציגים קיימים ({data.reps.length})</span>
        <span className="text-sm text-ink/50">{showReps ? "▲ הסתרה" : "▼ הצגה"}</span>
      </button>

      {showReps && data.reps.map((r) => {
        const coveredBy = r.coveredBy || [];
        const isOpen = openRepId === r.id;
        function toggleCover(otherId, checked) {
          const next = checked
            ? [...coveredBy, otherId]
            : coveredBy.filter((id) => id !== otherId);
          updateRep(r.id, { coveredBy: next });
        }
        return (
          <div key={r.id} className="card space-y-2">
            {/* שורת כותרת מכווצת - לחיצה פותחת/סוגרת את פרטי הנציג/ה */}
            <button
              className="flex w-full items-center justify-between text-right"
              onClick={() => setOpenRepId(isOpen ? null : r.id)}
            >
              <span className="min-w-0">
                <span className="block truncate font-bold text-ink">
                  {r.name}
                  {r.readOnly && <span className="mr-1 text-xs font-normal text-amber-700"> · 🔒 בחופשה</span>}
                </span>
                <span className="block truncate text-xs text-ink/50">{r.institution}</span>
              </span>
              <span className="shrink-0 text-sm text-ink/40">{isOpen ? "▲" : "▼"}</span>
            </button>

            {isOpen && (
            <div className="space-y-2 border-t border-sand pt-2">
            <input className="field-input" value={r.name} onChange={(e) => updateRep(r.id, { name: e.target.value })} placeholder="שם הנציג" />
            <input className="field-input" value={r.institution || ""} onChange={(e) => updateRep(r.id, { institution: e.target.value })} placeholder="שם המוסד" />
            <input className="field-input" value={r.phone || ""} onChange={(e) => updateRep(r.id, { phone: e.target.value })} placeholder="טלפון (לשיחה / SMS / וואטסאפ)" />
            <input className="field-input" value={r.password || ""} onChange={(e) => updateRep(r.id, { password: e.target.value })} placeholder="סיסמת הנציג" />

            {/* מצב חופשה / קריאה בלבד */}
            <label className={`flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium ${r.readOnly ? "bg-amber-100 text-amber-800" : "bg-sand/60 text-ink/70"}`}>
              <input type="checkbox" checked={!!r.readOnly} onChange={(e) => updateRep(r.id, { readOnly: e.target.checked })} className="h-5 w-5 accent-rose" />
              🔒 חופשה / קריאה בלבד (הנציג/ה יוכל/תוכל לצפות אך לא לערוך)
            </label>

            {/* ניהול משותף - אילו נציגים נוספים מטפלים במועמדים של נציג/ה זה */}
            <div className="rounded-2xl bg-blush/40 p-3">
              <p className="mb-1 text-sm font-semibold text-roseDark">🤝 ניהול משותף</p>
              <p className="mb-2 text-xs text-ink/60">בחר/י אילו נציגים נוספים יטפלו במועמדים של {r.name} (גישה מלאה במקביל):</p>
              {data.reps.filter((o) => o.id !== r.id).length === 0 && (
                <p className="text-xs text-ink/40">אין נציגים נוספים.</p>
              )}
              <div className="space-y-1">
                {data.reps.filter((o) => o.id !== r.id).map((o) => (
                  <label key={o.id} className="flex items-center gap-2 text-sm text-ink/80">
                    <input
                      type="checkbox"
                      checked={coveredBy.includes(o.id)}
                      onChange={(e) => toggleCover(o.id, e.target.checked)}
                      className="h-4 w-4 accent-rose"
                    />
                    {o.name}
                  </label>
                ))}
              </div>
            </div>

            <button className="btn-soft text-roseDark" onClick={() => { if (confirm(`למחוק את הנציג "${r.name}"?\nהמועמדים שלו לא יימחקו — הם יעברו ל"ללא שיוך נציג".`)) deleteRep(r.id); }}>🗑️ מחיקה</button>
            </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
