"use client";

import { toHebrewDate } from "../lib/dates";

// שדה תאריך: בחירת תאריך לועזי + הצגת התאריך העברי המקביל אוטומטית.
export default function DateField({ value, onChange, className = "" }) {
  const hebrew = toHebrewDate(value);
  return (
    <div>
      <input
        className={`field-input ${className}`}
        type="date"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
      />
      {hebrew && (
        <p className="mt-1 text-sm text-roseDark">📅 תאריך עברי: {hebrew}</p>
      )}
    </div>
  );
}
