"use client";

import { useState } from "react";
import { addEvent, deleteEvent } from "../lib/store";
import { compressImage } from "../lib/image";
import { Plus, Trash2, ImagePlus } from "lucide-react";

// עריכת אירועים לפרסום במסך התודה. פלאייר (תמונה) + כותרת + קישור הרשמה + תיאור.
export default function EventsEditor({ data }) {
  const events = [...(data.events || [])].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  const [image, setImage] = useState("");
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function onImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      // איכות גבוהה יותר לפלאייר, כדי שהטקסט יישאר קריא.
      setImage(await compressImage(file, 1200, 0.72));
      setErr("");
    } catch (e2) {
      setErr("בעיה בטעינת התמונה. נסי תמונה אחרת (JPG).");
    }
  }

  async function add() {
    if (!image) { setErr("נא להוסיף תמונה לאירוע."); return; }
    setBusy(true);
    try {
      await addEvent({ image, title: title.trim(), link: link.trim(), caption: caption.trim() });
      setImage(""); setTitle(""); setLink(""); setCaption("");
    } catch (e) {
      setErr("השמירה נכשלה. ודאי חיבור ונסי שוב.");
    }
    setBusy(false);
  }

  return (
    <div className="card space-y-4">
      {/* הוספת אירוע חדש */}
      <div className="space-y-2 rounded-2xl bg-blush/30 p-3">
        <p className="flex items-center gap-1.5 text-base font-bold text-roseDark"><Plus className="h-4 w-4" strokeWidth={2} /> אירוע חדש</p>
        {err && <p className="rounded-xl bg-rose/10 px-3 py-2 text-sm text-roseDark">{err}</p>}
        <label className="field-label flex items-center gap-1.5"><ImagePlus className="h-4 w-4" strokeWidth={1.75} /> תמונת הפלאייר</label>
        <input className="field-input" type="file" accept="image/*" onChange={onImage} />
        {image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="תצוגה מקדימה" className="max-h-56 w-full rounded-2xl object-contain" />
        )}
        <input className="field-input" placeholder="כותרת האירוע" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input className="field-input" placeholder="קישור להרשמה/הצטרפות (לא חובה)" value={link} onChange={(e) => setLink(e.target.value)} />
        <textarea className="field-input min-h-[60px]" placeholder="תיאור קצר (לא חובה)" value={caption} onChange={(e) => setCaption(e.target.value)} />
        <button className="btn-primary" disabled={busy} onClick={add}>{busy ? "שומר…" : "פרסום האירוע"}</button>
      </div>

      {/* אירועים קיימים */}
      {events.length === 0 ? (
        <p className="text-xs text-ink/40">אין אירועים מפורסמים.</p>
      ) : (
        <div className="space-y-3">
          {events.map((ev) => (
            <div key={ev.id} className="flex items-center gap-3 rounded-2xl bg-sand/40 p-3">
              {ev.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={ev.image} alt={ev.title || "אירוע"} className="h-16 w-16 shrink-0 rounded-xl object-cover" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink">{ev.title || "ללא כותרת"}</p>
                {ev.link && <p className="truncate text-xs text-ink/50">{ev.link}</p>}
              </div>
              <button className="text-roseDark" onClick={() => { if (confirm("למחוק את האירוע?")) deleteEvent(ev.id); }}>
                <Trash2 className="h-5 w-5" strokeWidth={1.75} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
