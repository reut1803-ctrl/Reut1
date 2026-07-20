"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Heart, Sparkles, LayoutGrid } from "lucide-react";
import { useAppStore } from "@/lib/store";

const TABS = [
  { href: "/favorites", label: "מועדפים", icon: Heart },
  { href: "/matches", label: "התאמות", icon: Sparkles },
  { href: "/profiles", label: "פרופילים", icon: LayoutGrid },
];

export default function BottomNav() {
  const pathname = usePathname();
  const favoritesCount = useAppStore((s) => s.favorites.length);

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-black/5 bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-md items-stretch justify-around px-2 py-1.5">
        {TABS.map((tab) => {
          const active = pathname?.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={clsx(
                "flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 text-[11px] font-semibold transition",
                active ? "text-bordeaux-500" : "text-muted"
              )}
            >
              <div className="relative">
                <Icon size={22} strokeWidth={active ? 2.4 : 2} />
                {tab.href === "/favorites" && favoritesCount > 0 && (
                  <span className="absolute -left-2 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-pink-500 text-[9px] font-bold text-white">
                    {favoritesCount}
                  </span>
                )}
              </div>
              {tab.label}
              {active && <span className="h-1 w-1 rounded-full bg-bordeaux-500" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
