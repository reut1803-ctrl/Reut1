import AppShell from "@/components/crm/layout/AppShell";

export const metadata = {
  title: "מאגר כרטיסיות - CRM שידוכים",
  description: "מערכת ניהול מאגר שידוכים לצוות שדכניות",
};

export default function CrmLayout({ children }) {
  return <AppShell>{children}</AppShell>;
}
