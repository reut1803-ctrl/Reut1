"use client";

import { useState } from "react";
import { updateRegistration } from "../lib/store";
import { Plus, Trash2 } from "lucide-react";

// עריכת דף ההרשמה: מסלולים, תשלום בביט, מדיניות, ואירועים קרובים. למנהלת בלבד.
export default function RegistrationEditor({ data }) {
  const r = data.registration || {};
  const [personal, setPersonal] = useState(r.personal || { enabled: true, title: "מסלול אישי", desc: "", price: "", pay: "" });
  const [gold, setGold] = useState(r.gold || { enabled: true, title: "מסגרת זהב", desc: "", price: "", pay: "" });
  const [callback, setCallback] = useState(r.callback || { enabled: true, title: "שיחזרו אליי", desc: "" });
  const [bit, setBit] = useState(r.bit || "");
  const [policy, setPolicy] = useState(r.policy || "");
  const [events, setEvents] = useState(r.events || []);
  const [saved, setSaved] = useState("");

  function save() {
    updateRegistration({ personal, gold, callback, bit, policy, events });
    setSaved("נשמר ✓");
    setTimeout(() => setSaved(""), 1500);
  }

  function setEvent(i, key, val) {
    setEvents((list) => list.map((e, idx) => (idx === i ? { ...e, [key]: val } : e)));
  }
  function addEvent() {
    setEvents((list) => [...list, { title: "", when: "", place: "", note: "" }]);
  }
  function removeEvent(i) {
    setEvents((list) => list.filter((_, idx) => idx !== i));
  }

  const TrackFields = ({ cfg, set, withPay }) => (
    <div className="space-y-2 rounded-2xl bg-blush/30 p-3">
      <label className="flex items-center gap-2 text-sm font-medium text-ink">
        <input type="checkbox" className="h-4 w-4 accent-rose" checked={!!cfg.enabled} onChange={(e) => set({ ...cfg, enabled: e.target.checked })} />
        מסלול פעיל (מוצג בדף ההרשמה)
      </label>
      <input className="field-input" placeholder="כותרת המסלול" value={cfg.title || ""} onChange={(e) => set({ ...cfg, title: e.target.value })} />
      <input className="field-input" placeholder="תיאור קצר" value={cfg.desc || ""} onChange={(e) => set({ ...cfg, desc: e.target.value })} />
      {withPay && (
        <>
          <input className="field-input" placeholder="עלות (למשל: 250 ₪)" value={cfg.price || ""} onChange={(e) => set({ ...cfg, price: e.target.value })} />
          <textarea className="field-input min-h-[60px]" placeholder="הערות תשלום נוספות (לא חובה)" value={cfg.pay || ""} onChange={(e) => set({ ...cfg, pay: e.target.value })} />
        </>
      )}
    </div>
  );

  return (
    <div className="card space-y-4">
      <div>
        <p className="mb-1 text-base font-bold text-roseDark">מסלול אישי</p>
        <TrackFields cfg={personal} set={setPersonal} withPay />
      </div>
      <div>
        <p className="mb-1 text-base font-bold text-roseDark">מסגרת זהב</p>
        <TrackFields cfg={gold} set={setGold} withPay />
      </div>
      <div>
        <p className="mb-1 text-base font-bold text-roseDark">שיחזרו אליי</p>
        <TrackFields cfg={callback} set={setCallback} withPay={false} />
      </div>

      <div>
        <label className="field-label">מזהה ביט לתשלום (שם או מספר טלפון)</label>
        <input className="field-input" placeholder="למשל: 050-0000000" value={bit} onChange={(e) => setBit(e.target.value)} />
      </div>

      <div>
        <label className="field-label">נוסח מדיניות ופרטיות</label>
        <textarea className="field-input min-h-[90px]" value={policy} onChange={(e) => setPolicy(e.target.value)} />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-base font-bold text-roseDark">אירועים קרובים</p>
          <button className="btn-soft !px-3 !py-1.5 text-sm" onClick={addEvent}><Plus className="h-4 w-4" strokeWidth={2} /> הוספה</button>
        </div>
        {events.length === 0 && <p className="text-xs text-ink/40">אין אירועים. לחצי "הוספה" כדי ליצור אחד.</p>}
        <div className="space-y-2">
          {events.map((e, i) => (
            <div key={i} className="space-y-2 rounded-2xl bg-sand/40 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-ink/50">אירוע {i + 1}</span>
                <button className="text-roseDark" onClick={() => removeEvent(i)}><Trash2 className="h-4 w-4" strokeWidth={1.75} /></button>
              </div>
              <input className="field-input" placeholder="שם האירוע" value={e.title || ""} onChange={(ev) => setEvent(i, "title", ev.target.value)} />
              <input className="field-input" placeholder="מתי (תאריך ושעה)" value={e.when || ""} onChange={(ev) => setEvent(i, "when", ev.target.value)} />
              <input className="field-input" placeholder="מיקום" value={e.place || ""} onChange={(ev) => setEvent(i, "place", ev.target.value)} />
              <textarea className="field-input min-h-[50px]" placeholder="פרטים נוספים (לא חובה)" value={e.note || ""} onChange={(ev) => setEvent(i, "note", ev.target.value)} />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="btn-primary" onClick={save}>שמירה</button>
        {saved && <span className="text-sm font-semibold text-green-600">{saved}</span>}
      </div>
    </div>
  );
}
