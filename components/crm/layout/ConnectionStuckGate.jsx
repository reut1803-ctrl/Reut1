"use client";

import { WifiOff, RefreshCw } from "lucide-react";

// מסך שמוצג כשההתחברות לגוגל אינה עונה בכלל.
//
// עד היום, במצב הזה, המערכת הציגה מסך ריק לחלוטין - בלי טקסט, בלי כפתור
// ובלי שום רמז. איש/אשת צוות ברשת סלולרית חלשה נשאר/ת מול מסך ריק לנצח.
//
// זו אינה חסימת הרשאה ואינה החלטה על מי נכנס: אם התשובה מגיעה אחר כך,
// המסך הזה נעלם מעצמו והכניסה ממשיכה כרגיל.
export default function ConnectionStuckGate() {
  return (
    <div
      className="flex h-dvh flex-col items-center justify-center overflow-y-auto bg-[#F6F5F4] px-6 py-8 safe-top safe-bottom"
      dir="rtl"
    >
      <div className="w-full max-w-xs text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#F6E4E6]">
          <WifiOff size={24} className="text-[#8C4A55]" />
        </div>
        <h1 className="text-[19px] font-bold text-[#3A3335]">החיבור לא הסתיים</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-[#8A8285]">
          המערכת ניסתה להתחבר ולא קיבלה תשובה. זו תקלת תקשורת - ההרשאה שלך תקינה.
          לרוב זה נפתר במעבר מרשת סלולרית ל-Wi-Fi (או להפך) ולחיצה על רענון.
        </p>

        <button
          onClick={() => window.location.reload()}
          className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-2xl bg-[#8C4A55] py-3 text-[14px] font-bold text-white transition active:scale-[0.98]"
        >
          <RefreshCw size={16} /> רענון
        </button>

        <p className="mt-4 rounded-2xl bg-[#EFEDEB] px-3 py-2 text-[10px] text-[#8A8285]">
          אם זה חוזר שוב ושוב - שלחו צילום של המסך הזה למנהלת.
        </p>
      </div>
    </div>
  );
}
