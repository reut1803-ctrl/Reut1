// יצירת PDF אמיתי מכרטיס מועמד/ת - מצלם את התבנית (שהדפדפן מציג נכון בעברית ו-RTL) לתמונה ובונה סביבה PDF.
// html2canvas מצייר את מה שקיים ברגע הצילום. תמונה שהוגדרה זה עתה עדיין
// נטענת, ולכן בלי ההמתנה הזו הקובץ יוצא עם מקום ריק במקום התמונה.
async function waitForImages(node, timeoutMs = 8000) {
  const images = Array.from(node.querySelectorAll("img"));
  if (images.length === 0) return;
  await Promise.race([
    Promise.all(
      images.map((img) => {
        if (img.complete && img.naturalWidth > 0) return Promise.resolve();
        return new Promise((resolve) => {
          img.addEventListener("load", resolve, { once: true });
          img.addEventListener("error", resolve, { once: true });
        });
      })
    ),
    new Promise((resolve) => setTimeout(resolve, timeoutMs)),
  ]);
  // פריים נוסף, כדי שהדפדפן יספיק לצייר את התמונה שנטענה
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

export async function generateCandidatePdf(node, filename) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);

  await waitForImages(node);

  const canvas = await html2canvas(node, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
    imageTimeout: 15000,
    windowWidth: node.scrollWidth,
    windowHeight: node.scrollHeight,
  });
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
}
