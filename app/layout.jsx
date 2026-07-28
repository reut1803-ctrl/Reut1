import "./globals.css";
import { APP_NAME, APP_SUBTITLE, APP_DESCRIPTION } from "../lib/appConfig";

export const metadata = {
  title: `${APP_NAME} - ${APP_SUBTITLE}`,
  description: APP_DESCRIPTION,
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
