"use client";

import { useEffect, useRef, useState } from "react";
import { useData } from "../lib/useData";
import { addRecording, getRecordingAudio, deleteRecording } from "../lib/store";

const MAX_SECONDS = 600; // עד 10 דקות
const MAX_BYTES = 980000; // מגבלת גודל לשמירה בטוחה

function pickMime() {
  if (typeof window === "undefined" || !window.MediaRecorder) return "";
  const types = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/mpeg"];
  for (const t of types) {
    try {
      if (MediaRecorder.isTypeSupported(t)) return t;
    } catch (e) {}
  }
  return "";
}

function fmt(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function Recorder({ candidateId, repId, canRecord = false }) {
  const data = useData();
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [urls, setUrls] = useState({}); // id -> object url (לאחר טעינה להשמעה)
  const [loadingId, setLoadingId] = useState("");

  const mr = useRef(null);
  const chunks = useRef([]);
  const stream = useRef(null);
  const timer = useRef(null);

  const list = (data?.recordings || [])
    .filter((r) => r.candidateId === candidateId)
    .sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));

  useEffect(() => {
    return () => {
      // ניקוי במעבר בין כרטיסים
      if (timer.current) clearInterval(timer.current);
      if (stream.current) stream.current.getTracks().forEach((t) => t.stop());
      Object.values(urls).forEach((u) => URL.revokeObjectURL(u));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function start() {
    setError("");
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = s;
      const mime = pickMime();
      const opts = { audioBitsPerSecond: 16000 };
      if (mime) opts.mimeType = mime;
      const rec = new MediaRecorder(s, opts);
      chunks.current = [];
      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.current.push(e.data);
      };
      rec.onstop = finalize;
      mr.current = rec;
      rec.start();
      setRecording(true);
      setElapsed(0);
      timer.current = setInterval(() => {
        setElapsed((x) => {
          if (x + 1 >= MAX_SECONDS) stop();
          return x + 1;
        });
      }, 1000);
    } catch (e) {
      setError("לא ניתן לגשת למיקרופון. נא לאשר הרשאת מיקרופון בדפדפן.");
    }
  }

  function stop() {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    setRecording(false);
    try {
      if (mr.current && mr.current.state !== "inactive") mr.current.stop();
    } catch (e) {}
  }

  async function finalize() {
    const mime = mr.current?.mimeType || "audio/webm";
    if (stream.current) stream.current.getTracks().forEach((t) => t.stop());
    const blob = new Blob(chunks.current, { type: mime });
    chunks.current = [];
    if (blob.size === 0) return;
    if (blob.size > MAX_BYTES) {
      setError("ההקלטה ארוכה/כבדה מדי לשמירה. אפשר להקליט הקלטה נוספת קצרה יותר (כפתור +).");
      return;
    }
    setSaving(true);
    try {
      const bytes = new Uint8Array(await blob.arrayBuffer());
      await addRecording({ candidateId, repId, mime, durationSec: elapsed, bytes });
    } catch (e) {
      setError("שמירת ההקלטה נכשלה. בדקו חיבור ונסו שוב.");
    }
    setSaving(false);
  }

  async function play(id, mime) {
    if (urls[id]) return; // כבר נטען
    setLoadingId(id);
    try {
      const bytes = await getRecordingAudio(id);
      if (bytes) {
        const url = URL.createObjectURL(new Blob([bytes], { type: mime || "audio/webm" }));
        setUrls((u) => ({ ...u, [id]: url }));
      } else {
        setError("ההקלטה לא נמצאה.");
      }
    } catch (e) {
      setError("טעינת ההקלטה נכשלה.");
    }
    setLoadingId("");
  }

  async function remove(id) {
    if (!confirm("למחוק את ההקלטה?")) return;
    if (urls[id]) URL.revokeObjectURL(urls[id]);
    await deleteRecording(id);
  }

  return (
    <div className="rounded-2xl bg-blush/40 p-4">
      <p className="mb-2 text-base font-bold text-roseDark">🎙️ הקלטות קוליות</p>

      {error && <p className="mb-2 text-sm font-medium text-roseDark">{error}</p>}

      {/* רשימת הקלטות */}
      {list.length === 0 && <p className="mb-2 text-sm text-ink/50">אין הקלטות עדיין.</p>}
      <div className="space-y-2">
        {list.map((r, i) => (
          <div key={r.id} className="rounded-xl bg-white p-2">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="text-ink/70">
                🎧 הקלטה {i + 1} · {fmt(r.durationSec || 0)}
                {r.createdAt ? ` · ${new Date(r.createdAt).toLocaleDateString("he-IL")}` : ""}
              </span>
              {canRecord && <button className="text-roseDark" onClick={() => remove(r.id)}>🗑️</button>}
            </div>
            {urls[r.id] ? (
              // eslint-disable-next-line jsx-a11y/media-has-caption
              <audio className="mt-1 w-full" controls autoPlay src={urls[r.id]} />
            ) : (
              <button className="btn-soft mt-1 !py-1.5 text-sm" disabled={loadingId === r.id} onClick={() => play(r.id, r.mime)}>
                {loadingId === r.id ? "טוען…" : "▶️ האזנה"}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* כפתור הקלטה - רק לנציג של המועמד ולמנהלת */}
      {canRecord && (
        <>
          <div className="mt-3">
            {recording ? (
              <button className="btn-primary w-full" onClick={stop}>
                ⏹️ עצור והקלט ({fmt(elapsed)})
              </button>
            ) : (
              <button className="btn-soft w-full" disabled={saving} onClick={start}>
                {saving ? "שומר…" : "➕ הקלטה חדשה"}
              </button>
            )}
          </div>
          <p className="mt-1 text-xs text-ink/50">עד 10 דקות להקלטה. אפשר להוסיף כמה הקלטות שרוצים.</p>
        </>
      )}
    </div>
  );
}
