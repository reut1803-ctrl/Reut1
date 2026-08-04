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

export async function generateCandidatePdf(node, filename) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);

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

  let heightLeft = imgHeight;
  let position = 0;
  pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position -= pageHeight;
    pdf.addPage();
    pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(filename);

  return { photosTotal: total, photosEmbedded: embedded };
}
