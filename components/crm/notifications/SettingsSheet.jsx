"use client";

import { useState } from "react";
import { X, User, Mail, Trash2, ShieldCheck, LogOut, AlertTriangle } from "lucide-react";
import { useCrmStore } from "@/lib/crm/store";
import GoogleSignInButton from "@/components/crm/auth/GoogleSignInButton";

const ROLE_LABELS = {
  admin: "מנהלת מערכת (הרשאת-על)",
  staff: "צוות עובדים",
  viewer: "צופה",
};

export default function SettingsSheet({ onClose }) {
  const role = useCrmStore((s) => s.role);
  const currentUser = useCrmStore((s) => s.currentUser);
  const googleUser = useCrmStore((s) => s.googleUser);
  const signOutGoogle = useCrmStore((s) => s.signOutGoogle);
  const notificationsEnabled = useCrmStore((s) => s.notificationsEnabled);
  const toggleNotificationsEnabled = useCrmStore((s) => s.toggleNotificationsEnabled);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const user = currentUser();

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative max-h-[88vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-[#D9C6A5] bg-white px-5 py-4">
          <h2 className="text-lg font-bold text-[#2E2116]">המידע שלי</h2>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-[#F2E8D5]" aria-label="סגירה">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5 px-5 py-5">
          <div className="rounded-2xl border border-[#D9C6A5] bg-[#F2E8D5]/60 p-4">
            <InfoRow icon={User} label="שם" value={user.name} />
            <InfoRow icon={Mail} label="אימייל" value={user.email || "-"} last />
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-[#D9C6A5] p-4">
            <div>
              <p className="text-sm font-semibold text-[#2E2116]">התראות מופעלות</p>
              <p className="text-[12px] text-[#7A6A55]">קבלת עדכונים על הצעות והתאמות חדשות</p>
            </div>
            <button
              onClick={toggleNotificationsEnabled}
              className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                notificationsEnabled ? "bg-[#7FB33F]" : "bg-[#D9C6A5]"
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

          <div className="rounded-2xl border border-[#D9C6A5] p-4">
            <div className="mb-2 flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-[#5B3418]" />
              <p className="text-sm font-semibold text-[#2E2116]">כניסה אישית</p>
            </div>

            {!googleUser && (
              <>
                <p className="mb-3 text-[12px] text-[#7A6A55]">
                  התחברות עם חשבון Google - הגישה לצוות ולמנהלת ניתנת רק לכתובות מייל שאושרו מראש.
                </p>
                <GoogleSignInButton />
              </>
            )}

            {googleUser && role === "unauthorized" && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
                <p className="flex items-center gap-1.5 text-[13px] font-semibold text-amber-800">
                  <AlertTriangle size={15} /> אין לך הרשאת גישה
                </p>
                <p className="mt-1 text-[12px] text-amber-700">
                  מחוברת כ-{googleUser.email}. הכתובת הזו לא ברשימת ההרשאות. פני למנהלת כדי להצטרף.
                </p>
                <button
                  onClick={signOutGoogle}
                  className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#D9C6A5] bg-white py-2 text-[12px] font-semibold text-[#2E2116]"
                >
                  <LogOut size={13} /> התנתקות
                </button>
              </div>
            )}

            {googleUser && (role === "admin" || role === "staff") && (
              <div className="flex items-center justify-between rounded-2xl bg-[#F2E8D5] p-3">
                <div className="flex items-center gap-2.5">
                  {googleUser.picture && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={googleUser.picture} alt="" className="h-9 w-9 rounded-full" referrerPolicy="no-referrer" />
                  )}
                  <div>
                    <p className="text-sm font-semibold text-[#2E2116]">{googleUser.name}</p>
                    <p className="text-[11px] text-[#7A6A55]">{ROLE_LABELS[role]}</p>
                  </div>
                </div>
                <button onClick={signOutGoogle} aria-label="התנתקות" className="rounded-full p-2 hover:bg-white">
                  <LogOut size={16} className="text-[#7A6A55]" />
                </button>
              </div>
            )}
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
                  className="flex-1 rounded-2xl border border-[#D9C6A5] bg-white px-4 py-2.5 text-sm font-semibold text-[#2E2116]"
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
    <div className={`flex items-center gap-2.5 py-2 ${!last ? "border-b border-[#D9C6A5]" : ""}`}>
      <Icon size={16} className="text-[#5B3418]" />
      <span className="w-24 shrink-0 text-[12px] text-[#7A6A55]">{label}</span>
      <span className="text-sm font-medium text-[#2E2116]">{value}</span>
    </div>
  );
}
