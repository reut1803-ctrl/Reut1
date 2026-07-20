"use client";

import { Bell, CheckCheck } from "lucide-react";
import Sheet from "@/components/ui/Sheet";
import { useAppStore } from "@/lib/store";

export default function NotificationsSheet({ open, onClose }) {
  const notifications = useAppStore((s) => s.notifications);
  const markAllRead = useAppStore((s) => s.markAllNotificationsRead);

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
                <p className="mt-0.5 text-xs text-muted">{n.time}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}
