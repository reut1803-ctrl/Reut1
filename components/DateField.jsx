"use client";

import { useState, useEffect } from "react";
import { toHebrewDate } from "../lib/dates";
import { hebrewToISO, isoToHebrew, civilMonths, lastDayOfHebrewMonth, hebrewNumeral, hebrewYearNumeral } from "../lib/hebrew";

// שדה תאריך עם בחירה בין עברי (ברירת מחדל) ללועזי. הערך נשמר כתאריך לועזי (ISO).
export default function DateField({ value, onChange }) {
  const [mode, setMode] = useState("hebrew");
  const todayHeb = isoToHebrew(new Date().toISOString().slice(0, 10)) || { year: 5786 };
  const init = isoToHebrew(value);
  const [hy, setHy] = useState(init?.year || todayHeb.year);
  const [hm, setHm] = useState(init?.month || "");
  const [hd, setHd] = useState(init?.day || "");

  useEffect(() => {
    const h = isoToHebrew(value);
    if (h) {
      setHy(h.year);
      setHm(h.month);
      setHd(h.day);
    }
  }, [value]);

  function updateHeb(y, m, d) {
    y = Number(y) || "";
    m = Number(m) || "";
    d = Number(d) || "";
    if (y && m) {
      const md = lastDayOfHebrewMonth(y, m);
      if (d > md) d = md;
    }
    setHy(y);
    setHm(m);
    setHd(d);
    if (y && m && d) onChange(hebrewToISO(y, m, d));
    else onChange("");
  }

  const cur = todayHeb.year;
  const years = [];
  for (let y = cur + 5; y >= cur - 110; y--) years.push(y);
  const months = civilMonths(Number(hy) || cur);
  const maxDay = hy && hm ? lastDayOfHebrewMonth(Number(hy), Number(hm)) : 30;

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button type="button" onClick={() => setMode("hebrew")} className={`rounded-xl px-3 py-1.5 text-sm font-medium ${mode === "hebrew" ? "bg-rose text-white" : "bg-blush text-roseDark"}`}>עברי</button>
        <button type="button" onClick={() => setMode("gregorian")} className={`rounded-xl px-3 py-1.5 text-sm font-medium ${mode === "gregorian" ? "bg-rose text-white" : "bg-blush text-roseDark"}`}>לועזי</button>
      </div>

      {mode === "hebrew" ? (
        <div className="grid grid-cols-3 gap-2">
          <select className="field-input" value={hd} onChange={(e) => updateHeb(hy, hm, e.target.value)}>
            <option value="">יום</option>
            {Array.from({ length: maxDay }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>{hebrewNumeral(d)}</option>
            ))}
          </select>
          <select className="field-input" value={hm} onChange={(e) => updateHeb(hy, e.target.value, hd)}>
            <option value="">חודש</option>
            {months.map((m) => (
              <option key={m.value} value={m.value}>{m.name}</option>
            ))}
          </select>
          <select className="field-input" value={hy} onChange={(e) => updateHeb(e.target.value, hm, hd)}>
            {years.map((y) => (
              <option key={y} value={y}>{hebrewYearNumeral(y)}</option>
            ))}
          </select>
        </div>
      ) : (
        <input className="field-input" type="date" value={value || ""} onChange={(e) => onChange(e.target.value)} />
      )}

      {value && (
        <p className="mt-1 text-sm text-roseDark">
          {mode === "hebrew" ? `לועזי: ${value}` : `📅 עברי: ${toHebrewDate(value)}`}
        </p>
      )}
    </div>
  );
}
