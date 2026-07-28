// שם המערכת כפי שהוא מוצג על המסך: "אדמה" בגדול, ומתחתיו כותרת המשנה.
//
// כשיהיה לוגו מצויר, מחליפים כאן בלבד: שמים את קובץ התמונה בתיקיית public
// ומציגים אותו במקום הכיתוב. אין צורך לגעת באף מסך אחר במערכת.
import { APP_NAME, APP_SUBTITLE } from "../lib/appConfig";

const SIZES = {
  sm: { name: "text-2xl", subtitle: "text-[11px]" },
  md: { name: "text-4xl", subtitle: "text-xs" },
  lg: { name: "text-6xl", subtitle: "text-sm" },
};

export default function Wordmark({ size = "md", className = "" }) {
  const s = SIZES[size] || SIZES.md;
  return (
    <div className={`text-center ${className}`}>
      <p className={`${s.name} font-bold leading-none tracking-tight text-roseDark`}>{APP_NAME}</p>
      <p className={`${s.subtitle} mt-2 font-medium tracking-wide text-ink/60`}>{APP_SUBTITLE}</p>
    </div>
  );
}
