"use client";

import { useState } from "react";
import { AtSign, CornerDownLeft, Heart, Reply, Trash2 } from "lucide-react";
import { useCrmStore } from "@/lib/crm/store";
import { paletteFor, likeCount, mentionsMe } from "@/lib/crm/brainstorm";
import ConfirmDialog from "@/components/crm/ui/ConfirmDialog";
import { toHebrewDate, toClock } from "@/lib/crm/hebrewDate";

// חותמת הזמן של הכרטיסייה: תאריך עברי קצר ושעה אמיתית.
// ערך חסר מחזיר מחרוזת ריקה, ולא 1.1.1970.
const hebrewTime = (iso) => {
  if (!iso) return "";
  const heb = toHebrewDate(iso, { withYear: false });
  const clock = toClock(iso);
  if (!clock) return "";
  return heb ? `${heb} · ${clock}` : clock;
};

const escapeForRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// מדגיש את השמות המתויגים בתוך הטקסט, כדי שיהיה ברור במבט מי נקרא לענות
function renderText(text, mentionNames) {
  const names = (mentionNames || []).filter(Boolean);
  if (names.length === 0) return text;
  const pattern = new RegExp(`(@(?:${names.map(escapeForRegex).join("|")}))`, "g");
  return String(text)
    .split(pattern)
    .map((part, i) =>
      part.startsWith("@") && names.some((n) => part === `@${n}`) ? (
        <span key={i} className="rounded px-1 font-bold text-[#6E3540]" style={{ background: "rgba(140,74,85,0.12)" }}>
          {part}
        </span>
      ) : (
        <span key={i}>{part}</span>
      )
    );
}

// כרטיסייה אחת בדיון. הרקע שקוף-למחצה עם טשטוש (זכוכית), והצבע קבוע לכל אדם
// כדי שאפשר יהיה לזהות מי כתב מה במבט אחד.
// isReply - תגובה שנצמדה לכרטיסייה אחרת, ולכן מוצגת מוקטנת ומוזחת פנימה.
export default function NoteCard({
  note,
  gold = false,
  locked = false,
  isReply = false,
  palette: palettePro = null,
  mentionNames = [],
  onReply = null,
}) {
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
  const taggedMe = mentionsMe(note, me);

  const handleDelete = async () => {
    await deleteNote(note.id);
    setConfirming(false);
    showToast(isReply ? "התגובה נמחקה" : "הכרטיסייה נמחקה");
  };

  return (
    <div
      data-note-id={note.id}
      className={`relative rounded-3xl border backdrop-blur-md transition ${isReply ? "p-3" : "p-3.5"}`}
      style={{
        background: palette.bg,
        borderColor: taggedMe ? "#8C4A55" : gold ? "#D9B45B" : palette.border,
        boxShadow: taggedMe
          ? "0 0 0 2px rgba(140,74,85,0.35), 0 8px 24px rgba(140,74,85,0.16)"
          : gold
          ? "0 0 0 1px rgba(217,180,91,0.55), 0 8px 26px rgba(217,180,91,0.22)"
          : "0 8px 24px rgba(58,51,53,0.08)",
      }}
    >
      {gold && !isReply && (
        <span className="absolute -top-2 right-4 rounded-full bg-[#D9B45B] px-2 py-0.5 text-[9px] font-bold text-white shadow-sm">
          הכי מהדהד בצוות
        </span>
      )}

      {taggedMe && (
        <span className="absolute -top-2 left-4 flex items-center gap-1 rounded-full bg-[#8C4A55] px-2 py-0.5 text-[9px] font-bold text-white shadow-sm">
          <AtSign size={9} /> תויגת כאן
        </span>
      )}

      {isReply && note.replyToName && (
        <p className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold text-[#8A8285]">
          <CornerDownLeft size={11} /> בתגובה ל{note.replyToName}
        </p>
      )}

      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: palette.dot }} />
          <span className={`truncate font-bold text-[#3A3335] ${isReply ? "text-[11px]" : "text-[12px]"}`}>
            {note.authorName || "איש/אשת צוות"}
          </span>
        </div>
        <span className="shrink-0 text-[10px] text-[#8A8285]">{hebrewTime(note.createdAt)}</span>
      </div>

      <p
        className={`mt-2 whitespace-pre-wrap leading-relaxed text-[#3A3335] ${
          isReply ? "text-[12.5px]" : "text-[13.5px]"
        }`}
      >
        {renderText(note.text, mentionNames)}
      </p>

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => !locked && toggleLike(note.id)}
            disabled={locked}
            aria-label={iLiked ? "ביטול חיזוק" : "חיזוק לכרטיסייה"}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold transition active:scale-95 disabled:opacity-50 ${
              iLiked ? "bg-[#8C4A55] text-white" : "bg-white/70 text-[#8C4A55]"
            }`}
          >
            <Heart size={13} fill={iLiked ? "currentColor" : "none"} />
            {likes > 0 ? likes : "מחזקת"}
          </button>

          {onReply && !locked && (
            <button
              type="button"
              onClick={() => onReply(note)}
              className="flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-[11px] font-bold text-[#8C4A55] transition active:scale-95"
            >
              <Reply size={13} /> מגיב/ה
            </button>
          )}
        </div>

        {canDelete && (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            aria-label="מחיקה"
            className="shrink-0 rounded-full p-1.5 text-[#C24545] transition hover:bg-white/60"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {confirming && (
        <ConfirmDialog
          message={
            isReply
              ? "למחוק את התגובה הזו?"
              : "למחוק את הכרטיסייה הזו? גם התגובות שנכתבו עליה יימחקו."
          }
          onConfirm={handleDelete}
          onCancel={() => setConfirming(false)}
        />
      )}
    </div>
  );
}
