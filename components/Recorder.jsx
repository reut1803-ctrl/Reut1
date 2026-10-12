"use client";

import { useEffect, useRef, useState } from "react";
import { useData } from "../lib/useData";
import { Mic, Square, Upload, Trash2, Play } from "lucide-react";
import { addRecording, getRecordingAudio, deleteRecording, trackEngagement } from "../lib/store";

const MAX_SECONDS = 600; // עד 10 דקות
const MAX_BYTES = 980000; // מגבלת גודל לשמירה בטוחה (מסמך Firestore)

function pickMime() {
  if (typeof window === "undefined" || !window.MediaRecorder) return "";
  const types = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/mpeg"];
  for (const t of types) {
    try { if (MediaRecorder.isTypeSupported(t)) return t; } catch (e) {}
  }
  return "";
}

function fmt(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function audioDuration(file) {
  return new Promise((resolve) => {
    try {
      const a = new Audio();
      a.preload = "metadata";
      a.onloadedmetadata = () => { resolve(a.duration || 0); URL.revokeObjectURL(a.src); };
      a.onerror = () => resolve(0);
      a.src = URL.createObjectURL(file);
    } catch (e) { resolve(0); }
  });
}

export default function Recorder({ candidateId, repId, canRecord = false }) {
  const data = useData();
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [urls, setUrls] = useState({});
  const [loadingId, setLoadingId] = useState("");

  const mr = useRef(null);
  const chunks = useRef([]);
  const stream = useRef(null);
  const timer = useRef(null);

  const list = (data?.recordings || [])
    .filter((r) => r.candidateId === candidateId)
    .sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));

  const repName = (id) => (id === "admin" ? "מנהלת" : (data?.reps || []).find((x) => x.id === id)?.name || "");

  useEffect(() => {
    return () => {
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
      rec.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunks.current.push(e.data); };
      rec.onstop = finalize;
      mr.current = rec;
      rec.start();
      setRecording(true);
      setElapsed(0);
      timer.current = setInterval(() => {
        setElapsed((x) => { if (x + 1 >= MAX_SECONDS) stop(); return x + 1; });
      }, 1000);
    } catch (e) {
      setError("לא ניתן לגשת למיקרופון. נא לאשר הרשאת מיקרופון בדפדפן.");
    }
  }

  function stop() {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    setRecording(false);
    try { if (mr.current && mr.current.state !== "inactive") mr.current.stop(); } catch (e) {}
  }

  async function finalize() {
    const mime = mr.current?.mimeType || "audio/webm";
    if (stream.current) stream.current.getTracks().forEach((t) => t.stop());
    const blob = new Blob(chunks.current, { type: mime });
    chunks.current = [];
    if (blob.size === 0) return;
    if (blob.size > MAX_BYTES) {
      setError("ההקלטה ארוכה/כבדה מדי לשמירה. אפשר להקליט הקלטה נוספת קצרה יותר.");
      return;
    }
    setSaving(true);
    try {
      const bytes = new Uint8Array(await blob.arrayBuffer());
      await addRecording({ candidateId, repId, mime, durationSec: elapsed, bytes });
    } catch (e) { setError("שמירת ההקלטה נכשלה. בדקו חיבור ונסו שוב."); }
    setSaving(false);
  }

  async function onFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError("");
    if (file.size > MAX_BYTES) { setError("הקובץ כבד מדי לשמירה (עד ~950KB). אפשר להעלות קטע קצר יותר."); return; }
    setSaving(true);
    try {
      const dur = await audioDuration(file);
      const bytes = new Uint8Array(await file.arrayBuffer());
      await addRecording({ candidateId, repId, mime: file.type || "audio/mpeg", durationSec: Math.round(dur), bytes });
    } catch (e2) { setError("העלאת הקובץ נכשלה. נסו קובץ אחר."); }
    setSaving(false);
  }

  async function loadAudio(id, mime) {
    if (urls[id]) return;
    setLoadingId(id);
    try {
      const bytes = await getRecordingAudio(id);
      if (bytes) {
        const url = URL.createObjectURL(new Blob([bytes], { type: mime || "audio/webm" }));
        setUrls((u) => ({ ...u, [id]: url }));
      } else setError("ההקלטה לא נמצאה.");
    } catch (e) { setError("טעינת ההקלטה נכשלה."); }
    setLoadingId("");
  }

  async function remove(id) {
    if (!confirm("למחוק את ההקלטה?")) return;
    if (urls[id]) URL.revokeObjectURL(urls[id]);
    await deleteRecording(id);
  }

  return (
    <div className="rounded-2xl bg-blush/40 p-4">
      {/* כותרת + פעולות */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-base font-bold text-roseDark">
          <Mic className="h-5 w-5" strokeWidth={1.75} /> הקלטות שמע
        </p>
        {canRecord && (
          <div className="flex items-center gap-2">
            {recording ? (
              <button className="inline-flex items-center gap-1.5 rounded-2xl bg-[#7a2e3b] px-3 py-1.5 text-sm font-semibold text-white shadow-soft transition active:scale-95 hover:bg-[#672433]" onClick={stop}>
                <Square className="h-3.5 w-3.5" strokeWidth={2} fill="currentColor" /> עצור ({fmt(elapsed)})
              </button>
            ) : (
              <button className="inline-flex items-center gap-1.5 rounded-2xl bg-[#7a2e3b] px-3 py-1.5 text-sm font-semibold text-white shadow-soft transition active:scale-95 hover:bg-[#672433] disabled:opacity-60" disabled={saving} onClick={start}>
                <Mic className="h-3.5 w-3.5" strokeWidth={1.75} /> הקלטה נוספת
              </button>
            )}
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-2xl border border-rose/60 bg-white px-3 py-1.5 text-sm font-medium text-roseDark transition active:scale-95 hover:bg-rose/5">
              <Upload className="h-3.5 w-3.5" strokeWidth={1.75} /> הוספת קובץ
              <input type="file" accept="audio/*" className="hidden" onChange={onFile} />
            </label>
          </div>
        )}
      </div>

      {error && <p className="mt-2 text-sm font-medium text-roseDark">{error}</p>}
      {saving && <p className="mt-2 text-sm text-ink/60">שומר…</p>}

      {/* רשימת הקלטות */}
      {list.length === 0 ? (
        <p className="mt-3 text-sm text-ink/50">אין הקלטות עדיין.</p>
      ) : (
        <div className="mt-3 space-y-2">
          {list.map((r) => (
            <div key={r.id} className="rounded-2xl bg-white p-3 shadow-sm">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-ink">{repName(r.repId) || "הקלטה"}</span>
                <span className="flex items-center gap-2">
                  <span className="text-xs text-ink/50">{r.createdAt ? new Date(r.createdAt).toLocaleDateString("he-IL") : ""}{r.durationSec ? ` · ${fmt(r.durationSec)}` : ""}</span>
                  {canRecord && <button className="text-red-600 hover:text-red-700" title="מחיקה" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4" strokeWidth={1.75} /></button>}
                </span>
              </div>
              {urls[r.id] ? (
                <div className="rounded-xl bg-sand/50 p-1.5">
                  {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                  <audio className="w-full" controls autoPlay src={urls[r.id]} onPlay={() => trackEngagement("play")} />
                </div>
              ) : (
                <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-blush/60 py-2.5 text-sm font-semibold text-roseDark transition hover:bg-blush disabled:opacity-60" disabled={loadingId === r.id} onClick={() => loadAudio(r.id, r.mime)}>
                  {loadingId === r.id ? "טוען…" : (<><Play className="h-4 w-4" strokeWidth={2} fill="currentColor" /> האזנה</>)}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {canRecord && <p className="mt-2 text-xs text-ink/50">עד 10 דקות להקלטה. אפשר להוסיף כמה הקלטות שרוצים.</p>}
    </div>
  );
}
