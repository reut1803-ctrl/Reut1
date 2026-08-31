"use client";

import { useState } from "react";
import { candidatePhoto } from "@/lib/crm/photos";
import { candidateInitials } from "@/lib/crm/initials";
import { gradientColors } from "@/components/crm/ui/gradients";

// תמונת מועמד/ת - רכיב אחד לכל המסכים.
//
// למה זה נבנה כך: קודם הרקע של הכרטיס הסתמך על מחלקת עיצוב מקובץ הסגנונות,
// והכיתוב היה לבן. שילוב כזה נכשל בשקט - אם מחלקת הרקע לא נטענה מסיבה כלשהי
// (גרסה ישנה שנשמרה בדפדפן, קובץ סגנונות שלא הגיע), נשאר רקע לבן עם אותיות
// לבנות, כלומר ריבוע ריק לגמרי. בדיוק מה שאנשי הצוות ראו.
//
// כאן הרקע נצבע בערכי צבע ישירים על האלמנט עצמו, והאותיות בגוון כהה.
// צבע שנכתב ישירות אינו יכול "להיעלם": הוא אינו תלוי בשום קובץ חיצוני.
//
// בנוסף, אם התמונה נכשלת בטעינה (רשת חסומה, כתובת שהוסרה) - הרכיב חוזר
// אוטומטית לרקע ולראשי התיבות, במקום להשאיר סימן תמונה שבורה.
export default function CandidatePhoto({ candidate, className = "", rounded = "" }) {
  const url = candidatePhoto(candidate);
  const [failed, setFailed] = useState(false);
  const [from, to] = gradientColors(candidate?.gradient ?? candidate?.name);
  const showPhoto = url && !failed;

  return (
    <div
      className={`relative overflow-hidden ${rounded} ${className}`}
      style={{ backgroundImage: `linear-gradient(to bottom right, ${from}, ${to})`, backgroundColor: from }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="select-none font-bold"
          style={{ color: "rgba(255,255,255,0.95)", textShadow: "0 2px 6px rgba(0,0,0,0.35)", fontSize: "clamp(28px, 22%, 72px)" }}
        >
          {candidateInitials(candidate?.name)}
        </span>
      </div>

      {showPhoto && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          // תמונה שנכשלה עוד לפני שהדף התעורר לא מפעילה onError, כי האירוע
          // כבר קרה. הבדיקה ב-ref תופסת גם את המקרה הזה: תמונה שהסתיימה
          // בלי רוחב ממשי היא תמונה שבורה.
          ref={(el) => {
            if (el && el.complete && el.naturalWidth === 0) setFailed(true);
          }}
          onError={() => setFailed(true)}
          referrerPolicy="no-referrer"
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
    </div>
  );
}
