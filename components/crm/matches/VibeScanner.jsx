"use client";

// סריקת וייב חזותי מתמונות הפרופיל - רכיב תוספת בתוך עוזר ההתאמות (למנהלת בלבד).
//
// רץ רק בלחיצה של המנהלת, ורק על מועמדים פנויים שאינם חסויים (המאגר
// האנונימי). התמונות נשלחות בקבוצות קטנות, בלי שם ובלי שום פרט מזהה, עם
// הפסקה בין קבוצה לקבוצה כדי לא לחרוג ממכסת המסלול החינמי.
// התוצאות נשמרות בדפדפן בלבד (lib/crm/aiVibe.js), אחרי כל קבוצה - כך
// שעצירה באמצע לא מאבדת את מה שכבר נסרק.

import { useRef, useState } from "react";
import { Camera, AlertTriangle, ChevronDown } from "lucide-react";
import { crmAuth } from "@/lib/crm/firebaseClient";
import { readVibes, writeVibes, mainPhoto, needsScan } from "@/lib/crm/aiVibe";

const BATCH = 6;
const PAUSE_MS = 5_000;

async function callVibe(items) {
  const user = crmAuth.currentUser;
  if (!user) throw new Error("נדרשת התחברות מחדש");
  const idToken = await user.getIdToken();
  const res = await fetch("/api/ai-match/vibe/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items, idToken }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) throw new Error(data?.error || `שגיאה בסריקה (${res.status})`);
  return data;
}

export default function VibeScanner({ candidates, vibes, onVibes }) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const stopRef = useRef(false);

  const withPhoto = candidates.filter((c) => mainPhoto(c));
  const pending = withPhoto.filter((c) => needsScan(vibes, c));
  const done = withPhoto.length - pending.length;

  const run = async () => {
    setConfirming(false);
    setRunning(true);
    setError("");
    stopRef.current = false;
    let map = readVibes();
    const queue = candidates.filter((c) => needsScan(map, c));
    try {
      for (let i = 0; i < queue.length && !stopRef.current; i += BATCH) {
        const batch = queue.slice(i, i + BATCH);
        // מפתחות אקראיים לכל קבוצה - שום מזהה של הכרטיס לא יוצא מהדפדפן
        const items = batch.map((c, j) => ({ key: `k${j}`, url: mainPhoto(c) }));
        const data = await callVibe(items);
        map = readVibes();
        batch.forEach((c, j) => {
          const r = data.results?.[`k${j}`];
          map[c.id] = r ? { url: mainPhoto(c), ...r, at: Date.now() } : { url: mainPhoto(c), failed: true, at: Date.now() };
        });
        writeVibes(map);
        onVibes({ ...map });
        if (i + BATCH < queue.length && !stopRef.current) await new Promise((r) => setTimeout(r, PAUSE_MS));
      }
    } catch (err) {
      setError(`${err?.message || "משהו השתבש"} מה שכבר נסרק נשמר - אפשר להמשיך אחר כך.`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="rounded-3xl border border-[#EAE5E3] bg-white shadow-[0_4px_18px_rgba(58,51,53,0.06)]">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between px-4 py-3.5">
        <span className="flex items-center gap-2 text-[14px] font-bold text-[#3A3335]">
          <Camera size={16} className="text-[#8C4A55]" /> וייב חזותי מהתמונות ({done}/{withPhoto.length})
        </span>
        <ChevronDown size={16} className={`text-[#8A8285] transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="space-y-2.5 border-t border-[#EAE5E3] px-4 pb-4 pt-3 text-[12px] leading-relaxed text-[#3A3335]">
          <p className="text-[#8A8285]">
            הבינה מאפיינת מתמונת הפרופיל סגנון, סביבה ואנרגיה, וההכרעות משוות ביניהם. נסרקים רק מועמדים פנויים שאינם חסויים.
            התוצאות נשמרות במכשיר הזה בלבד. תמונה שמתחלפת - נסרקת מחדש בסריקה הבאה.
          </p>

          {pending.length === 0 ? (
            <p className="font-semibold text-[#178A57]">כל התמונות נסרקו.</p>
          ) : running ? (
            <div className="flex items-center justify-between gap-2">
              <span>
                סורק/ת... נשארו {pending.length} תמונות
              </span>
              <button
                type="button"
                onClick={() => {
                  stopRef.current = true;
                }}
                className="rounded-xl border border-[#EAE5E3] px-3 py-1.5 font-semibold text-[#8A8285]"
              >
                עצירה
              </button>
            </div>
          ) : confirming ? (
            <div className="space-y-2 rounded-2xl border border-[#F0D3A0] bg-[#FFF8E7] p-3">
              <p className="flex items-start gap-1.5">
                <AlertTriangle size={13} className="mt-0.5 shrink-0 text-[#946200]" />
                <span>
                  {pending.length} תמונות פרופיל יישלחו ל-Google Gemini, בלי שם ובלי פרטים מזהים. בפנים - הפנים של
                  המועמדים. במסלול החינמי Google רשאית להשתמש בתוכן לשיפור השירות.
                </span>
              </p>
              <div className="flex gap-2">
                <button type="button" onClick={run} className="rounded-xl bg-[#8C4A55] px-3 py-1.5 font-semibold text-white">
                  אישור וסריקה
                </button>
                <button type="button" onClick={() => setConfirming(false)} className="font-semibold text-[#8A8285]">
                  ביטול
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="w-full rounded-2xl bg-[#8C4A55] py-2.5 text-[13px] font-bold text-white transition active:scale-[0.98]"
            >
              סריקת {pending.length} תמונות (כ-{Math.max(1, Math.ceil((pending.length / BATCH) * 0.4))} דק&apos;)
            </button>
          )}

          {error && <p className="rounded-2xl bg-[#FBEDED] p-2.5 text-[#C24545]">{error}</p>}
        </div>
      )}
    </div>
  );
}
