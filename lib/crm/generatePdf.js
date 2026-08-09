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

// איסוף כל קטעי הטקסט שבתבנית, עם המיקום המדויק שלהם על המסך.
//
// המדידה נעשית מילה-מילה ולא שורה-שורה. הסיבה: בטקסט עברי שמעורב בו מספר
// או סימן לועזי, הדפדפן מחזיר כמה מלבנים לאותה שורה (קטע לכל כיוון כתיבה),
// וכל ניסיון "לחלק את המילים בין המלבנים" הופך את סדר המילים ומאבד חלק מהן.
// מדידה לכל מילה בנפרד נותנת מיקום נכון וגם שומרת על סדר הקריאה המקורי.
function collectTextItems(node) {
  const nodeRect = node.getBoundingClientRect();
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
  const items = [];

  for (let textNode = walker.nextNode(); textNode; textNode = walker.nextNode()) {
    const raw = textNode.nodeValue || "";
    if (!raw.trim()) continue;

    const style = window.getComputedStyle(textNode.parentElement);
    if (style.visibility === "hidden" || style.display === "none") continue;
    const fontSize = parseFloat(style.fontSize) || 12;

    const range = document.createRange();
    // כל רצף שאינו רווח נחשב "מילה", ונמדד לפי המיקום שלו בתוך צומת הטקסט
    const wordPattern = /\S+/g;
    let match;
    while ((match = wordPattern.exec(raw)) !== null) {
      range.setStart(textNode, match.index);
      range.setEnd(textNode, match.index + match[0].length);
      const rect = range.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) continue;
      items.push({
        text: match[0],
        right: rect.right - nodeRect.left,
        // בסיס הטקסט: קו התחתית של האותיות, בקירוב טוב דיו לשכבה בלתי נראית
        baseline: rect.bottom - nodeRect.top - rect.height * 0.2,
        fontSize,
      });
    }
  }

  return items;
}

const HEBREW_LETTERS = /[֐-׿]/;

// jsPDF הופך כל מילה עברית לפני שהוא כותב אותה לקובץ, כי הוא מניח שהיא נמסרה
// לו כבר "בסדר שרואים על המסך". התוצאה הייתה שהעתקה מהקובץ נתנה מילים הפוכות.
// לכן אנחנו הופכים אותה כאן מראש - וההיפוך שלו מחזיר אותה לסדר הקריאה הנכון.
// מילים באנגלית ומספרים אינם עוברים אצלו היפוך, ולכן גם כאן הם נשארים כמות שהם.
function forPdfStream(word) {
  return HEBREW_LETTERS.test(word) ? Array.from(word).reverse().join("") : word;
}

export async function generateCandidatePdf(node, filename) {
  const [{ default: html2canvas }, { jsPDF }, { HEBREW_FONT_BASE64 }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
    import("./hebrewPdfFont"),
  ]);

  await waitForImages(node);

  // נמדד לפני הצילום, כשהתבנית עדיין בפריסה המקורית שלה
  const textItems = collectTextItems(node);
  const sourceWidth = node.getBoundingClientRect().width || node.scrollWidth;

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

  // הטמעת הגופן העברי - בלעדיו טקסט עברי ב-PDF יוצא ג'יבריש בהעתקה
  pdf.addFileToVFS("AdamaHebrew.ttf", HEBREW_FONT_BASE64);
  pdf.addFont("AdamaHebrew.ttf", "AdamaHebrew", "normal");
  pdf.setFont("AdamaHebrew", "normal");

  // יחס ההמרה מפיקסלים במסך לנקודות ב-PDF
  const scale = imgWidth / sourceWidth;
  const totalPages = Math.max(1, Math.ceil(imgHeight / pageHeight));

  // שכבת הטקסט מצוירת במצב "בלתי נראה": היא אינה משנה דבר במראה הקובץ,
  // אבל אפשר לסמן, להעתיק ולחפש בה - בדיוק כמו במסמך טקסט רגיל.
  const drawTextLayer = (pageIndex) => {
    const pageTop = pageIndex * pageHeight;
    textItems.forEach((item) => {
      const y = item.baseline * scale;
      if (y < pageTop || y >= pageTop + pageHeight) return;
      pdf.setFontSize(Math.max(1, item.fontSize * scale));
      // רווח מפורש בסוף כל מילה: בלעדיו חלק מקוראי ה-PDF מדביקים את המילים
      // זו לזו בהעתקה, כי הם מנחשים גבולות מילים לפי מרחקים בלבד.
      pdf.text(`${forPdfStream(item.text)} `, item.right * scale, y - pageTop, {
        align: "right",
        renderingMode: "invisible",
      });
    });
  };

  let position = 0;
  pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
  drawTextLayer(0);

  for (let page = 1; page < totalPages; page++) {
    position -= pageHeight;
    pdf.addPage();
    pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
    drawTextLayer(page);
  }

  pdf.save(filename);
}
