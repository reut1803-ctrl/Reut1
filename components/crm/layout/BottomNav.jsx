"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Sparkles, Users, HeartHandshake, ListChecks, BarChart3, Lightbulb, BookUser } from "lucide-react";
import { useCrmStore } from "@/lib/crm/store";
import MatchmakersDirectory from "@/components/crm/directory/MatchmakersDirectory";

const TABS = [
  { href: "/crm/favorites", label: "מועדפים", icon: Heart, key: "favorites" },
  { href: "/crm/matches", label: "התאמות", icon: Sparkles, key: "matches" },
  { href: "/crm", label: "פרופילים", icon: Users, key: "profiles" },
];

const STAFF_TABS = [
  { href: "/crm/proposals", label: "שידוכים", icon: HeartHandshake, key: "proposals" },
  { href: "/crm/brainstorm", label: "סיעור", icon: Lightbulb, key: "brainstorm" },
  { href: "/crm/tasks", label: "משימות", icon: ListChecks, key: "tasks" },
  // האלפון אינו עמוד: הוא נפתח כמגירה מעל המסך הנוכחי. כך לא מתבצע שום ניווט,
  // אין רענון, ומיקום הגלילה במסך שמאחור נשמר בדיוק כפי שהיה.
  { action: "directory", label: "אלפון", icon: BookUser, key: "directory" },
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
  const [directoryOpen, setDirectoryOpen] = useState(false);
  let tabs = TABS;
  if (role === "staff") tabs = [...TABS, ...STAFF_TABS];
  if (role === "admin") tabs = [...TABS, ...STAFF_TABS, ...ADMIN_TABS];

  const badgeCount = {
    favorites: favCount,
    tasks: role === "staff" ? pendingTasksCount : 0,
    brainstorm: mentionCount,
  };

  // עם שמונה לשוניות הסרגל צפוף, ולכן הכיתוב והריווח מתכווצים מעט
  // כדי שהשורה תישאר נקייה ואוורירית גם במסך צר.
  const dense = tabs.length >= 8;
  // במסך צר במיוחד (320 פיקסלים) הכיתוב "לוח בקרה" גולש אל התא השכן, ולכן
  // הוא מתכווץ עוד קצת. מ-360 פיקסלים ומעלה - הגודל הרגיל.
  const labelClass = dense ? "text-[8px] min-[360px]:text-[9px]" : "text-[10px]";
  const iconSize = dense ? 18 : 20;

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[#EAE5E3] bg-white/95 backdrop-blur safe-bottom">
        <div className="mx-auto flex max-w-md items-stretch justify-around">
          {tabs.map((tab) => {
            const active = !!tab.href && pathname === tab.href;
            const Icon = tab.icon;
            const count = badgeCount[tab.key] || 0;
            const highlighted = active || (tab.action === "directory" && directoryOpen);
            const inner = (
              <>
                <span className="relative">
                  <Icon
                    size={iconSize}
                    className={highlighted ? "text-[#8C4A55]" : "text-[#B5AEB0]"}
                    strokeWidth={highlighted ? 2.5 : 2}
                  />
                  {count > 0 && (
                    <span className="absolute -top-1.5 -left-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#20A66B] px-1 text-[10px] font-bold text-white">
                      {count}
                    </span>
                  )}
                </span>
                <span className={`whitespace-nowrap ${labelClass} ${highlighted ? "text-[#8C4A55]" : "text-[#B5AEB0]"}`}>
                  {tab.label}
                </span>
                {active && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-[#8C4A55]" />}
              </>
            );
            const shared = `relative flex min-w-0 flex-1 flex-col items-center gap-0.5 ${
              dense ? "px-0.5 py-2" : "py-2.5"
            } font-semibold transition`;

            if (tab.action === "directory") {
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setDirectoryOpen(true)}
                  data-tour={`tour-nav-${tab.key}`}
                  className={shared}
                >
                  {inner}
                </button>
              );
            }

            return (
              <Link key={tab.key} href={tab.href} data-tour={`tour-nav-${tab.key}`} className={shared}>
                {inner}
              </Link>
            );
          })}
        </div>
      </nav>
      {directoryOpen && <MatchmakersDirectory onClose={() => setDirectoryOpen(false)} />}
    </>
  );
}
