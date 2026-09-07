"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Users, HeartHandshake, ListChecks, BarChart3, Lightbulb } from "lucide-react";
import { useCrmStore } from "@/lib/crm/store";

const TABS = [
  { href: "/crm/favorites", label: "מועדפים", icon: Heart, key: "favorites" },
  { href: "/crm", label: "פרופילים", icon: Users, key: "profiles" },
];

const STAFF_TABS = [
  { href: "/crm/proposals", label: "שידוכים", icon: HeartHandshake, key: "proposals" },
  { href: "/crm/brainstorm", label: "סיעור", icon: Lightbulb, key: "brainstorm" },
  { href: "/crm/tasks", label: "משימות", icon: ListChecks, key: "tasks" },
];

const ADMIN_TABS = [{ href: "/crm/dashboard", label: "לוח בקרה", icon: BarChart3, key: "dashboard" }];

export default function BottomNav() {
  const pathname = usePathname();
  const favCount = useCrmStore((s) => s.favoritesCount());
  const role = useCrmStore((s) => s.role);
  const currentStaffEmail = useCrmStore((s) => s.currentStaffEmail);
  const pendingTasksCount = useCrmStore((s) => s.pendingPushedTasksCount(currentStaffEmail));
  // כמה כרטיסיות תייגו אותי בזירה ועדיין לא נכנסתי לראות
  const mentionCount = useCrmStore((s) => s.myUnseenMentions().length);
  let tabs = TABS;
  if (role === "staff") tabs = [...TABS, ...STAFF_TABS];
  if (role === "admin") tabs = [...TABS, ...STAFF_TABS, ...ADMIN_TABS];

  const badgeCount = {
    favorites: favCount,
    tasks: role === "staff" ? pendingTasksCount : 0,
    brainstorm: mentionCount,
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[#CFE3EC] bg-white/95 backdrop-blur safe-bottom">
      <div className="mx-auto flex max-w-md items-stretch justify-around">
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          const Icon = tab.icon;
          const count = badgeCount[tab.key] || 0;
          return (
            <Link
              key={tab.key}
              href={tab.href}
              data-tour={`tour-nav-${tab.key}`}
              className="relative flex min-w-0 flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold transition"
            >
              <span className="relative">
                <Icon size={20} className={active ? "text-[#2E8BA8]" : "text-[#9FBAC7]"} strokeWidth={active ? 2.5 : 2} />
                {count > 0 && (
                  <span className="absolute -top-1.5 -left-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#2FA39B] px-1 text-[10px] font-bold text-white">
                    {count}
                  </span>
                )}
              </span>
              <span className={`whitespace-nowrap ${active ? "text-[#2E8BA8]" : "text-[#9FBAC7]"}`}>{tab.label}</span>
              {active && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-[#2E8BA8]" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
