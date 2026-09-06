"use client";

import { useMemo, useRef, useState } from "react";
import { AtSign, CornerDownLeft, Send, X } from "lucide-react";
import { useCrmStore, allowlistEmail } from "@/lib/crm/store";
import { paletteFromRoster } from "@/lib/crm/brainstorm";

// תיבת הכתיבה של הזירה: כתיבה חופשית, תגובה לכרטיסייה מסוימת, ותיוג אנשי צוות.
export default function Composer({ roundId, replyTo, onCancelReply, onSent }) {
  const addNote = useCrmStore((s) => s.addBrainstormNote);
  const authAllowlist = useCrmStore((s) => s.authAllowlist);
  const currentUser = useCrmStore((s) => s.currentUser);

  const [draft, setDraft] = useState("");
  const [picked, setPicked] = useState([]); // [{email, name}]
  const [showPicker, setShowPicker] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const me = String(currentUser().email || "").trim().toLowerCase();
  const roster = useMemo(() => authAllowlist.map((e) => allowlistEmail(e)), [authAllowlist]);

  // אפשר לתייג את כל חברי הצוות חוץ מעצמי
  const team = useMemo(
    () =>
      authAllowlist
        .map((e) => ({ email: allowlistEmail(e), name: e.name || allowlistEmail(e) }))
        .filter((e) => e.email && e.email !== me),
    [authAllowlist, me]
  );

  const addMention = (person) => {
    if (!picked.some((p) => p.email === person.email)) setPicked((list) => [...list, person]);
    // מוסיפים את השם לטקסט עצמו, כך שברור בתוך המשפט למי פונים
    setDraft((text) => `${text}${text && !text.endsWith(" ") ? " " : ""}@${person.name} `);
    setShowPicker(false);
    inputRef.current?.focus();
  };

  const handleSend = async () => {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setError("");
    // רק תיוגים שהשם שלהם עדיין מופיע בטקסט נחשבים. אם מחקו את השם - התיוג יורד.
    const mentions = picked.filter((p) => body.includes(`@${p.name}`)).map((p) => p.email);
    try {
      await addNote(roundId, body, {
        parentId: replyTo?.id || null,
        replyToName: replyTo?.authorName || null,
        mentions,
      });
      setDraft("");
      setPicked([]);
      onSent?.();
    } catch (err) {
      setError(
        err?.code === "permission-denied"
          ? "השרת דחה את השמירה. ייתכן שכללי האבטחה החדשים עוד לא פורסמו."
          : "השמירה נכשלה בגלל תקלת תקשורת. הטקסט נשאר כאן - נסו לשלוח שוב."
      );
    }
    setSending(false);
  };

  return (
    <div className="mt-4">
      {replyTo && (
        <div className="mb-1.5 flex items-center justify-between gap-2 rounded-2xl bg-[#F7DFD8] px-3 py-2">
          <span className="flex min-w-0 items-center gap-1.5 text-[11px] font-semibold text-[#A05243]">
            <CornerDownLeft size={12} className="shrink-0" />
            <span className="truncate">בתגובה ל{replyTo.authorName}: {replyTo.text}</span>
          </span>
          <button
            type="button"
            onClick={onCancelReply}
            aria-label="ביטול התגובה"
            className="shrink-0 rounded-full p-1 text-[#C06E5E] hover:bg-white/70"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <textarea
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={3}
        placeholder={
          replyTo
            ? `מה את/ה מוסיף/ה על מה ש${replyTo.authorName} כתב/ה?`
            : "מה את/ה חושב/ת? כתבו בחופשיות - כאן בונים יחד את התמונה."
        }
        className="w-full resize-none rounded-2xl border border-[#EADCCB] bg-white/90 px-3 py-2.5 text-[13.5px] leading-relaxed outline-none focus:border-[#C06E5E]"
      />

      {picked.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {picked.map((p) => (
            <span
              key={p.email}
              className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold text-[#5A4A3C]"
              style={{ background: paletteFromRoster(p.email, roster).bg }}
            >
              <AtSign size={10} /> {p.name}
            </span>
          ))}
        </div>
      )}

      {showPicker && (
        <div className="mt-1.5 rounded-2xl border border-[#EADCCB] bg-white p-2">
          {team.length === 0 ? (
            <p className="px-2 py-2 text-center text-[11px] text-[#8C7B6B]">אין אנשי צוות נוספים לתייג</p>
          ) : (
            team.map((person) => (
              <button
                key={person.email}
                type="button"
                onClick={() => addMention(person)}
                className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-right text-[12.5px] font-semibold text-[#5A4A3C] transition hover:bg-[#FBF3EA]"
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: paletteFromRoster(person.email, roster).dot }}
                />
                {person.name}
              </button>
            ))
          )}
        </div>
      )}

      {error && (
        <p className="mt-1.5 rounded-xl bg-[#FBEDE9] px-3 py-2 text-[11px] leading-relaxed text-[#C4584C]">{error}</p>
      )}

      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={() => setShowPicker((v) => !v)}
          className="flex shrink-0 items-center justify-center gap-1.5 rounded-2xl border border-[#EADCCB] bg-white px-3 py-2.5 text-[12px] font-semibold text-[#C06E5E] transition active:scale-[0.98]"
        >
          <AtSign size={14} /> תיוג
        </button>
        <button
          type="button"
          onClick={handleSend}
          disabled={!draft.trim() || sending}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-[#C06E5E] py-2.5 text-[13px] font-semibold text-white transition active:scale-[0.98] disabled:opacity-40"
        >
          <Send size={15} /> {sending ? "שולחת..." : replyTo ? "שליחת התגובה" : "הוספה ללוח"}
        </button>
      </div>
    </div>
  );
}
