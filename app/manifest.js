import { APP_NAME, APP_SUBTITLE, APP_DESCRIPTION } from "../lib/appConfig";

// המניפסט נוצר בזמן הבנייה כדי שכל הנתיבים יכללו את הקידומת של האתר (/adama),
// אחרת "הוספה למסך הבית" בנייד נטענת בלי אייקון ופותחת כתובת שגויה.
const base = process.env.NEXT_PUBLIC_BASE_PATH || "";

export default function manifest() {
  return {
    name: `${APP_NAME} - ${APP_SUBTITLE}`,
    short_name: APP_NAME,
    description: APP_DESCRIPTION,
    start_url: `${base}/crm/`,
    scope: `${base}/`,
    display: "standalone",
    background_color: "#E8DCCB",
    theme_color: "#844442",
    dir: "rtl",
    lang: "he",
    icons: [
      { src: `${base}/icons/icon-192.png`, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: `${base}/icons/icon-512.png`, sizes: "512x512", type: "image/png", purpose: "any" },
      { src: `${base}/icons/icon-192.png`, sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: `${base}/icons/icon-512.png`, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
