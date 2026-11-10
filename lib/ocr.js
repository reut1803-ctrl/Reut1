// זיהוי טקסט (OCR) בתוך הדפדפן — Tesseract, בלי שרת ובלי מפתח API.
// התמונות לא יוצאות מהמכשיר. הקבצים (כ-11MB) נטענים רק כשמשתמשים במחלץ אנשי הקשר.
const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";
const DIR = `${BASE}/ocr`;

let libPromise = null;
function loadLib() {
  if (typeof window !== "undefined" && window.Tesseract) return Promise.resolve(window.Tesseract);
  if (!libPromise) {
    libPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = `${DIR}/tesseract.min.js`;
      s.onload = () => resolve(window.Tesseract);
      s.onerror = () => { libPromise = null; reject(new Error("load-failed")); };
      document.head.appendChild(s);
    });
  }
  return libPromise;
}

// ניקוי התמונה לפני הזיהוי: הגדלה, שחור-לבן והסרת קווי הטבלה הארוכים
// (קווי הטבלה מבלבלים את הזיהוי; טקסט אף פעם לא ארוך כמו קו טבלה).
async function cleanImage(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const S = Math.min(3, Math.max(1, 2000 / img.width));
    const W = Math.round(img.width * S), H = Math.round(img.height * S);
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const x = c.getContext("2d"); x.imageSmoothingQuality = "high"; x.drawImage(img, 0, 0, W, H);
    const d = x.getImageData(0, 0, W, H), p = d.data;
    const dark = new Uint8Array(W * H);
    for (let i = 0; i < W * H; i++) dark[i] = 0.299 * p[i * 4] + 0.587 * p[i * 4 + 1] + 0.114 * p[i * 4 + 2] < 150 ? 1 : 0;
    const kill = new Uint8Array(W * H);
    const minH = Math.max(200, Math.round(W * 0.12)), minV = Math.max(140, Math.round(H * 0.06));
    for (let y = 0; y < H; y++) {
      let run = 0;
      for (let xx = 0; xx <= W; xx++) {
        if (xx < W && dark[y * W + xx]) run++;
        else { if (run >= minH) for (let k = xx - run; k < xx; k++) kill[y * W + k] = 1; run = 0; }
      }
    }
    for (let xx = 0; xx < W; xx++) {
      let run = 0;
      for (let y = 0; y <= H; y++) {
        if (y < H && dark[y * W + xx]) run++;
        else { if (run >= minV) for (let k = y - run; k < y; k++) kill[k * W + xx] = 1; run = 0; }
      }
    }
    for (let i = 0; i < W * H; i++) { const v = dark[i] && !kill[i] ? 0 : 255; p[i * 4] = p[i * 4 + 1] = p[i * 4 + 2] = v; p[i * 4 + 3] = 255; }
    x.putImageData(d, 0, 0);
    return c;
  } finally {
    URL.revokeObjectURL(url);
  }
}

const toLines = (data) => (data.blocks || [])
  .flatMap((b) => b.paragraphs.flatMap((p) => p.lines))
  .map((l) => ({ t: l.text.trim(), y0: l.bbox.y0, y1: l.bbox.y1, words: l.words.map((w) => ({ t: w.text, x0: w.bbox.x0, x1: w.bbox.x1 })) }));

// מחזיר שורות עברית ושורות ספרות (שני מעברים: עברית לשמות, ספרות בלבד לטלפונים)
export async function readContactSheet(file) {
  const T = await loadLib();
  const opt = { workerPath: `${DIR}/worker.min.js`, corePath: `${DIR}/`, langPath: DIR, gzip: true };
  const canvas = await cleanImage(file);
  const [wh, we] = await Promise.all([T.createWorker("heb", 1, opt), T.createWorker("eng", 1, opt)]);
  try {
    await wh.setParameters({ tessedit_pageseg_mode: "6", preserve_interword_spaces: "1" });
    await we.setParameters({ tessedit_pageseg_mode: "6", tessedit_char_whitelist: "0123456789-" });
    const [h, e] = await Promise.all([wh.recognize(canvas, {}, { blocks: true }), we.recognize(canvas, {}, { blocks: true })]);
    return { heb: toLines(h.data), eng: toLines(e.data) };
  } finally {
    wh.terminate(); we.terminate();
  }
}
