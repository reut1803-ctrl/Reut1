"use client";

import { useState } from "react";
import { Heart, Trash2 } from "lucide-react";
import { useCrmStore } from "@/lib/crm/store";
import { paletteFor, likeCount } from "@/lib/crm/brainstorm";
import ConfirmDialog from "@/components/crm/ui/ConfirmDialog";

const hebrewTime = (iso) => {
  const d = new Date(iso || 0);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("he-IL", { day: "numeric", month: "numeric" }) + " · " +
    d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
};

// כרטיסייה צפה אחת בדיון. הרקע שקוף-למחצה עם טשטוש (זכוכית), והצבע קבוע
// לכל אדם כדי שאפשר יהיה לזהות מי כתב מה במבט אחד.
export default function NoteCard({ note, gold = false, locked = false, cardRef, palette: palettePro = null }) {
  const toggleLike = useCrmStore((s) => s.toggleBrainstormLike);
  const deleteNote = useCrmStore((s) => s.deleteBrainstormNote);
  const role = useCrmStore((s) => s.role);
  const currentUser = useCrmStore((s) => s.currentUser);
  const showToast = useCrmStore((s) => s.showToast);
  const [confirming, setConfirming] = useState(false);

  const me = String(currentUser().email || "").trim().toLowerCase();
  const palette = palettePro || paletteFor(note.authorEmail);
  const likes = likeCount(note);
  const iLiked = Array.isArray(note.likes) && note.likes.includes(me);
  const canDelete = role === "admin" || note.authorEmail === me;

  const handleLike = async () => {
    if (locked) return;
    await toggleLike(note.id);
  };

  const handleDelete = async () => {
    await deleteNote(note.id);
    setConfirming(false);
    showToast("הכרטיסייה נמחקה");
  };

  return (
    <div
      ref={cardRef}
      data-note-id={note.id}
      className="relative rounded-3xl border p-3.5 backdrop-blur-md transition"
      style={{
        background: palette.bg,
        borderColor: gold ? "#D9B45B" : palette.border,
        boxShadow: gold
          ? "0 0 0 1px rgba(217,180,91,0.55), 0 8px 26px rgba(217,180,91,0.22)"
          : "0 8px 24px rgba(58,51,53,0.08)",
      }}
    >
      {gold && (
        <span className="absolute -top-2 right-4 rounded-full bg-[#D9B45B] px-2 py-0.5 text-[9px] font-bold text-white shadow-sm">
          הכי מהדהד בצוות
        </span>
      )}

      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: palette.dot }} />
          <span className="truncate text-[12px] font-bold text-[#3A3335]">{note.authorName || "איש/אשת צוות"}</span>
        </div>
        <span className="shrink-0 text-[10px] text-[#8A8285]">{hebrewTime(note.createdAt)}</span>
      </div>

      <p className="mt-2 whitespace-pre-wrap text-[13.5px] leading-relaxed text-[#3A3335]">{note.text}</p>

      <div className="mt-3 flex items-center justify-between">
        <button
          type="button"
          onClick={handleLike}
          disabled={locked}
          aria-label={iLiked ? "ביטול חיזוק" : "חיזוק לכרטיסייה"}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold transition active:scale-95 disabled:opacity-50 ${
            iLiked ? "bg-[#8C4A55] text-white" : "bg-white/70 text-[#8C4A55]"
          }`}
        >
          <Heart size={13} fill={iLiked ? "currentColor" : "none"} />
          {likes > 0 ? likes : "מחזקת"}
        </button>

        {canDelete && (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            aria-label="מחיקת הכרטיסייה"
            className="rounded-full p-1.5 text-[#C24545] transition hover:bg-white/60"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {confirming && (
        <ConfirmDialog
          message="למחוק את הכרטיסייה הזו מהדיון?"
          onConfirm={handleDelete}
          onCancel={() => setConfirming(false)}
        />
      )}
    </div>
  );
}
