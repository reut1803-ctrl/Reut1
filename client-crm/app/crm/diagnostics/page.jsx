"use client";

import { useState } from "react";
import { Stethoscope, Check, X, Loader2, Info } from "lucide-react";
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
    return <p className="px-4 py-10 text-center text-sm text-[#5E7A87]">אזור זה זמין למנהלת בלבד</p>;
  }

  const run = async () => {
    setRunning(true);
    const found = [];
    let notConfigured = false;
    const push = (s) => {
      found.push(s);
      setSteps([...found]);
    };

    // 1. האם הדפדפן מצליח בכלל להגיע לשרת שלנו
    try {
      const res = await fetch("/api/upload/", { method: "POST", body: new FormData() });
      const data = await res.json().catch(() => null);
      if (res.status === 400 && data?.error) {
          push({ state: "ok", title: "הדפדפן מצליח להגיע לשרת שלנו", detail: "הנתיב בשרת קיים ומגיב" });
      } else {
        push({
          state: "error",
          title: "השרת מגיב בצורה לא צפויה",
          detail: `התקבל קוד ${res.status}. אם זה 404 - הגרסה עם השרת עוד לא עלתה.`,
        });
      }
    } catch (err) {
      push({
        state: "error",
        title: "הדפדפן לא מצליח להגיע לשרת שלנו",
        detail: `${err?.message || String(err)} — כאן נעצרת ההעלאה. זו חסימה בין המכשיר שלך לאתר.`,
      });
    }

    // 2. האם השרת שלנו מצליח להגיע ל-Cloudinary
    try {
      const res = await fetch("/api/upload/");
      const data = await res.json();
      if (data.configured === false) {
        notConfigured = true;
        push({
          state: "info",
          title: "אחסון הקבצים עדיין לא הוגדר",
          detail: data.detail || "",
        });
      } else {
        push({
          state: data.cloudinaryReachable ? "ok" : "error",
          title: data.cloudinaryReachable
            ? "השרת מצליח להעלות ל-Cloudinary"
            : "השרת לא מצליח להעלות ל-Cloudinary",
          detail: data.detail || "",
        });
      }
    } catch (err) {
      push({ state: "error", title: "בדיקת החיבור ל-Cloudinary נכשלה", detail: err?.message || String(err) });
    }

    // 3. העלאת קובץ אמיתי קטן מהדפדפן, מקצה לקצה.
    // חובה להשתמש בקובץ תקין באמת (תמונת PNG זעירה), אחרת Cloudinary דוחה אותו
    // בצדק כ"פורמט לא נתמך" ומתקבלת שגיאה מטעה שאינה מעידה על תקלה.
    if (notConfigured) {
      push({
        state: "info",
        title: "העלאת קובץ טרם נבדקה",
        detail: "הבדיקה הזו תרוץ אחרי שאחסון הקבצים יוגדר. שאר המערכת עובדת במלואה גם בלעדיו.",
      });
      setRunning(false);
      return;
    }

    try {
      const PNG_1PX =
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8AAAwAB/AF+ZQZ2AAAAAElFTkSuQmCC";
      const bytes = Uint8Array.from(atob(PNG_1PX), (c) => c.charCodeAt(0));
      const file = new File([bytes], "בדיקה", { type: "image/png" });
      const url = await uploadToCloudinary(file);
      push({ state: "ok", title: "העלאת קובץ אמיתי מהדפדפן הצליחה", detail: url });
    } catch (err) {
      push({
        state: "error",
        title: "העלאת קובץ אמיתי מהדפדפן נכשלה",
        detail: err?.message || String(err),
      });
    }

    setRunning(false);
  };

  return (
    <div className="px-4 py-6">
      <h1 className="flex items-center gap-2 text-xl font-bold text-[#23414E]">
        <Stethoscope size={22} /> בדיקת מערכת
      </h1>
      <p className="mt-1 text-[13px] text-[#5E7A87]">
        לחצי על הכפתור. הבדיקה תראה בדיוק באיזה שלב נתקעת העלאת קובץ, והתוצאה תישאר על המסך.
      </p>

      <Button variant="primary" className="mt-4 w-full" disabled={running} onClick={run}>
        {running ? <Loader2 size={16} className="animate-spin" /> : <Stethoscope size={16} />}
        {running ? "בודקת..." : "הרצת בדיקה"}
      </Button>

      <div className="mt-5 space-y-3">
        {steps.map((s, i) => {
          // שלושה מצבים, ולא שניים: "נותר להגדיר" אינו תקלה ואינו מוצג באדום
          const style =
            s.state === "ok"
              ? { box: "border-[#2FA39B] bg-[#2FA39B]/5", text: "text-[#21867F]", Icon: Check }
              : s.state === "info"
                ? { box: "border-[#9EDAE6] bg-[#EAF5FA]", text: "text-[#1F6E88]", Icon: Info }
                : { box: "border-[#C4584C] bg-red-50", text: "text-[#C4584C]", Icon: X };
          const { Icon } = style;
          return (
            <div key={i} className={`rounded-2xl border-2 p-3 ${style.box}`}>
              <p className={`flex items-center gap-1.5 text-[13px] font-bold ${style.text}`}>
                <Icon size={15} /> {i + 1}. {s.title}
              </p>
              {s.detail && <p className="mt-1 break-words text-[12px] text-[#23414E]">{s.detail}</p>}
            </div>
          );
        })}
      </div>

      {!running && steps.length > 0 && (
        <p className="mt-5 rounded-2xl bg-[#F2F8FB] p-3 text-[12px] text-[#5E7A87]">
          שורה בכחול פירושה שנותר שלב הגדרה, ולא תקלה. שורה אדומה היא תקלה אמיתית: אם הראשונה אדומה -
          החסימה היא בין המכשיר שלך לאתר. אם השנייה אדומה - הבעיה בצד השרת מול Cloudinary. אם השלישית
          אדומה בלבד - הבעיה ספציפית לקובץ. צלמי או העבירי לי את הטקסט שמופיע כאן.
        </p>
      )}
    </div>
  );
}
