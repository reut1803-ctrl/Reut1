import type { MetadataRoute } from "next";

// מאפשר "הוספה למסך הבית": האתר נפתח בלחיצה אחת, במסך מלא, כמו אפליקציה.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "קליפורניה שלנו",
    short_name: "קליפורניה",
    description: "האפליקציה של רעות וזכריה לטיול בקליפורניה",
    start_url: "/",
    display: "standalone",
    dir: "rtl",
    lang: "he",
    background_color: "#86c8f0",
    theme_color: "#86c8f0",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
