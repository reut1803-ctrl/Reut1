/** @type {import('next').NextConfig} */

// כשהבנייה היא ל-GitHub Pages (משתנה הסביבה GITHUB_PAGES=true),
// מפיקים אתר סטטי תחת הנתיב /adama.
const isPages = process.env.GITHUB_PAGES === "true";

const nextConfig = {
  reactStrictMode: true,
  // ייצוא סטטי רק לבנייה ל-GitHub Pages. ב-Vercel נשארת בנייה מלאה עם שרת,
  // כדי שנתיב ההעלאה בשרת (app/api/upload) יוכל לרוץ ולעקוף חסימות רשת בצד הלקוח.
  ...(isPages ? { output: "export" } : {}),
  images: { unoptimized: true },
  trailingSlash: true,
  basePath: isPages ? "/adama" : "",
  assetPrefix: isPages ? "/adama/" : "",
  env: {
    NEXT_PUBLIC_BASE_PATH: isPages ? "/adama" : "",
  },
};

export default nextConfig;
