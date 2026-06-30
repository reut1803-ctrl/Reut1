// לוגו המערכת. קובץ PNG עם רקע שקוף - מוטמע באתר ללא מסגרת וללא רקע,
// כך שנשאר רק הציור עצמו, חלק טבעי מהעמוד.
const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

export default function Logo({ className = "" }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`${BASE}/logo-v2.png`}
      alt="לוגו"
      className={`object-contain ${className}`}
    />
  );
}

export const LOGO_SRC = `${BASE}/logo-v2.png`;
