// תמונות והקלטות נשמרות דחוסות ישירות במסד הנתונים (בלי שירות אחסון בתשלום).

function loadImage(file: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("לא הצלחנו לקרוא את התמונה")); };
    img.src = url;
  });
}

export async function imageToDataUrl(file: Blob, maxSide: number, quality: number): Promise<string> {
  const img = await loadImage(file);
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.round(img.naturalWidth * scale);
  const h = Math.round(img.naturalHeight * scale);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  c.getContext("2d")!.drawImage(img, 0, 0, w, h);
  return c.toDataURL("image/jpeg", quality);
}

export async function photoVersions(file: File) {
  const [full, thumb] = await Promise.all([imageToDataUrl(file, 1280, 0.78), imageToDataUrl(file, 320, 0.7)]);
  return { full, thumb };
}

export function blobToDataUrl(b: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("read failed"));
    r.readAsDataURL(b);
  });
}

export const MAX_RECORD_SECONDS = 90;

export async function startRecording(): Promise<{ stop: () => Promise<Blob> }> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const types = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm"];
  const mimeType = types.find((t) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t));
  const rec = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 24000 });
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  rec.start();
  return {
    stop: () =>
      new Promise<Blob>((resolve) => {
        rec.onstop = () => {
          stream.getTracks().forEach((t) => t.stop());
          resolve(new Blob(chunks, { type: rec.mimeType || "audio/webm" }));
        };
        rec.stop();
      }),
  };
}
