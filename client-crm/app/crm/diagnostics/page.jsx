"use client";

import { useState } from "react";
import { Stethoscope, Check, X, Loader2 } from "lucide-react";
import { useCrmStore } from "@/lib/crm/store";
import Button from "@/components/crm/ui/Button";
import { uploadToCloudinary } from "@/lib/crm/cloudinary";

// מסך בדיקת מערכת: מריץ שלוש בדיקות שמאתרות בדיוק היכן נתקעת העלאת קובץ,
// ומציג את התוצאה בעברית ברורה שנשארת על המסך (בלי צורך לתפוס הודעה חולפת).
export default function DiagnosticsPage() {
  const role = useCrmStore((s) => s.role);
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState([]);

  if (role !== "admin") {
    return <p className="px-4 py-10 text-center text-sm text-[#8C7B6B]">אזור זה זמין למנהלת בלבד</p>;
  }

  const run = async () => {
    setRunning(true);
    const found = [];
    const push = (s) => {
      found.push(s);
      setSteps([...found]);
    };

    // 1. האם הדפדפן מצליח בכלל להגיע לשרת שלנו
    try {
      const res = await fetch("/api/upload/", { method: "POST", body: new FormData() });
      const data = await res.json().catch(() => null);
      if (res.status === 400 && data?.error) {
        push({ ok: true, title: "הדפדפן מצליח להגיע לשרת שלנו", detail: "הנתיב בשרת קיים ומגיב" });
      } else {
        push({
          ok: false,
          title: "השרת מגיב בצורה לא צפויה",
          detail: `התקבל קוד ${res.status}. אם זה 404 - הגרסה עם השרת עוד לא עלתה.`,
        });
      }
    } catch (err) {
      push({
        ok: false,
        title: "הדפדפן לא מצליח להגיע לשרת שלנו",
        detail: `${err?.message || String(err)} — כאן נעצרת ההעלאה. זו חסימה בין המכשיר שלך לאתר.`,
      });
    }

    // 2. האם השרת שלנו מצליח להגיע ל-Cloudinary
    try {
      const res = await fetch("/api/upload/");
      const data = await res.json();
      push({
        ok: !!data.cloudinaryReachable,
        title: data.cloudinaryReachable ? "השרת מצליח להעלות ל-Cloudinary" : "השרת לא מצליח להעלות ל-Cloudinary",
        detail: data.detail || "",
      });
    } catch (err) {
      push({ ok: false, title: "בדיקת החיבור ל-Cloudinary נכשלה", detail: err?.message || String(err) });
    }

    // 3. העלאת קובץ אמיתי קטן מהדפדפן, מקצה לקצה.
    // חובה להשתמש בקובץ תקין באמת (תמונת PNG זעירה), אחרת Cloudinary דוחה אותו
    // בצדק כ"פורמט לא נתמך" ומתקבלת שגיאה מטעה שאינה מעידה על תקלה.
    try {
      const PNG_1PX =
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8AAAwAB/AF+ZQZ2AAAAAElFTkSuQmCC";
      const bytes = Uint8Array.from(atob(PNG_1PX), (c) => c.charCodeAt(0));
      const file = new File([bytes], "בדיקה", { type: "image/png" });
      const url = await uploadToCloudinary(file);
      push({ ok: true, title: "העלאת קובץ אמיתי מהדפדפן הצליחה", detail: url });
    } catch (err) {
      push({
        ok: false,
        title: "העלאת קובץ אמיתי מהדפדפן נכשלה",
        detail: err?.message || String(err),
      });
    }

    setRunning(false);
  };

  return (
    <div className="px-4 py-6">
      <h1 className="flex items-center gap-2 text-xl font-bold text-[#5A4A3C]">
        <Stethoscope size={22} /> בדיקת מערכת
      </h1>
      <p className="mt-1 text-[13px] text-[#8C7B6B]">
        לחצי על הכפתור. הבדיקה תראה בדיוק באיזה שלב נתקעת העלאת קובץ, והתוצאה תישאר על המסך.
      </p>

      <Button variant="primary" className="mt-4 w-full" disabled={running} onClick={run}>
        {running ? <Loader2 size={16} className="animate-spin" /> : <Stethoscope size={16} />}
        {running ? "בודקת..." : "הרצת בדיקה"}
      </Button>

      <div className="mt-5 space-y-3">
        {steps.map((s, i) => (
          <div
            key={i}
            className={`rounded-2xl border-2 p-3 ${s.ok ? "border-[#8C9A78] bg-[#8C9A78]/5" : "border-[#C4584C] bg-red-50"}`}
          >
            <p className={`flex items-center gap-1.5 text-[13px] font-bold ${s.ok ? "text-[#6F7D5C]" : "text-[#C4584C]"}`}>
              {s.ok ? <Check size={15} /> : <X size={15} />} {i + 1}. {s.title}
            </p>
            {s.detail && <p className="mt-1 break-words text-[12px] text-[#5A4A3C]">{s.detail}</p>}
          </div>
        ))}
      </div>

      {!running && steps.length > 0 && (
        <p className="mt-5 rounded-2xl bg-[#FBF3EA] p-3 text-[12px] text-[#8C7B6B]">
          אם השורה הראשונה אדומה - החסימה היא בין המכשיר שלך לאתר. אם השנייה אדומה - הבעיה בצד השרת מול
          Cloudinary. אם השלישית אדומה בלבד - הבעיה ספציפית לקובץ. צלמי או העבירי לי את הטקסט שמופיע כאן.
        </p>
      )}
    </div>
  );
}
