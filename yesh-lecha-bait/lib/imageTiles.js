// ============================================================================
//  חיתוך צילום מסך לאריחים — בדפדפן.
//  מודל הראייה מקטין תמונה גדולה לפני שהוא קורא אותה, ובדפי קשר צפופים
//  הטקסט הזעיר נמחק בהקטנה. לכן חותכים את התמונה לאריחים ברזולוציה המקורית,
//  עם חפיפה קטנה כדי ששורה שנחתכה בגבול תופיע שלמה באחד האריחים.
// ============================================================================

const TILE = 1400; // צלע מקסימלית של אריח בפיקסלים
const OVERLAP = 0.1;
const MIN_SIDE = 900; // תמונה קטנה מוגדלת עד לפחות כך, לקריאה חדה יותר

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, url });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image-load-failed"));
    };
    img.src = url;
  });
}

function spans(total, size) {
  if (total <= size) return [[0, total]];
  const step = Math.floor(size * (1 - OVERLAP));
  const out = [];
  for (let s = 0; s < total; s += step) {
    const start = Math.min(s, total - size);
    out.push([start, size]);
    if (start + size >= total) break;
  }
  return out;
}

/** מחזיר מערך אריחים: { data: base64 בלי קידומת, mediaType, label } */
export async function fileToTiles(file) {
  const { img, url } = await loadImage(file);
  try {
    const W = img.naturalWidth;
    const H = img.naturalHeight;
    const up = Math.max(1, Math.min(2, MIN_SIDE / Math.max(1, Math.min(W, H))));
    const xs = spans(W, TILE);
    const ys = spans(H, TILE);
    const tiles = [];
    for (const [y0, h] of ys) {
      for (const [x0, w] of xs) {
        const c = document.createElement("canvas");
        c.width = Math.round(w * up);
        c.height = Math.round(h * up);
        const ctx = c.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, x0, y0, w, h, 0, 0, c.width, c.height);
        const dataUrl = c.toDataURL("image/jpeg", 0.9);
        tiles.push({
          data: dataUrl.slice(dataUrl.indexOf(",") + 1),
          mediaType: "image/jpeg",
          label: `${tiles.length + 1}`,
        });
      }
    }
    return tiles;
  } finally {
    URL.revokeObjectURL(url);
  }
}
