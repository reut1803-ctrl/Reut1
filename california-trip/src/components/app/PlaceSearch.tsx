"use client";

import { useState, type FormEvent } from "react";
import { searchPlaces, type Place } from "@/lib/places";
import Icon from "./Icon";

export default function PlaceSearch({ onPick, placeholder = "חיפוש מקום או כתובת" , idPrefix }: { onPick: (p: Place) => void; placeholder?: string; idPrefix: string }) {
  const [q, setQ] = useState("");
  const [res, setRes] = useState<Place[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function go(e: FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      const r = await searchPlaces(q.trim());
      setRes(r);
      if (!r.length) setErr("לא נמצא. נסו לכתוב באנגלית, למשל Santa Monica Pier");
    } catch {
      setErr("החיפוש לא זמין כרגע. אפשר לכתוב את הכתובת ידנית.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="psearch">
      <form className="row-form" onSubmit={go} role="search">
        <input id={`${idPrefix}-q`} className="field" value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
        <button className="icon-btn icon-btn--dark" type="submit" disabled={busy} aria-label="חיפוש">
          {busy ? <span className="spinner spinner--light" /> : <Icon name="search" />}
        </button>
      </form>
      {err && <p className="hint">{err}</p>}
      {res && res.length > 0 && (
        <ul className="psearch-list">
          {res.map((p) => (
            <li key={`${p.lat},${p.lng}`}>
              <button type="button" onClick={() => { onPick(p); setRes(null); setQ(""); }}>
                <strong>{p.name}</strong>
                <span>{p.address}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
