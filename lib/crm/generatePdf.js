// יצירת PDF אמיתי מכרטיס מועמד/ת - מצלם את התבנית (שהדפדפן מציג נכון בעברית ו-RTL) לתמונה ובונה סביבה PDF.

// התמונות מאוחסנות בשרת חיצוני (Cloudinary). מנוע הצילום אינו מצרף תמונות
// מדומיין אחר, ולכן הן יצאו ריקות מה-PDF. הפתרון: מורידים כל תמונה מראש,
// ממירים אותה לנתונים מוטמעים (base64) ומחליפים אותה בתבנית לפני הצילום.
async function toDataUrl(url) {
  const res = await fetch(url, { mode: "cors", cache: "no-store" });
  if (!res.ok) throw new Error(`image fetch failed: ${res.status}`);
  const blob = await res.blob();
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("image read failed"));
    reader.readAsDataURL(blob);
  });
}

async function inlineImages(node) {
  const images = [...node.querySelectorAll("img")];
  const originals = [];
  let embedded = 0;

  await Promise.all(
    images.map(async (img) => {
      const src = img.getAttribute("src");
      if (!src || src.startsWith("data:")) {
        if (src) embedded += 1;
        return;
      }
      try {
        const dataUrl = await toDataUrl(src);
        originals.push([img, src]);
        img.setAttribute("crossorigin", "anonymous");
        img.setAttribute("src", dataUrl);
        // ממתינים שהתמונה תיטען באמת, אחרת הצילום יתפוס אותה לפני שהיא מוכנה
        if (typeof img.decode === "function") await img.decode().catch(() => {});
        embedded += 1;
      } catch {
        // תמונה שלא הצליחה לרדת נשארת כפי שהיא - ה-PDF ייווצר בלעדיה במקום להיכשל
      }
    })
  );

  const restore = () => originals.forEach(([img, src]) => img.setAttribute("src", src));
  return { restore, total: images.length, embedded };
}

// מנוע ה-PDF כותב טקסט עברי בסדר חזותי (הפוך). היפוך מקדים של המקטעים העבריים
// גורם לכך שהטקסט שנשמר בקובץ - וזה שמועתק ממנו - יהיה בסדר הקריאה הנכון.
const HEB_RUN = /[֐-׿][֐-׿\s"'׳״().,·\-–]*[֐-׿]|[֐-׿]/g;
const toLogicalOrder = (text) => text.replace(HEB_RUN, (run) => [...run].reverse().join(""));

// אוסף כל קטע טקסט בעמוד יחד עם מיקומו, כדי להניח מעליו בקובץ שכבת טקסט אמיתית.
function collectTextItems(node) {
  const base = node.getBoundingClientRect();
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
  });
  const items = [];
  let current;
  while ((current = walker.nextNode())) {
    const range = document.createRange();
    range.selectNodeContents(current);
    const rect = range.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;
    const style = window.getComputedStyle(current.parentElement);
    items.push({
      text: current.nodeValue.trim(),
      left: rect.left - base.left,
      right: rect.right - base.left,
      bottom: rect.bottom - base.top,
      fontSize: parseFloat(style.fontSize) || 14,
    });
  }
  return items;
}

export async function generateCandidatePdf(node, filename) {
  const [{ default: html2canvas }, { jsPDF }, { HEB_FONT_NAME, HEB_FONT_BASE64 }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
    import("./pdfFont"),
  ]);

  const textItems = collectTextItems(node);
  const nodeWidth = node.offsetWidth || node.scrollWidth;
  const { restore, total, embedded } = await inlineImages(node);

  let canvas;
  try {
    canvas = await html2canvas(node, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      imageTimeout: 20000,
      windowWidth: node.scrollWidth,
      windowHeight: node.scrollHeight,
    });
  } finally {
    restore();
  }

  const imgData = canvas.toDataURL("image/jpeg", 0.92);

  // עמוד PDF תקני בגודל A4. התמונה תמיד מוצבת ברוחב מלא של העמוד עם גובה שנגזר
  // ביחס המקורי שלה (בלי שום מתיחה/עיוות של התמונה או הטקסט).
  // אם התוכן ארוך מעמוד אחד - הוא ממשיך אוטומטית לעמוד/ים נוספים (page break אמיתי),
  // במקום לכווץ הכל לתוך עמוד יחיד.
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  const pageCount = Math.max(1, Math.ceil(imgHeight / pageHeight));
  for (let page = 0; page < pageCount; page += 1) {
    if (page > 0) pdf.addPage();
    pdf.addImage(imgData, "JPEG", 0, -page * pageHeight, imgWidth, imgHeight);
  }

  // שכבת טקסט אמיתית ובלתי נראית מעל התמונה: הקובץ נראה בדיוק כמו קודם,
  // אבל אפשר לסמן, להעתיק ולחפש בתוכו טקסט - הוא אינו "תמונה נעולה".
  pdf.addFileToVFS(`${HEB_FONT_NAME}.ttf`, HEB_FONT_BASE64);
  pdf.addFont(`${HEB_FONT_NAME}.ttf`, HEB_FONT_NAME, "normal");
  pdf.setFont(HEB_FONT_NAME, "normal");
  pdf.setTextColor(0, 0, 0);

  const scale = imgWidth / nodeWidth;
  textItems.forEach((item) => {
    const y = item.bottom * scale;
    const page = Math.min(pageCount - 1, Math.floor(y / pageHeight));
    pdf.setPage(page + 1);
    pdf.setFontSize(Math.max(6, item.fontSize * scale));
    try {
      pdf.text(toLogicalOrder(item.text), item.right * scale, y - page * pageHeight, {
        renderingMode: "invisible",
        align: "right",
        isOutputVisual: true,
      });
    } catch {
      // קטע טקסט חריג לא יעצור את יצירת הקובץ
    }
  });

  pdf.save(filename);

  return { photosTotal: total, photosEmbedded: embedded };
}
