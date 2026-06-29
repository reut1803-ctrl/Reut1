"use client";

import { PERSONAL_FIELDS } from "./questions";

// ייצוא נקי של מועמד - ללא "מידע רגיש" וללא מספרי טלפון לבירורים (אנשי הקשר).
export function buildCleanLines(candidate, openQuestions) {
  const lines = [];
  lines.push(`מסלול: ${candidate.gender === "female" ? "בחורה" : "בחור"}`);
  PERSONAL_FIELDS.forEach((f) => {
    lines.push(`${f.label}: ${candidate[f.key] || ""}`);
  });
  lines.push("");
  (openQuestions || []).forEach((q) => {
    lines.push(q.label);
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
    "position:fixed;top:-10000px;right:0;width:794px;padding:48px;background:#ffffff;color:#4a4039;font-family:Heebo,system-ui,sans-serif;line-height:1.7;font-size:16px;";

  const esc = (s) =>
    String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  let html = `<h1 style="color:#A84F4F;margin:0 0 16px;">${esc(candidate.fullName)}</h1>`;
  html += `<div style="margin-bottom:24px;color:#888;">${candidate.gender === "female" ? "בחורה" : "בחור"}</div>`;
  PERSONAL_FIELDS.forEach((f) => {
    html += `<div style="margin-bottom:6px;"><strong>${esc(f.label)}:</strong> ${esc(candidate[f.key])}</div>`;
  });
  html += `<hr style="margin:20px 0;border:none;border-top:1px solid #eee;"/>`;
  (openQuestions || []).forEach((q) => {
    html += `<div style="margin-bottom:14px;"><div style="font-weight:600;color:#A84F4F;">${esc(q.label)}</div><div>${esc(candidate.answers?.[q.key])}</div></div>`;
  });
  if (candidate.references?.length) {
    html += `<hr style="margin:20px 0;border:none;border-top:1px solid #eee;"/>`;
    html += `<div style="font-weight:600;color:#A84F4F;">אנשי קשר</div>`;
    candidate.references.forEach((r, i) => {
      html += `<div>${i + 1}. ${esc(r.name)} — ${esc(r.relation)}</div>`;
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
