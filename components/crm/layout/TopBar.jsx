"use client";

import { useState } from "react";
import { Bell, Settings, RefreshCw, LogOut } from "lucide-react";
import { useCrmStore } from "@/lib/crm/store";
import NotificationsPanel from "@/components/crm/notifications/NotificationsPanel";
import SettingsSheet from "@/components/crm/notifications/SettingsSheet";
import { APP_NAME } from "@/lib/appConfig";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

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
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#CCBDAB] bg-white/90 px-4 py-3 backdrop-blur safe-top">
        <div className="flex items-center gap-2">
          {/* תמונת המותג בעיגול. אם התמונה אינה נטענת מסיבה כלשהי, נשארת
              האות הראשונה של שם המערכת מתחתיה - העיגול לעולם אינו ריק. */}
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#844442] text-sm font-bold text-white">
            <span className="absolute inset-0 flex items-center justify-center">{APP_NAME.charAt(0)}</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${BASE_PATH}/brand/avatar.jpg`}
              alt={APP_NAME}
              width={36}
              height={36}
              className="relative h-full w-full object-cover"
              loading="eager"
              decoding="async"
            />
          </div>
          <div>
            <p className="text-[13px] leading-none text-[#7C6E60]">שלום,</p>
            <p className="text-sm font-bold leading-tight text-[#3A2E26]">{user.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            aria-label="ריענון"
            className="rounded-full p-2 text-[#7C6E60] transition hover:bg-[#E8DCCB] active:scale-90"
            onClick={() => window.location.reload()}
          >
            <RefreshCw size={20} />
          </button>
          <button
            aria-label="התראות"
            className="relative rounded-full p-2 text-[#7C6E60] transition hover:bg-[#E8DCCB] active:scale-90"
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
            className="rounded-full p-2 text-[#7C6E60] transition hover:bg-[#E8DCCB] active:scale-90"
            onClick={() => setShowSettings(true)}
          >
            <Settings size={20} />
          </button>
          {googleUser && (
            <button
              onClick={signOutGoogle}
              aria-label="התנתקות"
              className="rounded-full p-2 text-[#7C6E60] transition hover:bg-[#E8DCCB] active:scale-90"
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
