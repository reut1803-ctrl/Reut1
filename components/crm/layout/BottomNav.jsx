"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Sparkles, Users } from "lucide-react";
import { useCrmStore } from "@/lib/crm/store";

const TABS = [
  { href: "/crm/favorites", label: "מועדפים", icon: Heart, key: "favorites" },
  { href: "/crm/matches", label: "התאמות", icon: Sparkles, key: "matches" },
  { href: "/crm", label: "פרופילים", icon: Users, key: "profiles" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const favCount = useCrmStore((s) => s.favoritesCount());

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[#EAE5E3] bg-white/95 backdrop-blur safe-bottom">
      <div className="mx-auto flex max-w-md items-stretch justify-around">
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.key}
              href={tab.href}
              className="relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold transition"
            >
              <span className="relative">
                <Icon size={22} className={active ? "text-[#8C4A55]" : "text-[#B5AEB0]"} strokeWidth={active ? 2.5 : 2} />
                {tab.key === "favorites" && favCount > 0 && (
                  <span className="absolute -top-1.5 -left-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#20A66B] px-1 text-[10px] font-bold text-white">
                    {favCount}
                  </span>
                )}
              </span>
              <span className={active ? "text-[#8C4A55]" : "text-[#B5AEB0]"}>{tab.label}</span>
              {active && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-[#8C4A55]" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
