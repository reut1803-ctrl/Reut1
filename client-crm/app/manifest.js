import { APP_NAME, APP_SHORT_NAME, APP_SUBTITLE } from "../lib/appConfig";

export default function manifest() {
  return {
    name: `${APP_NAME} – ${APP_SUBTITLE}`,
    short_name: APP_SHORT_NAME,
    description: APP_SUBTITLE,
    start_url: "/crm/",
    display: "standalone",
    background_color: "#FBF3EA",
    theme_color: "#DE8C7C",
    dir: "rtl",
    lang: "he",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
