"use client";

import { X, Bell } from "lucide-react";
import { useCrmStore } from "@/lib/crm/store";

export default function NotificationsPanel({ onClose }) {
  const notifications = useCrmStore((s) => s.notifications);
  const markAllRead = useCrmStore((s) => s.markAllNotificationsRead);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-sm flex-col bg-white shadow-2xl safe-top">
        <div className="flex items-center justify-between border-b border-[#E7DECD] px-4 py-4">
          <h2 className="text-lg font-bold text-[#3B332A]">התראות</h2>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-[#FAF6EE]" aria-label="סגירה">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {notifications.length === 0 ? (
            <p className="mt-10 text-center text-sm text-[#8B8175]">אין התראות חדשות</p>
          ) : (
            <ul className="space-y-2">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={`rounded-2xl border px-3 py-3 ${
                    n.read ? "border-[#E7DECD] bg-white" : "border-[#E0C79C] bg-[#F3E7D5]/60"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <Bell size={16} className="mt-0.5 shrink-0 text-[#6F4A2E]" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#3B332A]">{n.title}</p>
                      <p className="mt-0.5 text-[13px] text-[#8B8175]">{n.body}</p>
                      <p className="mt-1 text-[11px] text-[#B4AA9C]">{n.time}</p>
                    </div>
                    {!n.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#7FB33F]" />}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-[#E7DECD] p-4 safe-bottom">
          <button
            onClick={markAllRead}
            className="w-full rounded-2xl bg-[#FAF6EE] py-3 text-sm font-semibold text-[#3B332A] transition active:scale-95 hover:bg-[#E7DECD]"
          >
            סמן הכל כנקרא
          </button>
        </div>
      </div>
    </div>
  );
}
