"use client";

import { useCallback, useEffect, useState } from "react";
import { ShieldCheck, Users, Eye } from "lucide-react";
import Sheet from "@/components/ui/Sheet";
import { useAuth } from "@/lib/supabase/AuthProvider";
import { fetchAllProfiles, updateUserRole } from "@/lib/queries";

const ROLE_OPTIONS = [
  { value: "viewer", label: "צופה", icon: Eye },
  { value: "staff", label: "צוות", icon: Users },
  { value: "admin", label: "מנהלת", icon: ShieldCheck },
];

export default function TeamManagementSheet({ open, onClose }) {
  const { supabase, user } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setProfiles(await fetchAllProfiles(supabase));
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const changeRole = async (profileId, role) => {
    setProfiles((prev) => prev.map((p) => (p.id === profileId ? { ...p, role } : p)));
    await updateUserRole(supabase, profileId, role);
  };

  return (
    <Sheet open={open} onClose={onClose} title="ניהול צוות">
      <p className="mb-4 text-xs text-muted">
        כל מי שנרשמת לאתר מופיעה כאן. אפשר לקבוע לה הרשאה בלחיצה - בלי Supabase, בלי SQL.
      </p>

      {loading ? (
        <div className="py-10 text-center text-sm text-muted">טוען...</div>
      ) : profiles.length === 0 ? (
        <div className="py-10 text-center text-sm text-muted">עדיין אין משתמשות רשומות</div>
      ) : (
        <div className="flex flex-col gap-3">
          {profiles.map((p) => (
            <div key={p.id} className="card p-4">
              <div className="mb-3">
                <p className="text-sm font-bold text-ink">{p.full_name || "ללא שם"}</p>
                <p className="text-xs text-muted">{p.email}</p>
                {p.id === user?.id && <p className="text-[11px] text-pink-500">זו את</p>}
              </div>
              <div className="flex gap-2">
                {ROLE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => changeRole(p.id, opt.value)}
                    className={`flex flex-1 flex-col items-center gap-1 rounded-2xl border-2 px-2 py-2.5 text-xs font-semibold transition ${
                      p.role === opt.value
                        ? "border-bordeaux-500 bg-bordeaux-50 text-bordeaux-500"
                        : "border-black/10 text-muted"
                    }`}
                  >
                    <opt.icon size={16} />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Sheet>
  );
}
