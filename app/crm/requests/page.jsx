"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Inbox, Send, Trash2, Lock, ChevronLeft } from "lucide-react";
import { useCrmStore } from "@/lib/crm/store";
import Button from "@/components/crm/ui/Button";
import SearchableSelect from "@/components/crm/ui/SearchableSelect";

const OTHER_KIND = "אחר - הקלדה חופשית";

const REQUEST_KINDS = [
  "אימון לחתונה",
  "ליווי תוך כדי קשר",
  "עיבוד אחרי קשר ארוך",
  OTHER_KIND,
];

// הסבר קצר שמופיע מתחת לבחירה, כדי שיהיה ברור מה כל סוג בקשה כולל
const KIND_HINTS = {
  "אימון לחתונה": "כמה מפגשי הכנה על עולם השידוכים",
  [OTHER_KIND]: "כתבו בשדה שלמטה את הבקשה האישית, בחופשיות",
};

const STATUSES = ["חדש", "בטיפול", "טופל"];

// תיבת בקשות חסויה:
// אשת צוות מגישה בקשות עבור מועמדים, אך אינה רואה את הלוח הכללי.
// המנהלת בלבד רואה את כל הבקשות במרוכז ומחליטה מה לעשות עם כל אחת.
export default function RequestsPage() {
  const role = useCrmStore((s) => s.role);
  const candidates = useCrmStore((s) => s.candidates);
  const requests = useCrmStore((s) => s.requests);
  const addRequest = useCrmStore((s) => s.addRequest);
  const updateRequest = useCrmStore((s) => s.updateRequest);
  const deleteRequest = useCrmStore((s) => s.deleteRequest);
  const showToast = useCrmStore((s) => s.showToast);

  const [candidateId, setCandidateId] = useState("");
  const [kind, setKind] = useState(REQUEST_KINDS[0]);
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);

  const options = useMemo(
    () => candidates.map((c) => ({ value: c.id, label: `${c.name} (${c.gender === "male" ? "בחור" : "בחורה"})` })),
    [candidates]
  );

  if (role !== "staff" && role !== "admin") {
    return <p className="px-4 py-10 text-center text-sm text-[#7C6E60]">אזור זה זמין לצוות בלבד</p>;
  }

  const submit = async () => {
    // בבקשה מסוג "אחר" הפירוט הוא כל תוכן הבקשה, ולכן הוא חובה
    if (kind === OTHER_KIND && !note.trim()) {
      showToast("בבקשה מסוג \"אחר\" יש לכתוב את הבקשה בשדה הפירוט");
      return;
    }
    if (!note.trim() && !candidateId) {
      showToast("צריך לבחור מועמד/ת או לכתוב פירוט");
      return;
    }
    await addRequest({ candidateId, kind, note });
    setCandidateId("");
    setNote("");
    setSent(true);
    showToast("הבקשה נשלחה למנהלת");
    setTimeout(() => setSent(false), 4000);
  };

  return (
    <div className="px-4 py-6">
      <h1 className="flex items-center gap-2 text-xl font-bold text-[#3A2E26]">
        <Inbox size={20} /> בקשות מיוחדות
      </h1>
      <p className="mt-1 text-[13px] leading-relaxed text-[#7C6E60]">
        {role === "admin"
          ? "כל הבקשות שהצוות הגיש, במרוכז. הצוות אינו רואה את הלוח הזה."
          : "כאן מגישים בקשה מיוחדת עבור מועמד/ת. הבקשה נשלחת ישירות למנהלת."}
      </p>

      {/* טופס ההגשה - זמין גם לצוות וגם למנהלת */}
      <div className="mt-4 rounded-3xl border border-[#CCBDAB] bg-white p-4 shadow-[0_4px_18px_rgba(58,51,53,0.06)]">
        <p className="mb-2 text-[13px] font-semibold text-[#3A2E26]">בקשה חדשה</p>
        <div className="space-y-2">
          <SearchableSelect
            value={candidateId}
            onChange={setCandidateId}
            options={[{ value: "", label: "ללא מועמד/ת מסוים/ת" }, ...options]}
            placeholder="בנוגע למי הבקשה?"
            searchPlaceholder="הקלידו שם..."
          />
          <SearchableSelect
            value={kind}
            onChange={setKind}
            options={REQUEST_KINDS.map((k) => ({ value: k, label: k }))}
            placeholder="סוג הבקשה"
            searchPlaceholder="הקלידו לחיפוש..."
          />
          {KIND_HINTS[kind] && (
            <p className="px-1 text-[11px] leading-relaxed text-[#7C6E60]">{KIND_HINTS[kind]}</p>
          )}
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder={
              kind === OTHER_KIND ? "כתבו כאן את הבקשה במילים שלכם" : "פירוט הבקשה - מה נדרש ולמה"
            }
            className="w-full resize-y rounded-xl border border-[#CCBDAB] bg-white px-3 py-2.5 text-sm leading-relaxed outline-none focus:border-[#844442]"
          />
          <Button variant="primary" className="w-full" onClick={submit}>
            <Send size={16} /> שליחת הבקשה למנהלת
          </Button>
        </div>

        {sent && (
          <p className="mt-2 rounded-xl bg-[#DDE6DF] px-3 py-2 text-[12px] text-[#4A6552]">
            הבקשה נשלחה. המנהלת תראה אותה ותחליט על המשך הטיפול.
          </p>
        )}
      </div>

      {role === "staff" && (
        <div className="mt-4 flex items-start gap-2 rounded-2xl bg-[#E8DCCB] p-3">
          <Lock size={15} className="mt-0.5 shrink-0 text-[#7C6E60]" />
          <p className="text-[12px] leading-relaxed text-[#7C6E60]">
            הבקשות מרוכזות אצל המנהלת בלבד, כדי לשמור על סדר ועל שיקול דעת אחיד.
            אם הבקשה תאושר, היא תגיע אלייך כמשימה במסך המשימות.
          </p>
        </div>
      )}

      {role === "admin" && (
        <div className="mt-6">
          <h2 className="mb-3 text-[15px] font-bold text-[#3A2E26]">כל הבקשות ({requests.length})</h2>

          {requests.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#7C6E60]">עדיין לא הוגשו בקשות</p>
          ) : (
            <div className="space-y-2">
              {requests.map((r) => (
                <div
                  key={r.id}
                  className="rounded-2xl border border-[#CCBDAB] bg-white p-3 shadow-[0_2px_10px_rgba(58,51,53,0.05)]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      onClick={() => deleteRequest(r.id)}
                      aria-label="מחיקת הבקשה"
                      className="shrink-0 rounded-full p-1 text-[#C24545] hover:bg-red-50"
                    >
                      <Trash2 size={15} />
                    </button>
                    <div className="min-w-0 flex-1 text-right">
                      <p className="text-[13px] font-bold text-[#844442]">{r.kind}</p>
                      {r.candidateName && (
                        <Link
                          href={`/crm?openCandidate=${r.candidateId}`}
                          className="mt-0.5 inline-flex items-center gap-1 text-[12px] font-semibold text-[#3A2E26]"
                        >
                          בנוגע ל{r.candidateName} <ChevronLeft size={12} />
                        </Link>
                      )}
                      {r.note && (
                        <p className="mt-1 whitespace-pre-line text-[12px] leading-relaxed text-[#3A2E26]">{r.note}</p>
                      )}
                      <p className="mt-1 text-[11px] text-[#7C6E60]">
                        הוגש על ידי {r.createdByName} · {new Date(r.createdAt).toLocaleDateString("he-IL")}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2 flex gap-1.5 border-t border-[#E8DCCB] pt-2">
                    {STATUSES.map((st) => (
                      <button
                        key={st}
                        onClick={() => updateRequest(r.id, { status: st })}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                          (r.status || "חדש") === st
                            ? "bg-[#844442] text-white"
                            : "bg-[#E8DCCB] text-[#7C6E60]"
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
