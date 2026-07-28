import AppShell from "@/components/crm/layout/AppShell";
import { APP_NAME, APP_SUBTITLE, APP_DESCRIPTION } from "@/lib/appConfig";

export const metadata = {
  title: `${APP_NAME} - ${APP_SUBTITLE}`,
  description: APP_DESCRIPTION,
};

export default function CrmLayout({ children }) {
  return <AppShell>{children}</AppShell>;
}
