import "./globals.css";

// כתובת האתר החי (GitHub Pages). משמשת לקישורים מוחלטים בתצוגה המקדימה (Open Graph).
const SITE_URL = "https://reut1803-ctrl.github.io/Reut1";
const OG_IMAGE = `${SITE_URL}/og-logo.jpg`;
const SITE_DESC = "צוות שגרירים משדכים לתלמידי הרב יצחק גינזבורג";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: "הקהילה איתך",
  description: SITE_DESC,
  openGraph: {
    title: "הקהילה איתך",
    description: SITE_DESC,
    url: SITE_URL,
    siteName: "הקהילה איתך",
    locale: "he_IL",
    type: "website",
    images: [{ url: OG_IMAGE, width: 1080, height: 794, alt: "הקהילה איתך" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "הקהילה איתך",
    description: SITE_DESC,
    images: [OG_IMAGE],
  },
};

// מאלץ את הדפדפן להישאר במצב בהיר (מונע Force Dark / Auto Dark של מערכת ההפעלה).
export const viewport = {
  colorScheme: "light",
  themeColor: "#FBF7F2",
};

export default function RootLayout({ children }) {
  return (
    <html lang="he" dir="rtl" className="light" style={{ colorScheme: "light" }}>
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
