"use client";

import { useState, type FormEvent } from "react";
import { useTripCtx } from "@/lib/tripContext";
import { FLAGS_DEFAULT, FLAGS_LIMITS, type FlagsContent } from "@/content/flags";
import WavingFlag from "./WavingFlag";
import { MOSHIACH_FLAG, US_FLAG } from "./flags";

const FIELDS: { key: keyof FlagsContent; label: string; rows?: number }[] = [
  { key: "eyebrow", label: "כותרת קטנה למעלה" },
  { key: "title", label: "כותרת ראשית (Enter = שורה חדשה)", rows: 2 },
  { key: "lede", label: "פסקת הסבר", rows: 4 },
  { key: "moshiachTitle", label: "דגל משיח: כותרת" },
  { key: "moshiachText", label: "דגל משיח: תיאור", rows: 2 },
  { key: "usTitle", label: "דגל ארה״ב: כותרת" },
  { key: "usText", label: "דגל ארה״ב: תיאור", rows: 2 },
];

function Lines({ text }: { text: string }) {
  const parts = text.split("\n");
  return <>{parts.map((p, i) => <span key={i}>{p}{i < parts.length - 1 && <br />}</span>)}</>;
}

// מסך הדגלים. הטקסטים נשמרים במסמך הטיול (flagsContent), וניתנים לעריכה מתוך האתר.
export default function FlagsSection() {
  const { tripDoc, store } = useTripCtx();
  const saved = (tripDoc as { flagsContent?: Partial<FlagsContent> }).flagsContent ?? {};
  const c: FlagsContent = { ...FLAGS_DEFAULT, ...saved };
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<FlagsContent>(c);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  function open() {
    setDraft(c);
    setState("idle");
    setEditing(true);
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setState("saving");
    try {
      const clean = Object.fromEntries(
        (Object.keys(FLAGS_DEFAULT) as (keyof FlagsContent)[]).map((k) => [k, (draft[k] || "").trim() || FLAGS_DEFAULT[k]]),
      );
      await store.updateTrip({ flagsContent: clean });
      setState("saved");
      setEditing(false);
    } catch {
      setState("error");
    }
  }

  return (
    <section className="flags section" aria-labelledby="flags-heading">
      <div className="section-head reveal">
        <p className="eyebrow-home">{c.eyebrow}</p>
        <h2 id="flags-heading" className="section-title"><Lines text={c.title} /></h2>
        <p className="lede">{c.lede}</p>
      </div>

      {/* משיח מימין — מקום הכבוד — ואמריקה משמאלו */}
      <div className="flag-stage">
        <figure className="pole-rig" style={{ ["--ratio" as string]: MOSHIACH_FLAG.w / MOSHIACH_FLAG.h }}>
          <div className="pole"><span className="pole-cap" /></div>
          <div className="flag-mount"><WavingFlag art={MOSHIACH_FLAG} label="דגל משיח" phase={1.3} /></div>
          <figcaption className="flag-caption">
            <strong>{c.moshiachTitle}</strong>
            <span>{c.moshiachText}</span>
          </figcaption>
        </figure>
        <figure className="pole-rig" style={{ ["--ratio" as string]: US_FLAG.w / US_FLAG.h }}>
          <div className="pole"><span className="pole-cap" /></div>
          <div className="flag-mount"><WavingFlag art={US_FLAG} label="דגל ארצות הברית" /></div>
          <figcaption className="flag-caption">
            <strong>{c.usTitle}</strong>
            <span>{c.usText}</span>
          </figcaption>
        </figure>
      </div>

      <div className="flags-edit">
        {editing ? (
          <form className="flags-form glass" onSubmit={save}>
            <h3 className="panel-title">עריכת הטקסטים של מסך הדגלים</h3>
            {FIELDS.map((f) => (
              <label key={f.key} className="fld">
                <span>{f.label}</span>
                {f.rows ? (
                  <textarea
                    id={`flags-${f.key}`}
                    className="field area"
                    rows={f.rows}
                    maxLength={FLAGS_LIMITS[f.key]}
                    value={draft[f.key]}
                    onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                  />
                ) : (
                  <input
                    id={`flags-${f.key}`}
                    className="field"
                    maxLength={FLAGS_LIMITS[f.key]}
                    value={draft[f.key]}
                    onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                  />
                )}
                <small className="fld-count">{draft[f.key].length}/{FLAGS_LIMITS[f.key]}</small>
              </label>
            ))}
            {state === "error" && <p className="gate-error">השמירה לא הצליחה. בדקו את החיבור ונסו שוב.</p>}
            <div className="row-between">
              <button type="button" className="text-btn" onClick={() => setDraft(FLAGS_DEFAULT)}>חזרה לנוסח המקורי</button>
              <div className="row-end">
                <button type="button" className="text-btn" onClick={() => setEditing(false)}>ביטול</button>
                <button type="submit" className="pill-btn pill-btn--dark" disabled={state === "saving"}>
                  {state === "saving" ? "שומרים…" : "שמירה"}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <button type="button" className="text-btn flags-edit-btn" onClick={open}>
            ✎ עריכת הטקסטים{state === "saved" ? " · נשמר ✓" : ""}
          </button>
        )}
      </div>
    </section>
  );
}
