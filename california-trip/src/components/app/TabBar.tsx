"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon, { type IconName } from "./Icon";

export const SECTIONS: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "בית", icon: "home" },
  { href: "/map", label: "מפה", icon: "map" },
  { href: "/plan", label: "מסלול", icon: "route" },
  { href: "/packing", label: "ציוד", icon: "bag" },
  { href: "/journal", label: "יומן", icon: "heart" },
  { href: "/budget", label: "תקציב", icon: "cup" },
];

export default function TabBar() {
  const path = usePathname() || "/";
  return (
    <nav className="tabbar" aria-label="ניווט">
      {SECTIONS.map((s) => {
        const active = s.href === "/" ? path === "/" : path.startsWith(s.href);
        return (
          <Link key={s.href} href={s.href} className={`tab ${active ? "tab--active" : ""}`} aria-current={active ? "page" : undefined}>
            <Icon name={s.icon} />
            <span>{s.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
