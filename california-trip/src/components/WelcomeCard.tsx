"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import Clocks from "./Clocks";
import { useAuth } from "@/lib/auth";
import type { TripApi } from "@/lib/trip";
import type { Look } from "@/lib/types";

function joinNames(names: string[]) {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} ו${names[names.length - 1]}`;
}

export default function WelcomeCard({ trip, onReplay }: { trip: TripApi; onReplay: () => void }) {
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
      setMsg("התמונה עלתה. הדמות שלך מוכנה!");
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
      setMsg(`נשלחה הזמנה ל-${inviteEmail.trim()}. מעכשיו אפשר להיכנס עם החשבון הזה.`);
      setInviteEmail("");
    } catch (err) {
      setMsg((err as Error).message || "לא הצלחנו להוסיף, נסו שוב.");
    } finally {
      setInviting(false);
    }
  }

  const looks: { id: Look; label: string }[] = [
    { id: "hat", label: "כובע שמש" },
    { id: "kippah", label: "כיפה וזקן" },
  ];

  return (
    <section className="card" aria-labelledby="welcome-title">
      {demo && <span className="demo-pill">מצב תצוגה · Firebase עוד לא מחובר</span>}
      <p className="eyebrow">נחתנו בלוס אנג׳לס</p>
      <h1 id="welcome-title" className="title">
        ברוכים הבאים, <em>{joinNames(names) || user?.name}</em>
      </h1>
      <Clocks />

      <div className="members">
        {trip.members.map((m) => {
          const isMe = m.uid === user?.uid;
          return (
            <div className="member" key={m.uid}>
              <div
                className="member-face"
                style={m.avatarUrl ? { backgroundImage: `url("${m.avatarUrl}")` } : undefined}
                aria-hidden="true"
              >
                {!m.avatarUrl && m.name.slice(0, 1)}
              </div>
              <div className="member-body">
                <div className="member-name">{m.name}{isMe ? " (אני)" : ""}</div>
                {isMe ? (
                  <div className="member-actions">
                    <label className="chip chip-upload" htmlFor="face-upload">
                      {uploading ? "מעלה…" : m.avatarUrl ? "החלפת תמונת פנים" : "העלאת תמונת פנים"}
                    </label>
                    <input
                      id="face-upload"
                      className="sr-file"
                      type="file"
                      accept="image/*"
                      onChange={onFile}
                      disabled={uploading}
                    />
                    {looks.map((l) => (
                      <button
                        key={l.id}
                        type="button"
                        className="chip"
                        aria-pressed={m.look === l.id}
                        onClick={() => trip.setLook(l.id)}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="member-sub">{m.avatarUrl ? "עם תמונת פנים" : "עוד בלי תמונת פנים"}</div>
                )}
              </div>
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
          <button className="btn btn-primary" type="submit" disabled={inviting}>
            {inviting ? "מוסיפים…" : "הזמנה"}
          </button>
        </form>
      )}

      {msg && <p className="note" role="status">{msg}</p>}

      <div className="welcome-actions">
        <button type="button" className="btn btn-soft" onClick={onReplay}>לראות שוב את הנחיתה</button>
        <button type="button" className="btn btn-ghost" onClick={signOut}>יציאה</button>
      </div>
    </section>
  );
}
