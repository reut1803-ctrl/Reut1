"use client";

import { useRef, useState } from "react";
import { Mic, Square, Loader2, Trash2, Camera } from "lucide-react";
import { saveMedia, deleteMedia } from "@/lib/crm/mediaStore";
import { useMediaUrl } from "@/lib/crm/useMediaUrl";
import MediaImage from "@/components/crm/ui/MediaImage";
import { compressToDataUrl, dataUrlToFile } from "@/lib/crm/imageCompress";

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
  const data = value || { name: "", notes: "", audioUrl: null, photoUrl: null, phone: "" };
  const set = (patch) => onChange({ ...data, ...patch });

  const [photoBusy, setPhotoBusy] = useState(false);
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

  // תמונה אופציונלית לכרטיס המקוצר. מכווצת לפני השמירה, כדי שמיני-כרטיס
  // לא ינפח את מסד הנתונים כמו כרטיס מלא במאגר.
  const handlePhoto = async (file) => {
    if (!file) return;
    setError("");
    setPhotoBusy(true);
    try {
      const ref = await saveMedia(dataUrlToFile(await compressToDataUrl(file), "photo.jpg"));
      set({ photoUrl: ref });
    } catch (err) {
      setError(`שמירת התמונה נכשלה: ${err?.message || String(err)}`);
    } finally {
      setPhotoBusy(false);
    }
  };

  const removePhoto = async () => {
    const ref = data.photoUrl;
    set({ photoUrl: null });
    try {
      await deleteMedia(ref);
    } catch {
      /* אם המחיקה נכשלה, ההפניה כבר הוסרה מההצעה */
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

      {/* טלפון לבירורים - שדה מובנה, במקום לשרשר מספרים לתוך ההערות */}
      <input
        type="tel"
        dir="ltr"
        value={data.phone || ""}
        onChange={(e) => set({ phone: e.target.value })}
        placeholder="טלפון לבירורים (לא חובה)"
        className="mt-2 w-full rounded-xl border border-[#CCBDAB] bg-white px-3 py-2 text-right text-sm outline-none focus:border-[#844442]"
      />

      <textarea
        value={data.notes}
        onChange={(e) => set({ notes: e.target.value })}
        rows={3}
        placeholder="כמה משפטים עליו/עליה: גיל, רקע, אופי, מה מחפש/ת..."
        className="mt-2 w-full resize-y rounded-xl border border-[#CCBDAB] bg-white px-3 py-2 text-sm leading-relaxed outline-none focus:border-[#844442]"
      />

      {/* תמונה - אופציונלי לחלוטין. אפשר לשמור את הכרטיס גם בלעדיה. */}
      <div className="mt-2">
        {data.photoUrl ? (
          <div className="flex items-center gap-2 rounded-xl border border-[#CCBDAB] bg-white p-2">
            <MediaImage
              src={data.photoUrl}
              alt="תמונת הכרטיס"
              className="h-14 w-14 shrink-0 rounded-lg object-cover"
            />
            <p className="flex-1 text-[11px] font-semibold text-[#4A6552]">התמונה נשמרה</p>
            <button
              type="button"
              onClick={removePhoto}
              aria-label="הסרת התמונה"
              title="הסרת התמונה"
              className="rounded-xl bg-[#F0E2DE] p-2 text-[#C24545] transition active:scale-90"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ) : (
          <label className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#844442] bg-white py-2 text-[12px] font-semibold text-[#844442] transition active:scale-95">
            {photoBusy ? (
              <>
                <Loader2 size={14} className="animate-spin" /> שומר את התמונה...
              </>
            ) : (
              <>
                <Camera size={14} /> הוספת תמונה (לא חובה)
              </>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={photoBusy}
              onChange={(e) => handlePhoto(e.target.files?.[0])}
            />
          </label>
        )}
      </div>

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
