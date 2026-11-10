# יש לך בית · יצהר

Next.js 14 · Tailwind · Framer Motion · Firebase (Google Login + Firestore) · Claude Vision.

## תפקידים
pending (ממתינה) · ambassador (שגרירה) · staff (צוות) · admin (הנהלה). התפקיד נשמר ב-`users/{uid}.role`.

## מודול חילוץ המשפחות (צוות + הנהלה)
- `/admin/extract` — העלאת צילומי דפי קשר. כל צילום נחתך לאריחים בדפדפן (`lib/imageTiles.js`) ונשלח ל-`/api/extract`,
  שקורא רק את הרשימה השמית בעזרת Claude Vision ומחזיר כותרת כיתה/שנתון. הגיל מחושב ב-`lib/hebrewYear.js`
  (הועתק מ"הקהילה איתך"). השמירה משייכת כל משפחה לפי הטריטוריות (`lib/territory.js`).
- `/staff/families` — הגדרת טריטוריה חד-פעמית, כרטיסי משפחה (סטטוס, WhatsApp, SMS) והפצת אירוע עם פלייר.
- `/admin/families`, `/admin/users` — מאגר מלא וניהול תפקידים.

## משתני סביבה (Vercel)
ראו `.env.example`. `ANTHROPIC_API_KEY` סודי ונשאר בשרת בלבד.

## כללי אבטחה
`firestore.rules` — להדביק ב-Firebase Console ← Firestore ← Rules.
