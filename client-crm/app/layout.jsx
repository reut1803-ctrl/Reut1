import "./globals.css";
import { Heebo } from "next/font/google";
import { APP_NAME, APP_SUBTITLE, APP_DESCRIPTION, SITE_URL, OG_IMAGE_SRC } from "@/lib/appConfig";

// הגופן נארז לתוך האתר בזמן הבנייה, ולא נמשך מגוגל בכל טעינה.
const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-heebo",
});

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: APP_NAME,
  description: APP_SUBTITLE,
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
  // תצוגה מקדימה של הקישור בוואטסאפ וברשתות
  openGraph: {
    type: "website",
    locale: "he_IL",
    siteName: APP_NAME,
    title: APP_NAME,
    description: APP_SUBTITLE,
    url: SITE_URL,
    images: [{ url: OG_IMAGE_SRC, width: 1200, height: 630, alt: APP_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: APP_NAME,
    description: APP_SUBTITLE,
    images: [OG_IMAGE_SRC],
  },
  other: { "og:image:alt": APP_DESCRIPTION },
};

export const viewport = {
  themeColor: "#DE8C7C",
};

export default function RootLayout({ children }) {
  return (
    <html lang="he" dir="rtl" className={heebo.variable}>
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
