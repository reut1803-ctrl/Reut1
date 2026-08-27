import "./globals.css";

// כתובת האתר נחוצה כדי שתמונת השיתוף תישלח ככתובת מלאה. בלעדיה וואטסאפ
// אינו מצליח לטעון אותה ומציג רק טקסט.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://reut1-ocoq.vercel.app";
const SHARE_IMAGE = "/brand/hands.jpg";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: "מערכת שידוכים",
  description: "שאלון היכרות ומערכת ניהול מועמדים",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
  // התצוגה המקדימה של הקישור בוואטסאפ ובכל רשת אחרת
  openGraph: {
    type: "website",
    locale: "he_IL",
    url: SITE_URL,
    siteName: "מערכת שידוכים",
    title: "מערכת שידוכים",
    description: "שאלון היכרות ומערכת ניהול מועמדים",
    images: [{ url: SHARE_IMAGE, width: 720, height: 899, alt: "מערכת שידוכים" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "מערכת שידוכים",
    description: "שאלון היכרות ומערכת ניהול מועמדים",
    images: [SHARE_IMAGE],
  },
};

export const viewport = {
  themeColor: "#8C4A55",
};

export default function RootLayout({ children }) {
  return (
    <html lang="he" dir="rtl">
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
