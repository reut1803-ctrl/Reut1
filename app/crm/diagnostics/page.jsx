"use client";

import { useState } from "react";
import { Stethoscope, Check, X, Info, Loader2 } from "lucide-react";
import { useCrmStore } from "@/lib/crm/store";
import Button from "@/components/crm/ui/Button";
import { hasUploadServer } from "@/lib/crm/cloudinary";
import { saveMedia, resolveMediaUrl, deleteMedia } from "@/lib/crm/mediaStore";

// מסך בדיקת מערכת: מאתר בדיוק היכן נתקעת שמירת קובץ, ומסביר בעברית מה לעשות.
//
// חשוב: המערכת מתארחת ללא שרת, ולכן קבצים נשמרים בחלקים במסד הנתונים ולא
// דרך שרת חיצוני. הבדיקה בודקת את המסלול שבו המערכת באמת משתמשת, ולא מדווחת
// על "תקלה" רק משום ששרת ההעלאה החיצוני אינו קיים - זה המצב התקין כאן.
export default function DiagnosticsPage() {
  const role = useCrmStore((s) => s.role);
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState([]);

  if (role !== "admin") {
    return <p className="px-4 py-10 text-center text-sm text-[#7C6E60]">אזור זה זמין למנהלת בלבד</p>;
  }

  const run = async () => {
    setRunning(true);
    setSteps([]);
    const found = [];
    const push = (s) => {
      found.push(s);
      setSteps([...found]);
    };

    // 1. איך המערכת שומרת קבצים - עם שרת חיצוני או ישירות במסד הנתונים
    let serverMode = false;
    try {
      serverMode = await hasUploadServer();
    } catch {
      serverMode = false;
    }
    push({
      state: "info",
      title: serverMode ? "שמירת קבצים דרך שרת חיצוני" : "שמירת קבצים ישירות במסד הנתונים",
      detail: serverMode
        ? "האתר מתארח עם שרת, והקבצים עוברים דרכו."
        : "האתר מתארח ללא שרת, ולכן הקבצים נשמרים בחלקים קטנים במסד הנתונים. זו ההגדרה התקינה של המערכת הזו.",
    });

    // 2. חיבור למסד הנתונים
    let ref = null;
    try {
      const PNG_1PX =
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8AAAwAB/AF+ZQZ2AAAAAElFTkSuQmCC";
      const bytes = Uint8Array.from(atob(PNG_1PX), (c) => c.charCodeAt(0));
      const file = new File([bytes], "בדיקה.png", { type: "image/png" });
      ref = await saveMedia(file);
      push({ state: "ok", title: "שמירת קובץ הצליחה", detail: "המערכת הצליחה לשמור קובץ בדיקה." });
    } catch (err) {
      const msg = err?.message || String(err);
      const isPermission = /permission|insufficient|PERMISSION_DENIED/i.test(msg);
      push({
        state: "fail",
        title: "שמירת קובץ נכשלה",
        detail: isPermission
          ? "אין הרשאה לשמור קבצים במסד הנתונים. צריך לעדכן פעם אחת את כללי האבטחה ב-Firebase, ואז זה ייפתר. הודעת המערכת: " +
            msg
          : msg,
      });
      setRunning(false);
      return;
    }

    // 3. קריאה חזרה של הקובץ שנשמר
    try {
      const url = await resolveMediaUrl(ref);
      URL.revokeObjectURL(url);
      push({ state: "ok", title: "קריאת הקובץ הצליחה", detail: "הקובץ נשמר ונקרא בחזרה במלואו." });
    } catch (err) {
      push({ state: "fail", title: "קריאת הקובץ נכשלה", detail: err?.message || String(err) });
    }

    // 4. ניקוי קובץ הבדיקה
    try {
      await deleteMedia(ref);
      push({ state: "ok", title: "מחיקת קובץ הבדיקה הצליחה", detail: "לא נשארו שאריות במסד הנתונים." });
    } catch (err) {
      push({ state: "fail", title: "מחיקת קובץ הבדיקה נכשלה", detail: err?.message || String(err) });
    }

    setRunning(false);
  };

  const allGood = steps.length > 0 && !steps.some((s) => s.state === "fail");
  const permissionProblem = steps.some((s) => s.state === "fail" && /הרשאה/.test(s.detail || ""));

  const style = {
    ok: { box: "border-[#62826B] bg-[#62826B]/5", text: "text-[#4A6552]", Icon: Check },
    fail: { box: "border-[#C24545] bg-red-50", text: "text-[#C24545]", Icon: X },
    info: { box: "border-[#CCBDAB] bg-[#E8DCCB]", text: "text-[#5E2F2D]", Icon: Info },
  };

  return (
    <div className="px-4 py-6">
      <h1 className="flex items-center gap-2 text-xl font-bold text-[#3A2E26]">
        <Stethoscope size={22} /> בדיקת מערכת
      </h1>
      <p className="mt-1 text-[13px] text-[#7C6E60]">
        הבדיקה שומרת קובץ קטן, קוראת אותו בחזרה ומוחקת אותו - בדיוק כמו שהמערכת עושה עם תמונה או הקלטה.
      </p>

      <Button variant="primary" className="mt-4 w-full" disabled={running} onClick={run}>
        {running ? <Loader2 size={16} className="animate-spin" /> : <Stethoscope size={16} />}
        {running ? "בודקת..." : "הרצת בדיקה"}
      </Button>

      <div className="mt-5 space-y-3">
        {steps.map((s, i) => {
          const st = style[s.state] || style.info;
          const Icon = st.Icon;
          return (
            <div key={i} className={`rounded-2xl border-2 p-3 ${st.box}`}>
              <p className={`flex items-center gap-1.5 text-[13px] font-bold ${st.text}`}>
                <Icon size={15} /> {i + 1}. {s.title}
              </p>
              {s.detail && <p className="mt-1 break-words text-[12px] leading-relaxed text-[#3A2E26]">{s.detail}</p>}
            </div>
          );
        })}
      </div>

      {!running && steps.length > 0 && (
        <div className="mt-5 rounded-2xl bg-[#E8DCCB] p-3 text-[12px] leading-relaxed text-[#3A2E26]">
          {allGood ? (
            <p className="font-semibold text-[#4A6552]">
              הכל תקין. אפשר להעלות תמונות, קובצי PDF והקלטות בלי בעיה.
            </p>
          ) : permissionProblem ? (
            <>
              <p className="font-semibold text-[#C24545]">נדרשת פעולה חד-פעמית ב-Firebase</p>
              <p className="mt-1">
                מסד הנתונים חוסם כרגע שמירת קבצים. צריך לעדכן פעם אחת את כללי האבטחה של הפרויקט
                ולפרסם אותם. זו פעולה של דקה, ואחריה הבדיקה הזו תחזור ירוקה.
              </p>
            </>
          ) : (
            <p>צלמי את המסך הזה ושלחי אותו, כדי שאפשר יהיה לאתר את התקלה במדויק.</p>
          )}
        </div>
      )}
    </div>
  );
}
