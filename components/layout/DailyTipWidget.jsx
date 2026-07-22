"use client";

import { useEffect, useState } from "react";
import { Lightbulb, Pencil } from "lucide-react";
import { useAuth } from "@/lib/supabase/AuthProvider";
import { fetchAppSettings, updateAppSettings } from "@/lib/queries";

export default function DailyTipWidget() {
  const { supabase, profile } = useAuth();
  const [tip, setTip] = useState(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const canSee = profile?.role === "staff" || profile?.role === "admin";

  useEffect(() => {
    if (canSee) fetchAppSettings(supabase).then((s) => setTip(s.daily_tip));
  }, [canSee, supabase]);

  if (!canSee || tip == null) return null;

  const save = async () => {
    await updateAppSettings(supabase, { daily_tip: draft });
    setTip(draft);
    setEditing(false);
  };

  return (
    <div className="card flex gap-3 border-pink-100 bg-pink-50/60 p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-pink-500 text-white">
        <Lightbulb size={16} />
      </div>
      <div className="flex-1">
        <div className="mb-1 flex items-center justify-between">
          <p className="text-xs font-bold text-bordeaux-500">טיפ בשידוכים</p>
          {profile?.role === "admin" && !editing && (
            <button
              onClick={() => {
                setDraft(tip);
                setEditing(true);
              }}
              className="text-muted"
            >
              <Pencil size={13} />
            </button>
          )}
        </div>
        {editing ? (
          <div className="flex flex-col gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-black/10 bg-white p-2 text-xs outline-none focus:border-pink-400"
            />
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)} className="flex-1 rounded-xl bg-white py-1.5 text-xs font-semibold">
                ביטול
              </button>
              <button onClick={save} className="flex-1 rounded-xl bg-pink-500 py-1.5 text-xs font-semibold text-white">
                שמירה
              </button>
            </div>
          </div>
        ) : (
          <p className="text-xs leading-relaxed text-ink">{tip}</p>
        )}
      </div>
    </div>
  );
}
