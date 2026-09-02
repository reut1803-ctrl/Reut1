import "./globals.css";
import { APP_NAME, APP_SUBTITLE, SHARE_TITLE, SITE_URL_PAGES, SITE_URL_VERCEL } from "../lib/appConfig";

// באתר הסטטי המערכת יושבת תחת /adama, ולכן נתיבים מוחלטים לאייקון ולמניפסט
// חייבים לכלול את הקידומת - אחרת האייקון לא נטען ב"הוספה למסך הבית".
const base = process.env.NEXT_PUBLIC_BASE_PATH || "";

// כתובת האתר המלאה. תצוגה מקדימה של קישור (וואטסאפ, פייסבוק) דורשת כתובת
// מוחלטת לתמונה - קישור יחסי פשוט לא ייטען שם. לכל בנייה הכתובת שלה.
const siteUrl = base ? SITE_URL_PAGES : SITE_URL_VERCEL;
const shareTitle = SHARE_TITLE;

// כתובות מלאות ומפורשות לתמונות השיתוף. חשוב שיהיו מוחלטות ולא יחסיות:
// כתובת יחסית נפתרה בעבר מול metadataBase שכבר מכיל את /adama, והנתיב
// יצא כפול (adama/adama) - ולכן התמונה לא נטענה בתצוגה המקדימה.
const shareWide = `${siteUrl}/brand/share.jpg`;
const shareSquare = `${siteUrl}/brand/share-square.jpg`;

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: shareTitle,
  // בלי תיאור: בתצוגה המקדימה של הקישור מופיעה הכותרת בלבד, לצד התמונה
  icons: {
    icon: `${base}/icons/icon-192.png`,
    apple: `${base}/icons/icon-192.png`,
  },
  // תצוגה מקדימה בשיתוף קישור
  openGraph: {
    type: "website",
    locale: "he_IL",
    siteName: APP_NAME,
    title: shareTitle,
    url: `${siteUrl}/`,
    images: [
      { url: shareWide, width: 1200, height: 630, alt: APP_SUBTITLE },
      { url: shareSquare, width: 600, height: 600, alt: APP_SUBTITLE },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: shareTitle,
    images: [shareWide],
  },
};

export const viewport = {
  themeColor: "#844442",
};

export default function RootLayout({ children }) {
  return (
    <html lang="he" dir="rtl">
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
