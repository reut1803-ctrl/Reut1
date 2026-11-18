"use client";

import { useEffect, useRef, useState } from "react";
import { useTripCtx } from "@/lib/tripContext";
import { MAX_RECORD_SECONDS, blobToDataUrl, startRecording } from "@/lib/media";
import Icon from "../app/Icon";

/** נגן להקלטה ששמורה בנפרד — נטען רק כשלוחצים */
export function AudioClip({ audioId }: { audioId: string }) {
  const { store } = useTripCtx();
  const [src, setSrc] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (src) return <audio className="audio" controls autoPlay src={src} />;
  return (
    <button type="button" className="chip-btn" disabled={busy} onClick={async () => {
      setBusy(true);
      const r = await store.get("audioData", audioId);
      setSrc((r?.data as string) ?? null);
      setBusy(false);
    }}>
      <Icon name="play" />{busy ? "טוען…" : "השמעת ההקלטה"}
    </button>
  );
}

/** תמונה מוקטנת שנפתחת בגודל מלא בלחיצה */
export function PhotoThumb({ id, thumb, caption }: { id: string; thumb: string; caption?: string }) {
  const { store } = useTripCtx();
  const [full, setFull] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="thumb" onClick={async () => {
        setOpen(true);
        if (!full) { const r = await store.get("photoData", id); setFull((r?.data as string) ?? thumb); }
      }}>
        <img src={thumb} alt={caption || "תמונה מהטיול"} loading="lazy" />
      </button>
      {open && (
        <div className="lightbox" role="dialog" aria-modal="true" onClick={() => setOpen(false)}>
          <img src={full ?? thumb} alt={caption || "תמונה מהטיול"} />
          {caption && <p>{caption}</p>}
          <button type="button" className="lightbox-x" aria-label="סגירה">×</button>
        </div>
      )}
    </>
  );
}

/** כפתור הקלטה קולית (עד 90 שניות) */
export function Recorder({ onDone }: { onDone: (dataUrl: string) => void }) {
  const [state, setState] = useState<"idle" | "rec" | "busy">("idle");
  const [secs, setSecs] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const ctl = useRef<{ stop: () => Promise<Blob> } | null>(null);

  useEffect(() => {
    if (state !== "rec") return;
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [state]);

  useEffect(() => { if (state === "rec" && secs >= MAX_RECORD_SECONDS) void stop(); });

  async function start() {
    setErr(null);
    try {
      ctl.current = await startRecording();
      setSecs(0);
      setState("rec");
    } catch {
      setErr("אין גישה למיקרופון. צריך לאשר לדפדפן להשתמש בו.");
    }
  }
  async function stop() {
    if (!ctl.current) return;
    setState("busy");
    const blob = await ctl.current.stop();
    ctl.current = null;
    onDone(await blobToDataUrl(blob));
    setState("idle");
  }

  return (
    <div className="recorder">
      {state === "rec" ? (
        <button type="button" className="rec-btn rec-btn--on" onClick={stop}>
          <span className="rec-dot" /><Icon name="stop" />עצירה · {secs} שנ׳
        </button>
      ) : (
        <button type="button" className="rec-btn" onClick={start} disabled={state === "busy"}>
          <Icon name="mic" />{state === "busy" ? "שומרים…" : "הקלטה קולית"}
        </button>
      )}
      {err && <p className="gate-error">{err}</p>}
    </div>
  );
}
