/** @type {import('next').NextConfig} */
// המערכת מתפרסמת ב-Vercel כאתר מלא (לא ייצוא סטטי), כך שנתיבי השרת
// שבתוך app/api יכולים לרוץ. אין basePath: האתר יושב בשורש הדומיין.
const nextConfig = {
  reactStrictMode: true,
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
