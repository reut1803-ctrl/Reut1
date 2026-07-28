/** @type {import('next').NextConfig} */

// כשהבנייה היא ל-GitHub Pages (משתנה הסביבה GITHUB_PAGES=true),
// מפיקים אתר סטטי תחת הנתיב /adama.
const isPages = process.env.GITHUB_PAGES === "true";

const nextConfig = {
  reactStrictMode: true,
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  basePath: isPages ? "/adama" : "",
  assetPrefix: isPages ? "/adama/" : "",
  env: {
    NEXT_PUBLIC_BASE_PATH: isPages ? "/adama" : "",
  },
};

export default nextConfig;
