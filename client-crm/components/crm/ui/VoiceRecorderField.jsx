"use client";

import { useRef, useState } from "react";
import { Mic, Square, Trash2 } from "lucide-react";
import { saveMedia } from "@/lib/crm/mediaStore";
import { useMediaUrl } from "@/lib/crm/useMediaUrl";

const MAX_RECORD_MS = 5 * 60 * 1000;

// הקלטה קצרה יחידה. מחזירה מזהה מדיה (נשמר ב-Firestore בחלקים) דרך onChange.
export default function VoiceRecorderField({ value, onChange, label = "הקלטה קצרה (לא חובה)" }) {
  const [recording, setRecording] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timeoutRef = useRef(null);
  const { url } = useMediaUrl(value);

  const stop = () => {
    recorderRef.current?.stop();
    clearTimeout(timeoutRef.current);
    setRecording(false);
  };

  const start = async () => {
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
        setSaving(true);
        try {
          const ref = await saveMedia(blob, setStatus);
          onChange(ref);
        } catch (err) {
          setError(`שמירת ההקלטה נכשלה: ${err?.message || String(err)}`);
        } finally {
          setSaving(false);
          setStatus("");
        }
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
      timeoutRef.current = setTimeout(stop, MAX_RECORD_MS);
    } catch {
      setError("אין גישה למיקרופון - יש לאשר הרשאה בדפדפן ולנסות שוב");
    }
  };

  return (
    <div>
      <p className="mb-1.5 text-[12px] font-semibold text-[#5A4A3C]">{label}</p>

      {value ? (
        <div className="flex items-center gap-2">
          {url ? (
            <audio controls src={url} className="h-9 flex-1" />
          ) : (
            <p className="flex-1 text-[12px] text-[#8C7B6B]">טוען הקלטה...</p>
          )}
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label="מחיקת ההקלטה"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#C4584C] transition active:scale-90 hover:bg-red-50"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={recording ? stop : start}
          disabled={saving}
          className={`flex w-full items-center justify-center gap-1.5 rounded-2xl py-2.5 text-[13px] font-semibold text-white transition active:scale-[0.98] disabled:opacity-60 ${
            recording ? "bg-red-500" : "bg-[#C06E5E]"
          }`}
        >
          {recording ? <Square size={14} /> : <Mic size={15} />}
          {saving ? status || "שומרת הקלטה..." : recording ? "עצירת ההקלטה" : "הקלטה קצרה"}
        </button>
      )}

      {recording && <p className="mt-1 animate-pulse text-[11px] text-red-500">מקליטה כעת... (נעצרת אוטומטית אחרי 5 דקות)</p>}
      {error && <p className="mt-1 text-[11px] text-[#C4584C]">{error}</p>}
    </div>
  );
}
