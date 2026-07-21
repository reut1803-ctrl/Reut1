import "./globals.css";
import { AuthProvider } from "@/lib/supabase/AuthProvider";

export const metadata = {
  title: "מאגר שידוכים",
  description: "מערכת CRM לניהול מאגר שידוכים",
};

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
