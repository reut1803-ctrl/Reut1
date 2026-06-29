import "./globals.css";

export const metadata = {
  title: "מערכת שידוכים",
  description: "שאלון היכרות ומערכת ניהול מועמדים",
};

export default function RootLayout({ children }) {
  return (
    <html lang="he" dir="rtl">
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
