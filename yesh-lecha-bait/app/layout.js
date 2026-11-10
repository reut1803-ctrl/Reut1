import { Heebo, Frank_Ruhl_Libre } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const heebo = Heebo({ subsets: ["hebrew", "latin"], variable: "--font-heebo" });
const frank = Frank_Ruhl_Libre({
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "700"],
  variable: "--font-frank",
});

export const metadata = {
  title: "יש לך בית · יצהר",
  description: "מערכת המיזם יש לך בית יצהר",
};

export default function RootLayout({ children }) {
  return (
    <html lang="he" dir="rtl">
      <body className={`${heebo.variable} ${frank.variable} font-sans min-h-screen`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
