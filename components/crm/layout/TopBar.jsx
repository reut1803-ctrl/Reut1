"use client";

import { useState } from "react";
import { Bell, Settings, RefreshCw, LogOut } from "lucide-react";
import { useCrmStore } from "@/lib/crm/store";
import NotificationsPanel from "@/components/crm/notifications/NotificationsPanel";
import SettingsSheet from "@/components/crm/notifications/SettingsSheet";
import { APP_NAME } from "@/lib/appConfig";

export default function TopBar() {
  const googleUser = useCrmStore((s) => s.googleUser);
  const signOutGoogle = useCrmStore((s) => s.signOutGoogle);
  const currentUser = useCrmStore((s) => s.currentUser);
  const unreadCount = useCrmStore((s) => s.unreadCount());
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const user = currentUser();

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#E7DECD] bg-white/90 px-4 py-3 backdrop-blur safe-top">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#6F4A2E] text-sm font-bold text-white">
            {APP_NAME.charAt(0)}
          </div>
          <div>
            <p className="text-[13px] leading-none text-[#8B8175]">שלום,</p>
            <p className="text-sm font-bold leading-tight text-[#3B332A]">{user.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            aria-label="ריענון"
            className="rounded-full p-2 text-[#8B8175] transition hover:bg-[#FAF6EE] active:scale-90"
            onClick={() => window.location.reload()}
          >
            <RefreshCw size={20} />
          </button>
          <button
            aria-label="התראות"
            className="relative rounded-full p-2 text-[#8B8175] transition hover:bg-[#FAF6EE] active:scale-90"
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
            className="rounded-full p-2 text-[#8B8175] transition hover:bg-[#FAF6EE] active:scale-90"
            onClick={() => setShowSettings(true)}
          >
            <Settings size={20} />
          </button>
          {googleUser && (
            <button
              onClick={signOutGoogle}
              aria-label="התנתקות"
              className="rounded-full p-2 text-[#8B8175] transition hover:bg-[#FAF6EE] active:scale-90"
            >
              <LogOut size={20} />
            </button>
          )}
        </div>
      </header>

      {showNotifications && <NotificationsPanel onClose={() => setShowNotifications(false)} />}
      {showSettings && <SettingsSheet onClose={() => setShowSettings(false)} />}
    </>
  );
}
