import { useSyncExternalStore } from "react";
import { currentPath, navigate, subscribe } from "./router";

export function usePathname(): string {
  return useSyncExternalStore(subscribe, currentPath, () => "/");
}
export function useRouter() {
  return { push: navigate, replace: navigate, back: () => history.back() };
}
