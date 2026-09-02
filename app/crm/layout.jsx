import AppShell from "@/components/crm/layout/AppShell";
import { SHARE_TITLE } from "@/lib/appConfig";

// זו הכתובת שמשתפים בפועל, והכותרת שלה גוברת על זו של שכבת השורש.
// לכן היא חייבת להיות זהה לה - אחרת התצוגה המקדימה תראה משהו אחר.
export const metadata = {
  title: SHARE_TITLE,
};

export default function CrmLayout({ children }) {
  return <AppShell>{children}</AppShell>;
}
