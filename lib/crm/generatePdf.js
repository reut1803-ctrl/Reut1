// יצירת PDF אמיתי מכרטיס מועמד/ת - מצלם את התבנית (שהדפדפן מציג נכון בעברית ו-RTL) לתמונה ובונה סביבה PDF.
export async function generateCandidatePdf(node, filename) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);

  const canvas = await html2canvas(node, {
    scale: 2,
    backgroundColor: "#ffffff",
    windowWidth: node.scrollWidth,
    windowHeight: node.scrollHeight,
  });
  const imgData = canvas.toDataURL("image/jpeg", 0.92);

  const widthPt = node.offsetWidth * 0.75;
  const heightPt = node.offsetHeight * 0.75;

  // חובה לציין orientation במפורש - אחרת jsPDF מניח "portrait" ומחליף לבד בין הרוחב לגובה
  // כשהרוחב גדול מהגובה, מה שגרם לתמונה לחרוג מהעמוד (זה היה הבאג האמיתי בחיתוך).
  const orientation = widthPt >= heightPt ? "landscape" : "portrait";
  const pdf = new jsPDF({ unit: "pt", format: [widthPt, heightPt], orientation });
  pdf.addImage(imgData, "JPEG", 0, 0, widthPt, heightPt);
  pdf.save(filename);
}
