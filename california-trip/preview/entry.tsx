import { createRoot } from "react-dom/client";
import { AuthProvider } from "../src/lib/auth";
import { TripProvider } from "../src/lib/tripContext";
import Home from "../src/app/page";
import MapPage from "../src/app/map/page";
import PlanPage from "../src/app/plan/page";
import PackingPage from "../src/app/packing/page";
import JournalPage from "../src/app/journal/page";
import BudgetPage from "../src/app/budget/page";
import CapsulePage from "../src/app/capsule/page";
import { usePathname } from "./shims/navigation";

const PAGES: Record<string, () => JSX.Element> = {
  "/": Home, "/map": MapPage, "/plan": PlanPage, "/packing": PackingPage,
  "/journal": JournalPage, "/budget": BudgetPage, "/capsule": CapsulePage,
};

function Router() {
  const path = usePathname();
  const P = PAGES[path] ?? Home;
  return <P key={path} />;
}

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <TripProvider>
      <Router />
    </TripProvider>
  </AuthProvider>,
);
