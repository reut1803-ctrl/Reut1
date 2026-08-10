import "./globals.css";

export const metadata = {
  title: "מערכת שידוכים",
  description: "שאלון היכרות ומערכת ניהול מועמדים",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
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
