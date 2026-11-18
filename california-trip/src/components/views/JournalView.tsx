"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useRows, useTripCtx, useTripToday } from "@/lib/tripContext";
import { useAuth } from "@/lib/auth";
import { heDate } from "@/lib/time";
import { photoVersions } from "@/lib/media";
import { currentPosition } from "@/lib/places";
import Icon from "../app/Icon";
import DayStrip from "./DayStrip";
import { AudioClip, PhotoThumb, Recorder } from "./media";

export type Entry = { id: string; date: string; by: string; byName: string; gratitude?: string; favorite?: string; audioId?: string; createdAt?: number };
export type Photo = { id: string; date: string; by: string; byName: string; thumb: string; lat?: number | null; lng?: number | null; caption?: string; createdAt?: number };

function Compose({ day }: { day: string }) {
  const { store, trip } = useTripCtx();
  const { user } = useAuth();
  const partner = trip.members.find((m) => m.uid !== user?.uid)?.name ?? "בן/בת הזוג";
  const [gratitude, setGratitude] = useState("");
  const [favorite, setFavorite] = useState("");
  const [audio, setAudio] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!gratitude.trim() && !favorite.trim() && !audio) return;
    setBusy(true);
    let audioId: string | undefined;
    if (audio) audioId = await store.add("audioData", { data: audio, date: day });
    await store.add("journal", {
      date: day, by: user?.uid ?? "", byName: user?.name ?? "",
      gratitude: gratitude.trim(), favorite: favorite.trim(), ...(audioId ? { audioId } : {}),
    });
    setGratitude(""); setFavorite(""); setAudio(null);
    setBusy(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <form className="panel glass compose" onSubmit={save}>
      <label className="fld"><span>על מה אני מודה ל{partner} היום?</span>
        <textarea id="j-gratitude" className="field area" rows={3} value={gratitude} onChange={(e) => setGratitude(e.target.value)} />
      </label>
      <label className="fld"><span>מה הכי אהבנו היום?</span>
        <textarea id="j-favorite" className="field area" rows={2} value={favorite} onChange={(e) => setFavorite(e.target.value)} />
      </label>
      <div className="row-between">
        {audio ? (
          <div className="picked"><audio className="audio" controls src={audio} /><button type="button" className="text-btn" onClick={() => setAudio(null)}>מחיקה</button></div>
        ) : <Recorder onDone={setAudio} />}
        <button className="pill-btn pill-btn--dark" type="submit" disabled={busy}>{busy ? "שומרים…" : saved ? "נשמר ✓" : "שמירה ביומן"}</button>
      </div>
    </form>
  );
}

function AddPhotos({ day }: { day: string }) {
  const { store } = useTripCtx();
  const { user } = useAuth();
  const [pin, setPin] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [caption, setCaption] = useState("");

  async function onFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    const pos = pin ? await currentPosition() : null;
    for (let i = 0; i < files.length; i++) {
      setBusy(`מעלים ${i + 1} מתוך ${files.length}…`);
      const { full, thumb } = await photoVersions(files[i]);
      const id = await store.add("photos", {
        date: day, by: user?.uid ?? "", byName: user?.name ?? "", thumb,
        lat: pos?.lat ?? null, lng: pos?.lng ?? null, caption: caption.trim(),
      });
      await store.set("photoData", id, { data: full });
    }
    setCaption("");
    setBusy(pin && !pos ? "התמונות עלו, אבל בלי מיקום (לא אושרה גישה למיקום)." : "התמונות עלו ✓");
    setTimeout(() => setBusy(null), 3500);
  }

  return (
    <div className="panel glass">
      <h2 className="panel-title">תמונות מהיום</h2>
      <input id="photo-caption" className="field" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="כיתוב (לא חובה)" aria-label="כיתוב לתמונות" />
      <label className="toggle"><input id="photo-pin" type="checkbox" checked={pin} onChange={(e) => setPin(e.target.checked)} /> לנעוץ על המפה לפי המיקום שלי עכשיו</label>
      <label className="pill-btn pill-btn--dark pill-btn--block upload-btn" htmlFor="photo-files"><Icon name="photo" />בחירת תמונות</label>
      <input id="photo-files" className="sr-file" type="file" accept="image/*" multiple onChange={onFiles} />
      {busy && <p className="hint" role="status">{busy}</p>}
    </div>
  );
}

export default function JournalView() {
  const { tripDoc, store, trip } = useTripCtx();
  const { user } = useAuth();
  const today = useTripToday(tripDoc);
  const [day, setDay] = useState(today);
  useEffect(() => { setDay(today); }, [today]);
  const entries = useRows<Entry>("journal", ["date", day]);
  const photos = useRows<Photo>("photos", ["date", day]);
  const face = (uid: string) => trip.members.find((m) => m.uid === uid)?.avatarUrl;

  return (
    <div className="stack">
      <Link className="panel glass capsule-link" href="/capsule"><Icon name="capsule" /><span>קפסולת הזמן: כל הטיול באלבום אחד</span><span aria-hidden="true">←</span></Link>
      <DayStrip start={tripDoc.startDate} end={tripDoc.endDate} value={day} onChange={setDay} />
      <Compose day={day} />
      <AddPhotos day={day} />

      {(photos ?? []).length > 0 && (
        <div className="thumbs">
          {(photos ?? []).sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0)).map((p) => (
            <div key={p.id} className="thumb-wrap">
              <PhotoThumb id={p.id} thumb={p.thumb} caption={p.caption} />
              {p.by === user?.uid && <button type="button" className="thumb-x" aria-label="מחיקת תמונה" onClick={async () => { await store.remove("photos", p.id); await store.remove("photoData", p.id); }}>×</button>}
            </div>
          ))}
        </div>
      )}

      <section className="stack" aria-label={`היומן של ${heDate(day)}`}>
        {(entries ?? []).sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0)).map((en) => (
          <article key={en.id} className="entry glass">
            <header className="entry-head">
              <span className="person-face person-face--sm" style={face(en.by) ? { backgroundImage: `url("${face(en.by)}")` } : undefined}>{!face(en.by) && en.byName.slice(0, 1)}</span>
              <strong>{en.byName}</strong>
              {en.by === user?.uid && <button type="button" className="icon-btn icon-btn--ghost" aria-label="מחיקה" onClick={async () => { await store.remove("journal", en.id); if (en.audioId) await store.remove("audioData", en.audioId); }}><Icon name="trash" /></button>}
            </header>
            {en.gratitude && <blockquote className="quote"><span className="label">מודה על</span>{en.gratitude}</blockquote>}
            {en.favorite && <p className="fav"><span className="label">הכי אהבנו</span>{en.favorite}</p>}
            {en.audioId && <AudioClip audioId={en.audioId} />}
          </article>
        ))}
        {entries !== null && entries.length === 0 && <p className="hint center">עוד אין כתיבה ביומן ל{heDate(day)}.</p>}
      </section>
    </div>
  );
}
