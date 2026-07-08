"use client";

import { useState } from "react";
import { X, User, Mail, Phone, Calendar, Trash2, ShieldCheck } from "lucide-react";
import { useCrmStore, DEMO_USERS_BY_ROLE } from "@/lib/crm/store";

const ROLE_LABELS = {
  admin: "מנהלת מערכת (הרשאת-על)",
  staff: "צוות עובדים",
  viewer: "צופה",
};

export default function SettingsSheet({ onClose }) {
  const role = useCrmStore((s) => s.role);
  const setRole = useCrmStore((s) => s.setRole);
  const notificationsEnabled = useCrmStore((s) => s.notificationsEnabled);
  const toggleNotificationsEnabled = useCrmStore((s) => s.toggleNotificationsEnabled);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const user = DEMO_USERS_BY_ROLE[role];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative max-h-[88vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-[#EAE5E3] bg-white px-5 py-4">
          <h2 className="text-lg font-bold text-[#3A3335]">המידע שלי</h2>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-[#F6F5F4]" aria-label="סגירה">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5 px-5 py-5">
          <div className="rounded-2xl border border-[#EAE5E3] bg-[#F6F5F4]/60 p-4">
            <InfoRow icon={User} label="שם" value={user.name} />
            <InfoRow icon={Mail} label="אימייל" value={user.email} />
            <InfoRow icon={Phone} label="טלפון" value={user.phone} />
            <InfoRow icon={Calendar} label="תאריך הצטרפות" value={user.joinDate} last />
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-[#EAE5E3] p-4">
            <div>
              <p className="text-sm font-semibold text-[#3A3335]">התראות מופעלות</p>
              <p className="text-[12px] text-[#8A8285]">קבלת עדכונים על הצעות והתאמות חדשות</p>
            </div>
            <button
              onClick={toggleNotificationsEnabled}
              className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                notificationsEnabled ? "bg-[#20A66B]" : "bg-[#EAE5E3]"
              }`}
              aria-pressed={notificationsEnabled}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
                  notificationsEnabled ? "right-1" : "right-6"
                }`}
              />
            </button>
          </div>

          <div className="rounded-2xl border border-[#EAE5E3] p-4">
            <div className="mb-2 flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-[#8C4A55]" />
              <p className="text-sm font-semibold text-[#3A3335]">מצב תצוגה להדגמה</p>
            </div>
            <p className="mb-3 text-[12px] text-[#8A8285]">
              במערכת האמיתית ההרשאה נקבעת לפי המשתמש המחובר. כאן, לצורך הדגמה, אפשר לעבור בין הרמות ולראות איך המסך משתנה.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {Object.keys(ROLE_LABELS).map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`rounded-xl border px-2 py-2 text-[12px] font-semibold transition ${
                    role === r
                      ? "border-[#8C4A55] bg-[#8C4A55] text-white"
                      : "border-[#EAE5E3] bg-white text-[#3A3335] hover:bg-[#F6F5F4]"
                  }`}
                >
                  {r === "admin" ? "מנהלת" : r === "staff" ? "צוות" : "צופה"}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-[#B5AEB0]">{ROLE_LABELS[role]}</p>
          </div>

          <div className="rounded-2xl border border-red-200 bg-red-50/60 p-4">
            <p className="mb-1 text-sm font-semibold text-red-700">מחיקת חשבון</p>
            <p className="mb-3 text-[12px] text-red-600/80">פעולה זו תמחק את החשבון וכל המידע לצמיתות ולא ניתנת לביטול.</p>
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex w-full items-center justify-center gap-1.5 rounded-2xl border-2 border-red-500 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition active:scale-95 hover:bg-red-50"
              >
                <Trash2 size={16} /> מחיקת חשבון
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 rounded-2xl border border-[#EAE5E3] bg-white px-4 py-2.5 text-sm font-semibold text-[#3A3335]"
                >
                  ביטול
                </button>
                <button className="flex-1 rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white">
                  אישור מחיקה
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, last }) {
  return (
    <div className={`flex items-center gap-2.5 py-2 ${!last ? "border-b border-[#EAE5E3]" : ""}`}>
      <Icon size={16} className="text-[#8C4A55]" />
      <span className="w-24 shrink-0 text-[12px] text-[#8A8285]">{label}</span>
      <span className="text-sm font-medium text-[#3A3335]">{value}</span>
    </div>
  );
}
