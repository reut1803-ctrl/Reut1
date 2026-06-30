"use client";

import { PERSONAL_FIELDS, genderLabel } from "./questions";

// ייצוא נקי של מועמד - ללא "מידע רגיש" וללא מספרי טלפון לבירורים (אנשי הקשר).
export function buildCleanLines(candidate, openQuestions) {
  const g = candidate.gender;
  const lines = [];
  lines.push(`מסלול: ${g === "female" ? "בחורה" : "בחור"}`);
  PERSONAL_FIELDS.forEach((f) => {
    lines.push(`${genderLabel(f, g)}: ${candidate[f.key] || ""}`);
  });
  lines.push("");
  (openQuestions || []).forEach((q) => {
    lines.push(genderLabel(q, g));
    lines.push(candidate.answers?.[q.key] || "");
    lines.push("");
  });
  // אנשי קשר - ללא מספרי טלפון (טלפון לבירורים מוסתר מהייצוא)
  if (candidate.references?.length) {
    lines.push("אנשי קשר:");
    candidate.references.forEach((r, i) => {
      lines.push(`${i + 1}. ${r.name} — ${r.relation}`);
    });
  }
  return lines;
}

export function buildCleanText(candidate, openQuestions) {
  return buildCleanLines(candidate, openQuestions).join("\n");
}

export async function copyClean(candidate, openQuestions) {
  const text = buildCleanText(candidate, openQuestions);
  await navigator.clipboard.writeText(text);
}

// יצירת PDF נקי. שימוש ב-html2canvas כדי לתמוך בעברית ובכיווניות RTL.
export async function downloadPdf(candidate, openQuestions) {
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import("jspdf"),
    import("html2canvas"),
  ]);

  const node = document.createElement("div");
  node.dir = "rtl";
  node.style.cssText =
    "position:fixed;top:-10000px;right:0;width:900px;padding:56px;background:#ffffff;color:#3f3833;font-family:Heebo,system-ui,sans-serif;line-height:1.7;font-size:24px;";

  const esc = (s) =>
    String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const g = candidate.gender;
  let html = `<h1 style="color:#A84F4F;margin:0 0 8px;font-size:46px;">${esc(candidate.fullName)}</h1>`;
  html += `<div style="margin-bottom:28px;color:#999;font-size:22px;">${g === "female" ? "בחורה" : "בחור"}</div>`;

  // פרטים אישיים - כל פרט במשבצת בהירה
  html += `<div style="display:flex;flex-wrap:wrap;gap:12px;margin-bottom:28px;">`;
  PERSONAL_FIELDS.forEach((f) => {
    html += `<div style="background:#FBF4F2;border-radius:14px;padding:12px 18px;font-size:23px;min-width:45%;"><strong style="color:#A84F4F;">${esc(genderLabel(f, g))}:</strong> ${esc(candidate[f.key])}</div>`;
  });
  html += `</div>`;

  // שאלות - כל שאלה מעל משבצת בהירה עם המענה בתוכה
  (openQuestions || []).forEach((q) => {
    html += `<div style="margin-bottom:22px;">`;
    html += `<div style="font-weight:700;color:#A84F4F;font-size:25px;margin-bottom:8px;">${esc(genderLabel(q, g))}</div>`;
    html += `<div style="background:#F7E9E6;border-radius:16px;padding:16px 20px;font-size:24px;white-space:pre-wrap;">${esc(candidate.answers?.[q.key])}</div>`;
    html += `</div>`;
  });

  if (candidate.references?.length) {
    html += `<div style="font-weight:700;color:#A84F4F;font-size:25px;margin:24px 0 8px;">אנשי קשר</div>`;
    candidate.references.forEach((r, i) => {
      html += `<div style="background:#FBF4F2;border-radius:14px;padding:12px 18px;font-size:23px;margin-bottom:10px;">${i + 1}. ${esc(r.name)} — ${esc(r.relation)}</div>`;
    });
  }
  node.innerHTML = html;
  document.body.appendChild(node);

  try {
    const canvas = await html2canvas(node, { scale: 2, backgroundColor: "#ffffff" });
    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgW = pageW;
    const imgH = (canvas.height * imgW) / canvas.width;
    let heightLeft = imgH;
    let position = 0;
    pdf.addImage(img, "PNG", 0, position, imgW, imgH);
    heightLeft -= pageH;
    while (heightLeft > 0) {
      position -= pageH;
      pdf.addPage();
      pdf.addImage(img, "PNG", 0, position, imgW, imgH);
      heightLeft -= pageH;
    }
    pdf.save(`${candidate.fullName || "מועמד"}.pdf`);
  } finally {
    document.body.removeChild(node);
  }
}
