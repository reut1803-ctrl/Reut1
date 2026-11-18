import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/lib/auth";
import { TripProvider } from "@/lib/tripContext";
import "./globals.css";
import "./home.css";
import "./app.css";

export const metadata: Metadata = {
  title: "קליפורניה שלנו",
  description: "האפליקציה של רעות וזכריה לטיול בקליפורניה",
  appleWebApp: { capable: true, title: "קליפורניה", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#86c8f0",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;700&family=Noto+Sans+Hebrew:wght@400;500;600;700;800&display=swap"
        />
      </head>
      <body>
        <AuthProvider>
          <TripProvider>{children}</TripProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
