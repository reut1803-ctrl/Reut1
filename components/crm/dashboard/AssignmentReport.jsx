"use client";

import { useMemo, useRef, useState } from "react";
import { ClipboardList, Download, Printer, X } from "lucide-react";
import { useCrmStore } from "@/lib/crm/store";
import { generateCandidatePdf } from "@/lib/crm/generatePdf";
import { buildAssignmentGroups } from "@/lib/crm/assignmentReport";

const countLabel = (n) => (n === 0 ? "אין מועמדים" : n === 1 ? "מועמד/ת אחד/ת" : `${n} מועמדים`);

// דוח שיוכים למנהלת בלבד: מי מהצוות מלווה את מי, ומי נשאר בלי ליווי.
// הדוח נשען על שדה "נציג/ה מלווה" שבכרטיס המועמד/ת (contactStaffEmail).
export default function AssignmentReport() {
  const candidates = useCrmStore((s) => s.candidates);
  const staffList = useCrmStore((s) => s.staffList());
  const authAllowlist = useCrmStore((s) => s.authAllowlist);

  const reportRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const { groups, unassigned, assignedCount } = useMemo(
    () => buildAssignmentGroups({ candidates, staffList, allowlist: authAllowlist }),
    [candidates, staffList, authAllowlist]
  );

  const now = new Date();
  const today = now.toLocaleDateString("he-IL");
  // שם קובץ באותיות לטיניות בלבד - חלק מהדפדפנים בנייד מוותרים על שם עם עברית
  const fileStamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const handlePdf = async () => {
    if (!reportRef.current || busy) return;
    setBusy(true);
    try {
      await generateCandidatePdf(reportRef.current, `adama-assignments-${fileStamp}.pdf`);
    } finally {
      setBusy(false);
    }
  };

  const handlePrint = () => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    root.classList.add("printing-report");
    const cleanup = () => {
      root.classList.remove("printing-report");
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    window.print();
    // גיבוי לדפדפנים שלא משגרים afterprint (בעיקר בנייד)
    setTimeout(cleanup, 1500);
  };

  return (
    <>
      <h2
        data-tour="tour-assignment-report"
        className="mt-8 mb-3 flex items-center gap-1.5 text-[15px] font-bold text-[#3A2E26]"
      >
        <ClipboardList size={17} /> דוח שיוכים - מי מלווה את מי
      </h2>

      <div
        ref={reportRef}
        data-print-area
        className="rounded-3xl border border-[#CCBDAB] bg-white p-4 shadow-[0_4px_18px_rgba(58,51,53,0.06)]"
      >
        <div className="mb-3 border-b border-[#E8DCCB] pb-3">
          <p className="text-[14px] font-bold text-[#3A2E26]">דוח שיוכי מועמדים</p>
          <p className="mt-0.5 text-[11px] text-[#7C6E60]">
            נכון לתאריך {today} · {assignedCount} משויכים · {unassigned.length} ללא שיוך · סה"כ {candidates.length}
          </p>
        </div>

        {candidates.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-[#7C6E60]">אין עדיין מועמדים במאגר</p>
        ) : (
          <div className="space-y-4">
            {groups.map((g) => (
              <div key={g.email}>
                <div className="flex items-center justify-between gap-2 rounded-xl bg-[#E8DCCB] px-3 py-2">
                  <span className="shrink-0 text-[11px] font-semibold text-[#7C6E60]">{countLabel(g.items.length)}</span>
                  <span className="min-w-0 truncate text-[13px] font-bold text-[#3A2E26]">
                    {g.name}
                    {g.removed && <span className="mr-1 text-[11px] font-normal text-[#C24545]">(כבר לא בצוות)</span>}
                  </span>
                </div>

                {g.items.length === 0 ? (
                  <p className="px-3 py-2 text-right text-[12px] text-[#A2937F]">עדיין לא שויכו מועמדים</p>
                ) : (
                  <ul className="mt-1 space-y-0.5">
                    {g.items.map((c) => (
                      <li
                        key={c.id}
                        className="flex items-center justify-between gap-2 border-b border-[#F1E8DC] px-3 py-1.5 last:border-0"
                      >
                        <span className="shrink-0 text-[14px] font-extrabold text-[#4A6552]">V</span>
                        <span className="min-w-0 truncate text-right text-[13px] text-[#3A2E26]">
                          {c.name}
                          {c.age ? <span className="text-[#7C6E60]"> · גיל {c.age}</span> : null}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}

            <div>
              <div className="flex items-center justify-between gap-2 rounded-xl bg-[#FBEDED] px-3 py-2">
                <span className="shrink-0 text-[11px] font-semibold text-[#C24545]">{countLabel(unassigned.length)}</span>
                <span className="text-[13px] font-bold text-[#C24545]">מועמדים ללא שיוך</span>
              </div>

              {unassigned.length === 0 ? (
                <p className="px-3 py-2 text-right text-[12px] text-[#4A6552]">מצוין - כל המועמדים משויכים לנציג/ה</p>
              ) : (
                <ul className="mt-1 space-y-0.5">
                  {unassigned.map((c) => (
                    <li
                      key={c.id}
                      className="flex items-center justify-between gap-2 border-b border-[#F1E8DC] px-3 py-1.5 last:border-0"
                    >
                      <span className="flex shrink-0 items-center gap-1 text-[12px] font-extrabold text-[#C24545]">
                        <X size={15} strokeWidth={3} /> חסר
                      </span>
                      <span className="min-w-0 truncate text-right text-[13px] text-[#3A2E26]">
                        {c.name}
                        {c.age ? <span className="text-[#7C6E60]"> · גיל {c.age}</span> : null}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>

      <div data-print-hide className="mt-2 flex gap-2">
        <button
          onClick={handlePdf}
          disabled={busy}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-[#844442] px-4 py-2.5 text-[13px] font-semibold text-white transition active:scale-95 disabled:opacity-60"
        >
          <Download size={15} /> {busy ? "מכין קובץ..." : "הורדה כ-PDF"}
        </button>
        <button
          onClick={handlePrint}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-[#CCBDAB] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#3A2E26] transition active:scale-95"
        >
          <Printer size={15} /> הדפסה
        </button>
      </div>
    </>
  );
}
