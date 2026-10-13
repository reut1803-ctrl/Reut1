"use client";

import { useState } from "react";
import { updateHomeStory, DEFAULT_HOME_STORY } from "../lib/store";

// עריכת אזור "קצת עליי" בעמוד הבית (כותרת, תת-כותרת, ותחנות ציר הזמן) - מנהלת בלבד.
export default function HomeStoryEditor({ data }) {
  const init =
    data.homeStory && Array.isArray(data.homeStory.stations) && data.homeStory.stations.length
      ? data.homeStory
      : DEFAULT_HOME_STORY;

  const [heading, setHeading] = useState(init.heading || "");
  const [subtitle, setSubtitle] = useState(init.subtitle || "");
  const [stations, setStations] = useState(
    init.stations.map((s) => ({ title: s.title || "", text: s.text || "" }))
  );
  const [saved, setSaved] = useState(false);

  function setField(i, field, val) {
    setStations((s) => s.map((it, idx) => (idx === i ? { ...it, [field]: val } : it)));
  }

  function save() {
    updateHomeStory({ heading: heading.trim(), subtitle: subtitle.trim(), stations });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="space-y-4">
      <div className="card space-y-3">
        <p className="text-sm text-ink/60">הטקסטים של אזור "קצת עליי" בעמוד הבית. כל שינוי שתשמרי כאן יתעדכן באתר תוך רגעים.</p>
        <div>
          <label className="field-label">כותרת</label>
          <input className="field-input" value={heading} onChange={(e) => setHeading(e.target.value)} />
        </div>
        <div>
          <label className="field-label">תת-כותרת (הטקסט הקטן מתחת)</label>
          <input className="field-input" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
        </div>
      </div>

      {stations.map((s, i) => (
        <div key={i} className="card space-y-3">
          <p className="text-sm font-semibold text-ink">תחנה {i + 1}</p>
          <div>
            <label className="field-label">כותרת התחנה</label>
            <input className="field-input" value={s.title} onChange={(e) => setField(i, "title", e.target.value)} />
          </div>
          <div>
            <label className="field-label">טקסט</label>
            <textarea className="field-input min-h-[100px]" value={s.text} onChange={(e) => setField(i, "text", e.target.value)} />
          </div>
        </div>
      ))}

      <button className="btn-primary" onClick={save}>{saved ? "נשמר!" : "שמירת הסיפור"}</button>
    </div>
  );
}
