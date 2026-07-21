"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell, CheckCheck } from "lucide-react";
import Sheet from "@/components/ui/Sheet";
import { useAuth } from "@/lib/supabase/AuthProvider";
import { fetchNotifications, markAllNotificationsRead } from "@/lib/queries";

export default function NotificationsSheet({ open, onClose, onUnreadChange }) {
  const { supabase, user } = useAuth();
  const [notifications, setNotifications] = useState([]);

  const load = useCallback(async () => {
    if (!user) return;
    const data = await fetchNotifications(supabase, user.id);
    setNotifications(data);
    onUnreadChange?.(data.filter((n) => !n.read).length);
  }, [supabase, user, onUnreadChange]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const markAllRead = async () => {
    await markAllNotificationsRead(supabase, user.id);
    load();
  };

  return (
    <Sheet open={open} onClose={onClose} title="מרכז ההתראות">
      <div className="mb-4 flex justify-end">
        <button
          onClick={markAllRead}
          className="flex items-center gap-1.5 text-xs font-semibold text-bordeaux-500"
        >
          <CheckCheck size={15} />
          סמן הכל כנקרא
        </button>
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-muted">
          <Bell size={28} />
          <p className="text-sm">אין התראות חדשות</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`flex items-start gap-3 rounded-2xl border px-4 py-3 ${
                n.read ? "border-black/5 bg-white" : "border-pink-200 bg-pink-50"
              }`}
            >
              <span
                className={`mt-1 h-2 w-2 shrink-0 rounded-full ${n.read ? "bg-transparent" : "bg-pink-500"}`}
              />
              <div>
                <p className="text-sm font-medium text-ink">{n.text}</p>
                <p className="mt-0.5 text-xs text-muted">{new Date(n.created_at).toLocaleString("he-IL")}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}
