"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import AnalogClocks from "./AnalogClocks";
import FlagEmblem from "./FlagEmblem";
import { useAuth } from "@/lib/auth";
import type { TripApi } from "@/lib/trip";

function joinNames(names: string[]) {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} ו${names[names.length - 1]}`;
}

export default function WelcomeCard({
  trip,
  onReplay,
  onEnter,
}: {
  trip: TripApi;
  onReplay: () => void;
  onEnter: () => void;
}) {
  const { user, signOut, demo } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  const names = trip.members.map((m) => m.name).filter(Boolean);

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setMsg(null);
    try {
      await trip.uploadFace(file);
      setMsg("התמונה עלתה.");
    } catch (err) {
      setMsg((err as Error).message || "ההעלאה לא הצליחה, נסו שוב.");
    } finally {
      setUploading(false);
    }
  }

  async function onInvite(e: FormEvent) {
    e.preventDefault();
    setInviting(true);
    setMsg(null);
    try {
      await trip.invite(inviteEmail);
      setMsg(`${inviteEmail.trim()} נוסף/ה לטיול. מעכשיו אפשר להיכנס עם החשבון הזה.`);
      setInviteEmail("");
    } catch (err) {
      setMsg((err as Error).message || "לא הצלחנו להוסיף, נסו שוב.");
    } finally {
      setInviting(false);
    }
  }

  return (
    <section className="gate-card gate-card--wide glass" aria-labelledby="welcome-title">
      {demo && <span className="demo-pill">תצוגה מקדימה · התמונות נשארות רק אצלך במסך</span>}
      <FlagEmblem />
      <p className="gate-eyebrow">נחתנו בלוס אנג׳לס</p>
      <h1 id="welcome-title" className="gate-title gate-title--sm">
        ברוכים הבאים,<br />{joinNames(names) || user?.name}
      </h1>

      <AnalogClocks />

      <div className="people">
        {trip.members.map((m) => {
          const isMe = m.uid === user?.uid;
          return (
            <div className="person" key={m.uid}>
              <span
                className="person-face"
                style={m.avatarUrl ? { backgroundImage: `url("${m.avatarUrl}")` } : undefined}
                aria-hidden="true"
              >
                {!m.avatarUrl && m.name.slice(0, 1)}
              </span>
              <span className="person-name">{m.name}</span>
              {isMe && (
                <>
                  <label className="person-upload" htmlFor="face-upload">
                    {uploading ? "מעלה…" : m.avatarUrl ? "החלפת תמונה" : "הוספת תמונה"}
                  </label>
                  <input id="face-upload" className="sr-file" type="file" accept="image/*" onChange={onFile} disabled={uploading} />
                </>
              )}
            </div>
          );
        })}
      </div>

      {!demo && trip.isOwner && trip.members.length < 2 && (
        <form className="invite" onSubmit={onInvite}>
          <input
            id="invite-email"
            type="email"
            inputMode="email"
            placeholder="המייל של זכריה"
            aria-label="המייל של זכריה"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
          />
          <button className="pill-btn" type="submit" disabled={inviting}>
            {inviting ? "מוסיפים…" : "הזמנה"}
          </button>
        </form>
      )}

      {msg && <p className="gate-note" role="status">{msg}</p>}

      <button type="button" className="pill-btn pill-btn--dark pill-btn--block" onClick={onEnter}>
        כניסה לאתר
      </button>
      <div className="gate-links">
        <button type="button" className="text-btn" onClick={onReplay}>לראות שוב את ההמראה</button>
        <span aria-hidden="true">·</span>
        <button type="button" className="text-btn" onClick={signOut}>יציאה</button>
      </div>
    </section>
  );
}
