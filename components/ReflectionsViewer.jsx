"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

// קריאת הסיכומים החודשיים של השגרירים ("איך עבר החודש?") — למנהלת, לקראת מפגשי צוות.
// מקובץ לפי חודש (החדש ביותר למעלה), ובתוך כל חודש — כרטיס לכל שגריר.
const MONTHS_HE = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];
const monthLabel = (key) => {
  const [y, m] = (key || "").split("-");
  return m ? `${MONTHS_HE[Number(m) - 1]} ${y}` : key || "—";
};

export default function ReflectionsViewer({ data }) {
  const all = data.reflections || [];
  const months = [...new Set(all.map((r) => r.month))].sort().reverse();
  const [openMonth, setOpenMonth] = useState(months[0] || null);
  const repName = (r) => (data.reps || []).find((x) => x.id === r.repId)?.name || r.repName || "שגריר/ה";
  const activeReps = (data.reps || []).filter((r) => !r.readOnly);

  if (all.length === 0) {
    return <p className="rounded-2xl bg-blush/30 p-4 text-sm text-ink/55">עדיין אין סיכומים. השגרירים ממלאים אותם במסך "המועמדים שלי" ← "איך עבר החודש?".</p>;
  }

  return (
    <div className="space-y-3">
      {months.map((m) => {
        const items = all.filter((r) => r.month === m).sort((a, b) => repName(a).localeCompare(repName(b), "he"));
        const missing = activeReps.filter((rep) => !items.some((r) => r.repId === rep.id));
        const open = openMonth === m;
        return (
          <div key={m} className="card !p-0 overflow-hidden">
            <button onClick={() => setOpenMonth(open ? null : m)} className="flex w-full items-center justify-between px-4 py-3 text-right">
              <span className="font-bold text-roseDark">{monthLabel(m)}</span>
              <span className="flex items-center gap-2 text-xs text-ink/50">
                מילאו {items.length} מתוך {activeReps.length}
                <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
              </span>
            </button>
            {open && (
              <div className="space-y-3 border-t border-sand px-4 pb-4 pt-3">
                {items.map((r) => (
                  <div key={r.id} className="rounded-2xl bg-blush/30 p-3 text-sm">
                    <p className="mb-2 font-bold text-ink">{repName(r)}</p>
                    {(r.questions || []).map((q) => [q.label, (r.answers || {})[q.id]]).map(([label, text]) => (
                      <div key={label} className="mb-2 last:mb-0">
                        <p className="text-xs font-semibold text-roseDark">{label}</p>
                        <p className="whitespace-pre-wrap text-ink/80">{text || <span className="text-ink/35">—</span>}</p>
                      </div>
                    ))}
                  </div>
                ))}
                {missing.length > 0 && (
                  <p className="text-xs text-ink/50">טרם מילאו: {missing.map((r) => r.name).join(", ")}</p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
