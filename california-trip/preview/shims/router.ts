// נתב פשוט לתצוגה המקדימה בצ'אט: הכתובת נשמרת אחרי # (למשל #map), כי שם אין שרת.
type L = () => void;
const listeners = new Set<L>();
export function currentPath(): string {
  const h = window.location.hash.replace(/^#/, "");
  return h && h !== "home" ? `/${h}` : "/";
}
export function navigate(href: string) {
  const name = href.replace(/^\//, "") || "home";
  if (window.location.hash !== `#${name}`) window.location.hash = name;
  window.scrollTo(0, 0);
}
export function subscribe(l: L) {
  listeners.add(l);
  const on = () => listeners.forEach((f) => f());
  window.addEventListener("hashchange", on);
  return () => { listeners.delete(l); window.removeEventListener("hashchange", on); };
}
