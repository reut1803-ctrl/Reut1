// מזהה לקוח Google OAuth - מוגדר כמשתנה סביבה בפרויקט Vercel (NEXT_PUBLIC_GOOGLE_CLIENT_ID).
// כל עוד לא הוגדר, המערכת חוזרת אוטומטית למצב הדגמה עם החלפת תפקיד ידנית.
export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
