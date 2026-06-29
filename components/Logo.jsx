// לוגו המערכת. שימוש בנתיב הבסיס הנכון גם באתר חי (GitHub Pages).
const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

export default function Logo({ className }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`${BASE}/logo.png`} alt="לוגו" className={className} />;
}

export const LOGO_SRC = `${BASE}/logo.png`;
