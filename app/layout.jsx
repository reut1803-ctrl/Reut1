import "./globals.css";
import { AuthProvider } from "@/lib/supabase/AuthProvider";

export const metadata = {
  title: "מאגר שידוכים",
  description: "מערכת CRM לניהול מאגר שידוכים",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "מאגר שידוכים",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

// האפליקציה מותאמת אישית לכל משתמשת ותלויה בהתחברות בזמן אמת,
// לכן אין טעם לנסות "לקפוא" אותה כדפי HTML סטטיים מראש.
export const dynamic = "force-dynamic";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#F6F5F3",
};

export default function RootLayout({ children }) {
  return (
    <html lang="he" dir="rtl">
      <body className="min-h-screen bg-bg font-sans text-ink antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
