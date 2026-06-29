/** @type {import('next').NextConfig} */

// כשהבנייה היא ל-GitHub Pages (משתנה הסביבה GITHUB_PAGES=true),
// מפיקים אתר סטטי תחת הנתיב /Reut1.
const isPages = process.env.GITHUB_PAGES === "true";

const nextConfig = {
  reactStrictMode: true,
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  basePath: isPages ? "/Reut1" : "",
  assetPrefix: isPages ? "/Reut1/" : "",
  env: {
    NEXT_PUBLIC_BASE_PATH: isPages ? "/Reut1" : "",
  },
};

export default nextConfig;
