// הלוגו של המערכת. כרגע מוצג ככיתוב השם ("אדמה" וכותרת המשנה) ולא כתמונה,
// כדי שלא ייכנס לכאן מיתוג של מערכת אחרת. כשיתקבל קובץ לוגו מצויר,
// מחליפים כאן את התצוגה בתמונה - ושאר המסכים ממשיכים לעבוד כרגיל.
import Wordmark from "./Wordmark";

export default function Logo({ className = "" }) {
  return <Wordmark size="lg" className={className} />;
}
