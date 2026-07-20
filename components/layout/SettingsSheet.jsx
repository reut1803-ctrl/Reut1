"use client";

import { useState } from "react";
import { Bell, Trash2, ShieldCheck, Eye, Users } from "lucide-react";
import Sheet from "@/components/ui/Sheet";
import { useAppStore } from "@/lib/store";
import { ADMIN } from "@/lib/data";

export default function SettingsSheet({ open, onClose }) {
  const notificationsEnabled = useAppStore((s) => s.notificationsEnabled);
  const setNotificationsEnabled = useAppStore((s) => s.setNotificationsEnabled);
  const role = useAppStore((s) => s.role);
  const setRole = useAppStore((s) => s.setRole);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <Sheet open={open} onClose={onClose} title="הגדרות וחשבון">
      <div className="flex flex-col gap-6">
        <section>
          <h3 className="mb-3 text-sm font-semibold text-muted">המידע שלי</h3>
          <div className="card divide-y divide-black/5 p-0">
            <InfoRow label="שם מלא" value={ADMIN.fullName} />
            <InfoRow label="אימייל" value={ADMIN.email} />
            <InfoRow label="טלפון" value={ADMIN.phone} />
            <InfoRow label="תאריך הצטרפות" value={ADMIN.joinedAt} />
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold text-muted">התראות</h3>
          <div className="card flex items-center justify-between p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-ink">
              <Bell size={18} className="text-bordeaux-500" />
              קבלת התראות פעילה
            </div>
            <button
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              className={`h-7 w-12 rounded-full transition ${notificationsEnabled ? "bg-mint-500" : "bg-black/10"}`}
            >
              <span
                className={`block h-5 w-5 translate-y-1 rounded-full bg-white shadow transition ${
                  notificationsEnabled ? "translate-x-1" : "translate-x-6"
                }`}
              />
            </button>
          </div>
        </section>

        <section>
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-muted">
            מצב תצוגה להדגמה
          </h3>
          <p className="mb-2 text-xs text-muted">
            לצורך ההדגמה בלבד — בעתיד ההרשאה תיקבע אוטומטית לפי ההתחברות שלך.
          </p>
          <div className="flex gap-2">
            <RoleButton icon={Eye} label="צופה" active={role === "viewer"} onClick={() => setRole("viewer")} />
            <RoleButton icon={Users} label="צוות" active={role === "staff"} onClick={() => setRole("staff")} />
            <RoleButton icon={ShieldCheck} label="מנהלת" active={role === "admin"} onClick={() => setRole("admin")} />
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold text-red-500">מחיקת חשבון</h3>
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition active:scale-95"
            >
              <Trash2 size={17} />
              מחיקת החשבון שלי
            </button>
          ) : (
            <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <p className="mb-3 font-medium">פעולה זו תמחק את החשבון לצמיתות. להמשיך?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 rounded-xl bg-white py-2 font-semibold text-ink"
                >
                  ביטול
                </button>
                <button className="flex-1 rounded-xl bg-red-600 py-2 font-semibold text-white">
                  אישור מחיקה
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </Sheet>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-xs text-muted">{label}</span>
      <span className="text-sm font-medium text-ink">{value}</span>
    </div>
  );
}

function RoleButton({ icon: Icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 flex-col items-center gap-1 rounded-2xl border-2 px-2 py-3 text-xs font-semibold transition ${
        active ? "border-bordeaux-500 bg-bordeaux-50 text-bordeaux-500" : "border-black/10 text-muted"
      }`}
    >
      <Icon size={18} />
      {label}
    </button>
  );
}
