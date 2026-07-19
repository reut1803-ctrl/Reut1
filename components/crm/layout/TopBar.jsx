"use client";

import { useState } from "react";
import { Bell, Settings, RefreshCw, LogOut } from "lucide-react";
import { useCrmStore } from "@/lib/crm/store";
import NotificationsPanel from "@/components/crm/notifications/NotificationsPanel";
import SettingsSheet from "@/components/crm/notifications/SettingsSheet";

export default function TopBar() {
  const currentStaffId = useCrmStore((s) => s.currentStaffId);
  const role = useCrmStore((s) => s.role);
  const currentUser = useCrmStore((s) => s.currentUser);
  const unreadCount = useCrmStore((s) => s.unreadCount());
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const user = currentUser();

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#EAE5E3] bg-white/90 px-4 py-3 backdrop-blur safe-top">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#8C4A55] text-sm font-bold text-white">
            מ
          </div>
          <div>
            <p className="text-[13px] leading-none text-[#8A8285]">שלום,</p>
            <p className="text-sm font-bold leading-tight text-[#3A3335]">{user.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            aria-label="ריענון"
            className="rounded-full p-2 text-[#8A8285] transition hover:bg-[#F6F5F4] active:scale-90"
            onClick={() => window.location.reload()}
          >
            <RefreshCw size={20} />
          </button>
          <button
            aria-label="התראות"
            className="relative rounded-full p-2 text-[#8A8285] transition hover:bg-[#F6F5F4] active:scale-90"
            onClick={() => setShowNotifications(true)}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 left-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            aria-label="הגדרות"
            className="rounded-full p-2 text-[#8A8285] transition hover:bg-[#F6F5F4] active:scale-90"
            onClick={() => setShowSettings(true)}
          >
            <Settings size={20} />
          </button>
          <button aria-label="התנתקות" className="rounded-full p-2 text-[#8A8285] transition hover:bg-[#F6F5F4] active:scale-90">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {showNotifications && <NotificationsPanel onClose={() => setShowNotifications(false)} />}
      {showSettings && <SettingsSheet onClose={() => setShowSettings(false)} />}
    </>
  );
}
