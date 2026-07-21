"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell, Settings, RefreshCw, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/supabase/AuthProvider";
import { fetchNotifications } from "@/lib/queries";
import GenderSwitch from "./GenderSwitch";
import NotificationsSheet from "./NotificationsSheet";
import SettingsSheet from "./SettingsSheet";

const ROLE_LABEL = { admin: "מנהלת המערכת", staff: "צוות", viewer: "צופה" };

export default function TopNavbar() {
  const router = useRouter();
  const { supabase, user, profile, signOut } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  const loadUnread = useCallback(async () => {
    if (!user) return;
    const data = await fetchNotifications(supabase, user.id);
    setUnread(data.filter((n) => !n.read).length);
  }, [supabase, user]);

  useEffect(() => {
    loadUnread();
  }, [loadUnread]);

  const logout = async () => {
    await signOut();
    router.push("/");
  };

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "";
  const roleLabel = ROLE_LABEL[profile?.role] ?? "";

  return (
    <>
      <header className="safe-top sticky top-0 z-30 bg-bg/90 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 pt-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-bordeaux-500 text-sm font-bold text-white">
                מש
              </div>
              <div>
                <p className="text-sm font-bold leading-tight text-ink">שלום, {displayName}</p>
                <p className="text-[11px] leading-tight text-muted">{roleLabel}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <IconButton onClick={() => router.refresh()} label="ריענון">
              <RefreshCw size={18} />
            </IconButton>
            <IconButton onClick={() => setNotifOpen(true)} label="התראות">
              <div className="relative">
                <Bell size={18} />
                {unread > 0 && (
                  <span className="absolute -left-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                    {unread}
                  </span>
                )}
              </div>
            </IconButton>
            <IconButton onClick={() => setSettingsOpen(true)} label="הגדרות">
              <Settings size={18} />
            </IconButton>
            <IconButton onClick={logout} label="התנתקות">
              <LogOut size={18} />
            </IconButton>
          </div>
        </div>

        <div className="mx-auto mt-3 max-w-md px-4">
          <GenderSwitch />
        </div>
      </header>

      <NotificationsSheet
        open={notifOpen}
        onClose={() => {
          setNotifOpen(false);
          loadUnread();
        }}
        onUnreadChange={setUnread}
      />
      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}

function IconButton({ children, onClick, label }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="rounded-full p-2 text-bordeaux-500 transition hover:bg-pink-50 active:scale-90"
    >
      {children}
    </button>
  );
}
