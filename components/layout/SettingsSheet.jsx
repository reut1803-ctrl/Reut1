"use client";

import { useState } from "react";
import { Bell, Trash2, ShieldCheck, Eye, Users, UsersRound } from "lucide-react";
import Sheet from "@/components/ui/Sheet";
import { useAuth } from "@/lib/supabase/AuthProvider";
import TeamManagementSheet from "./TeamManagementSheet";

const ROLE_META = {
  admin: { label: "מנהלת המערכת", icon: ShieldCheck },
  staff: { label: "צוות", icon: Users },
  viewer: { label: "צופה", icon: Eye },
};

export default function SettingsSheet({ open, onClose }) {
  const { supabase, user, profile, signOut, refreshProfile } = useAuth();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteRequested, setDeleteRequested] = useState(false);
  const [teamOpen, setTeamOpen] = useState(false);

  const notificationsEnabled = profile?.notifications_enabled ?? true;
  const roleMeta = ROLE_META[profile?.role] ?? ROLE_META.viewer;
  const RoleIcon = roleMeta.icon;

  const toggleNotifications = async () => {
    await supabase.from("profiles").update({ notifications_enabled: !notificationsEnabled }).eq("id", user.id);
    refreshProfile();
  };

  const requestDeletion = async () => {
    setDeleteRequested(true);
    setTimeout(async () => {
      await signOut();
      onClose();
    }, 2000);
  };

  return (
    <Sheet open={open} onClose={onClose} title="הגדרות וחשבון">
      <div className="flex flex-col gap-6">
        <section>
          <h3 className="mb-3 text-sm font-semibold text-muted">המידע שלי</h3>
          <div className="card divide-y divide-black/5 p-0">
            <InfoRow label="שם מלא" value={profile?.full_name || "-"} />
            <InfoRow label="אימייל" value={user?.email} />
            <InfoRow label="טלפון" value={profile?.phone || "-"} />
            <InfoRow
              label="תאריך הצטרפות"
              value={user?.created_at ? new Date(user.created_at).toLocaleDateString("he-IL") : "-"}
            />
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold text-muted">רמת הרשאה</h3>
          <div className="card flex items-center gap-2 p-4">
            <RoleIcon size={18} className="text-bordeaux-500" />
            <span className="text-sm font-semibold text-ink">{roleMeta.label}</span>
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
              onClick={toggleNotifications}
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

        {profile?.role === "admin" && (
          <section>
            <h3 className="mb-3 text-sm font-semibold text-muted">ניהול</h3>
            <button
              onClick={() => setTeamOpen(true)}
              className="flex w-full items-center gap-2 rounded-2xl bg-bordeaux-50 px-4 py-3 text-sm font-semibold text-bordeaux-500 transition active:scale-95"
            >
              <UsersRound size={18} />
              ניהול צוות והרשאות
            </button>
          </section>
        )}

        <section>
          <h3 className="mb-3 text-sm font-semibold text-red-500">מחיקת חשבון</h3>
          {deleteRequested ? (
            <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-4 text-sm text-red-700">
              הבקשה נקלטה - מתנתקת כעת. מנהלת המערכת תשלים את מחיקת החשבון.
            </div>
          ) : !confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition active:scale-95"
            >
              <Trash2 size={17} />
              מחיקת החשבון שלי
            </button>
          ) : (
            <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <p className="mb-3 font-medium">בקשת המחיקה תישלח למנהלת המערכת ותנותקי מהחשבון. להמשיך?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 rounded-xl bg-white py-2 font-semibold text-ink"
                >
                  ביטול
                </button>
                <button onClick={requestDeletion} className="flex-1 rounded-xl bg-red-600 py-2 font-semibold text-white">
                  אישור מחיקה
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      <TeamManagementSheet open={teamOpen} onClose={() => setTeamOpen(false)} />
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
