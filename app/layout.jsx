import "./globals.css";

// כתובת האתר נחוצה כדי שתמונת השיתוף תישלח ככתובת מלאה. בלעדיה וואטסאפ
// אינו מצליח לטעון אותה ומציג רק טקסט.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://reut1-ocoq.vercel.app";
const SHARE_IMAGE = "/brand/hands.jpg";

// הכיתוב שמופיע בתצוגה המקדימה של הקישור בוואטסאפ
const SHARE_TITLE = "חיבורים משמחים";
const SHARE_DESCRIPTION = "מאגר שידוכים רעות פריד והצוות";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: "מערכת שידוכים",
  description: "שאלון היכרות ומערכת ניהול מועמדים",
  manifest: "/manifest.json",
  // ?v=2 מכריח את הדפדפן למשוך את האייקון החדש. בלי זה הטלפון ממשיך
  // להציג את האייקון הישן ששמור אצלו מההתקנה הקודמת.
  icons: {
    icon: [
      { url: "/icons/icon-192.png?v=2", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png?v=2", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/icons/icon-192.png?v=2",
    apple: [{ url: "/icons/icon-192.png?v=2", sizes: "192x192", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: SHARE_TITLE,
    statusBarStyle: "default",
  },
  // התצוגה המקדימה של הקישור בוואטסאפ ובכל רשת אחרת
  openGraph: {
    type: "website",
    locale: "he_IL",
    url: SITE_URL,
    siteName: SHARE_TITLE,
    title: SHARE_TITLE,
    description: SHARE_DESCRIPTION,
    images: [{ url: SHARE_IMAGE, width: 720, height: 899, alt: SHARE_TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: SHARE_TITLE,
    description: SHARE_DESCRIPTION,
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
