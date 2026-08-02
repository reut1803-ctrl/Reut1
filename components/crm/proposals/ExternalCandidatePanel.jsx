"use client";

import { useRef, useState } from "react";
import { Mic, Square, Loader2, Trash2 } from "lucide-react";
import { saveMedia, deleteMedia } from "@/lib/crm/mediaStore";
import { useMediaUrl } from "@/lib/crm/useMediaUrl";

const MAX_RECORD_MS = 60 * 1000;

function AudioPreview({ value }) {
  const { url, loading, error } = useMediaUrl(value);
  if (loading) return <p className="text-[11px] text-[#7C6E60]">טוען הקלטה...</p>;
  if (error) return <p className="text-[11px] text-[#C24545]">{error}</p>;
  if (!url) return null;
  // eslint-disable-next-line jsx-a11y/media-has-caption
  return <audio src={url} controls className="h-9 w-full" />;
}

// "מיני-כרטיס" למועמד/ת שאינו/ה במאגר - מישהו מהמעגל האישי של השדכנית.
// כל מה שנכתב כאן נשמר אך ורק בתוך ההצעה הזו, ולא נוצר ממנו כרטיס במאגר.
export default function ExternalCandidatePanel({ value, onChange, genderLabel }) {
  const data = value || { name: "", notes: "", audioUrl: null };
  const set = (patch) => onChange({ ...data, ...patch });

  const [recording, setRecording] = useState(false);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timeoutRef = useRef(null);

  const stopRecording = () => {
    recorderRef.current?.stop();
    clearTimeout(timeoutRef.current);
    setRecording(false);
  };

  const startRecording = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType =
        typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        setBusy(true);
        try {
          const ref = await saveMedia(blob, setStatus);
          set({ audioUrl: ref });
        } catch (err) {
          setError(`שמירת ההקלטה נכשלה: ${err?.message || String(err)}`);
        } finally {
          setBusy(false);
          setStatus("");
        }
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
      timeoutRef.current = setTimeout(stopRecording, MAX_RECORD_MS);
    } catch {
      setError("אין גישה למיקרופון - יש לאשר הרשאה בדפדפן ולנסות שוב");
    }
  };

  const removeAudio = async () => {
    const ref = data.audioUrl;
    set({ audioUrl: null });
    try {
      await deleteMedia(ref);
    } catch {
      /* אם המחיקה נכשלה, ההפניה כבר הוסרה מההצעה */
    }
  };

  return (
    <div className="mt-2 rounded-2xl border-2 border-[#844442] bg-[#F0E2DE] p-3">
      <p className="text-[11px] font-bold text-[#844442]">
        {genderLabel} מהמעגל שלי - כרטיס מקוצר
      </p>
      <p className="mt-0.5 text-[10px] leading-snug text-[#7C6E60]">
        הפרטים כאן נשמרים בתוך ההצעה הזו בלבד ואינם נכנסים למאגר המועמדים.
      </p>

      <input
        type="text"
        value={data.name}
        onChange={(e) => set({ name: e.target.value })}
        placeholder="שם או זיהוי (למשל: בחור שפגשתי בשבת)"
        className="mt-2 w-full rounded-xl border border-[#CCBDAB] bg-white px-3 py-2 text-sm outline-none focus:border-[#844442]"
      />

      <textarea
        value={data.notes}
        onChange={(e) => set({ notes: e.target.value })}
        rows={3}
        placeholder="כמה משפטים עליו/עליה: גיל, רקע, אופי, מה מחפש/ת..."
        className="mt-2 w-full resize-y rounded-xl border border-[#CCBDAB] bg-white px-3 py-2 text-sm leading-relaxed outline-none focus:border-[#844442]"
      />

      <div className="mt-2">
        {data.audioUrl ? (
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <AudioPreview value={data.audioUrl} />
            </div>
            <button
              type="button"
              onClick={removeAudio}
              aria-label="מחיקת ההקלטה"
              className="rounded-xl bg-white p-2 text-[#C24545]"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={recording ? stopRecording : startRecording}
            className={`flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-[12px] font-semibold text-white transition active:scale-95 ${
              recording ? "bg-[#C24545]" : "bg-[#844442]"
            } disabled:opacity-60`}
          >
            {busy ? (
              <>
                <Loader2 size={14} className="animate-spin" /> {status || "שומר..."}
              </>
            ) : recording ? (
              <>
                <Square size={14} /> עצירת ההקלטה
              </>
            ) : (
              <>
                <Mic size={14} /> הקלטה קצרה (עד דקה)
              </>
            )}
          </button>
        )}
      </div>

      {error && <p className="mt-1.5 text-[11px] text-[#C24545]">{error}</p>}
    </div>
  );
}
