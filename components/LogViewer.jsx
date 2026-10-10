"use client";

// יומן פעילות - הרשאת מנהלת בלבד. מציג מי עשה מה ומתי, מהחדש לישן.
export default function LogViewer({ data }) {
  const logs = [...(data.logs || [])].sort((a, b) =>
    (b.at || "").localeCompare(a.at || "")
  );

  function fmt(iso) {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      return d.toLocaleString("he-IL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return iso;
    }
  }

  return (
    <div className="card space-y-2">
      <p className="text-xs text-ink/60">כל פעולה נרשמת עם שם המבצע/ת והשעה. לצפייה בלבד.</p>
      <div className="max-h-96 space-y-1.5 overflow-y-auto pt-1">
        {logs.length === 0 && <p className="text-sm text-ink/40">אין רישומים עדיין.</p>}
        {logs.map((l) => (
          <div key={l.id} className="rounded-xl bg-blush/40 px-3 py-2 text-sm">
            <p className="text-ink/90">
              <span className="font-semibold text-roseDark">{l.actor}</span> {l.action}
            </p>
            <p className="text-xs text-ink/50">{fmt(l.at)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
