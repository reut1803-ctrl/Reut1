"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  Lightbulb,
  Lock,
  MessageCircle,
  RotateCcw,
  Send,
  Sparkles,
  Tag,
  Trash2,
  Users,
} from "lucide-react";
import { useCrmStore } from "@/lib/crm/store";
import {
  extractKeywords,
  isRoundClosed,
  relatedPairs,
  topLikedIds,
  paletteFromRoster,
} from "@/lib/crm/brainstorm";
import ConfirmDialog from "@/components/crm/ui/ConfirmDialog";
import NoteCard from "@/components/crm/brainstorm/NoteCard";
import MindMapLines from "@/components/crm/brainstorm/MindMapLines";
import RoundTimer from "@/components/crm/brainstorm/RoundTimer";
import OpenRoundPanel from "@/components/crm/brainstorm/OpenRoundPanel";
import WhatsappInvite from "@/components/crm/brainstorm/WhatsappInvite";

const hebrewDate = (iso) => {
  const d = new Date(iso || 0);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("he-IL");
};

// לוח הדיון של סבב אחד: השאלה, השעון, ענן מילות המפתח, הכרטיסיות הצפות
// עם הקווים המחברים ביניהן, ותיבת הכתיבה.
function RoundBoard({ round }) {
  const role = useCrmStore((s) => s.role);
  const notes = useCrmStore((s) => s.notesForRound(round.id));
  const addNote = useCrmStore((s) => s.addBrainstormNote);
  const closeRound = useCrmStore((s) => s.closeBrainstormRound);
  const reopenRound = useCrmStore((s) => s.reopenBrainstormRound);
  const saveSummary = useCrmStore((s) => s.saveBrainstormSummary);
  const deleteRound = useCrmStore((s) => s.deleteBrainstormRound);
  const showToast = useCrmStore((s) => s.showToast);
  const authAllowlist = useCrmStore((s) => s.authAllowlist);

  // צבע קבוע ושונה לכל איש/אשת צוות, לפי המקום ברשימת ההרשאות
  const roster = useMemo(
    () => authAllowlist.map((e) => String(e.email || e.id || "").toLowerCase()),
    [authAllowlist]
  );
  const paletteOf = (email) => paletteFromRoster(email, roster);

  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [summaryDraft, setSummaryDraft] = useState(round.summary || "");
  const [savingSummary, setSavingSummary] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const boardRef = useRef(null);

  const closed = isRoundClosed(round);
  const isAdmin = role === "admin";

  const keywords = useMemo(() => extractKeywords(notes.map((n) => n.text)), [notes]);
  const pairs = useMemo(() => relatedPairs(notes, keywords), [notes, keywords]);
  const gold = useMemo(() => topLikedIds(notes), [notes]);
  const participants = useMemo(() => {
    const map = new Map();
    notes.forEach((n) => {
      if (!map.has(n.authorEmail)) map.set(n.authorEmail, n.authorName || n.authorEmail);
    });
    return [...map.entries()];
  }, [notes]);

  const handleSend = async () => {
    const body = draft.trim();
    if (!body || closed || sending) return;
    setSending(true);
    setError("");
    try {
      await addNote(round.id, body);
      setDraft("");
    } catch (err) {
      setError(
        err?.code === "permission-denied"
          ? "השרת דחה את השמירה. ייתכן שכללי האבטחה החדשים עוד לא פורסמו."
          : "השמירה נכשלה בגלל תקלת תקשורת. הטקסט נשאר כאן - נסו לשלוח שוב."
      );
    }
    setSending(false);
  };

  const handleSaveSummary = async () => {
    setSavingSummary(true);
    try {
      await saveSummary(round.id, summaryDraft);
      showToast("הסיכום נשמר ויופיע בראש כרטיס המועמד/ת");
    } catch {
      showToast("שמירת הסיכום נכשלה, נסי שוב");
    }
    setSavingSummary(false);
  };

  return (
    <div className="rounded-3xl border border-white/70 bg-white/55 p-4 shadow-[0_10px_34px_rgba(58,51,53,0.08)] backdrop-blur-xl">
      {/* כותרת: על מי מדברים ומה השאלה */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-[#8C4A55]">סיעור מוחות על</p>
          <h2 className="truncate text-[18px] font-bold text-[#3A3335]">
            {round.candidateName || "מועמד/ת"}
          </h2>
          <p className="mt-0.5 text-[10px] text-[#B5AEB0]">
            נפתח ע״י {round.openedBy} · {hebrewDate(round.openedAt)}
          </p>
        </div>
        {round.candidateId && (
          <Link
            href={`/crm?open=${round.candidateId}`}
            className="shrink-0 rounded-full bg-white/80 px-3 py-1.5 text-[11px] font-semibold text-[#8C4A55] shadow-sm"
          >
            לכרטיס
          </Link>
        )}
      </div>

      <div className="mt-3 rounded-2xl bg-[#FFF8E7]/80 p-3">
        <p className="flex items-center gap-1.5 text-[10px] font-bold text-[#946200]">
          <Sparkles size={12} /> השאלה לסבב
        </p>
        <p className="mt-1 text-[13.5px] font-semibold leading-relaxed text-[#3A3335]">{round.question}</p>
      </div>

      <div className="mt-3">
        <RoundTimer round={round} />
      </div>

      {/* ענן מילות המפתח - השפה המשותפת שהצוות מייצר */}
      {keywords.length > 0 && (
        <div className="mt-3 rounded-2xl bg-white/60 p-3">
          <p className="flex items-center gap-1.5 text-[10px] font-bold text-[#8A8285]">
            <Tag size={12} /> מילות המפתח שעולות מהצוות
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {keywords.map((k, i) => (
              <span
                key={k.stem}
                className="rounded-full bg-[#F6E4E6] px-2.5 py-1 font-bold text-[#6E3540]"
                style={{ fontSize: `${Math.min(15, 10.5 + k.count * 0.9)}px`, opacity: 1 - i * 0.05 }}
              >
                {k.word}
                <span className="mr-1 text-[9px] font-normal opacity-60">{k.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* מי כבר השתתף, בצבע הקבוע של כל אחד */}
      {participants.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 text-[10px] font-semibold text-[#8A8285]">
            <Users size={12} /> השתתפו:
          </span>
          {participants.map(([email, name]) => (
            <span key={email} className="flex items-center gap-1 text-[10px] font-semibold text-[#3A3335]">
              <span className="h-2 w-2 rounded-full" style={{ background: paletteOf(email).dot }} />
              {name}
            </span>
          ))}
        </div>
      )}

      {/* הכרטיסיות הצפות, עם הקווים שמחברים בין כיוונים דומים */}
      <div ref={boardRef} className="relative mt-4">
        <MindMapLines containerRef={boardRef} pairs={pairs} />
        {notes.length === 0 ? (
          <p className="rounded-2xl bg-white/60 px-3 py-6 text-center text-[12px] leading-relaxed text-[#8A8285]">
            עוד לא נכתב כאן כלום. הכרטיסייה הראשונה היא תמיד הכי חשובה - היא פותחת את הכיוון לכולם.
          </p>
        ) : (
          <div className="relative z-10 space-y-3">
            {notes.map((note) => (
              <NoteCard key={note.id} note={note} gold={gold.has(note.id)} locked={closed} palette={paletteOf(note.authorEmail)} />
            ))}
          </div>
        )}
      </div>

      {/* תיבת הכתיבה */}
      {closed ? (
        <div className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-[#EFEDEB] px-3 py-3 text-[12px] font-semibold text-[#6B6467]">
          <Lock size={14} /> הסבב נעול. אפשר לקרוא הכל, אך לא להוסיף.
        </div>
      ) : (
        <div className="mt-4">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            placeholder="מה את/ה חושב/ת? כתבו בחופשיות - כאן בונים יחד את התמונה."
            className="w-full resize-none rounded-2xl border border-[#EAE5E3] bg-white/90 px-3 py-2.5 text-[13.5px] leading-relaxed outline-none focus:border-[#8C4A55]"
          />
          {error && (
            <p className="mt-1.5 rounded-xl bg-[#FBEDED] px-3 py-2 text-[11px] leading-relaxed text-[#C24545]">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={handleSend}
            disabled={!draft.trim() || sending}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-2xl bg-[#8C4A55] py-2.5 text-[13px] font-semibold text-white transition active:scale-[0.98] disabled:opacity-40"
          >
            <Send size={15} /> {sending ? "שולחת..." : "הוספה ללוח"}
          </button>
        </div>
      )}

      {/* אזור המנהלת: עדכון הצוות, סגירה, סיכום ומחיקה */}
      {isAdmin && (
        <div className="mt-4 space-y-2.5 border-t border-white/70 pt-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowInvite(true)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-[#20A66B] py-2.5 text-[12px] font-semibold text-white transition active:scale-[0.98]"
            >
              <MessageCircle size={14} /> עדכון הצוות
            </button>
            {closed ? (
              <button
                type="button"
                onClick={() => reopenRound(round.id)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-[#EAE5E3] bg-white py-2.5 text-[12px] font-semibold text-[#3A3335] transition active:scale-[0.98]"
              >
                <RotateCcw size={14} /> פתיחה לעוד 3 ימים
              </button>
            ) : (
              <button
                type="button"
                onClick={() => closeRound(round.id)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-[#EAE5E3] bg-white py-2.5 text-[12px] font-semibold text-[#3A3335] transition active:scale-[0.98]"
              >
                <Lock size={14} /> סגירת הסבב
              </button>
            )}
          </div>

          <div className="rounded-2xl bg-white/80 p-3">
            <p className="text-[12px] font-bold text-[#3A3335]">סיכום המנהלת</p>
            <p className="mt-1 text-[11px] leading-relaxed text-[#8A8285]">
              מה המסקנה מהדיון? הסיכום הזה יופיע בקביעות בראש כרטיס המועמד/ת, כמצפן לצוות.
            </p>
            <textarea
              value={summaryDraft}
              onChange={(e) => setSummaryDraft(e.target.value)}
              rows={3}
              placeholder="השורה התחתונה מהדיון..."
              className="mt-2 w-full resize-none rounded-xl border border-[#EAE5E3] bg-white px-3 py-2.5 text-[13px] leading-relaxed outline-none focus:border-[#8C4A55]"
            />
            <button
              type="button"
              onClick={handleSaveSummary}
              disabled={savingSummary}
              className="mt-2 w-full rounded-xl bg-[#8C4A55] py-2 text-[12px] font-semibold text-white transition active:scale-[0.98] disabled:opacity-40"
            >
              {savingSummary ? "שומרת..." : "שמירת הסיכום"}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="flex w-full items-center justify-center gap-1.5 rounded-2xl py-2 text-[11px] font-semibold text-[#C24545]"
          >
            <Trash2 size={13} /> מחיקת הסבב כולו
          </button>
        </div>
      )}

      {confirmingDelete && (
        <ConfirmDialog
          message="למחוק את הסבב הזה ואת כל הכרטיסיות שבו לצמיתות?"
          onConfirm={async () => {
            await deleteRound(round.id);
            setConfirmingDelete(false);
            showToast("הסבב נמחק");
          }}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}

      {showInvite && <WhatsappInvite round={round} onClose={() => setShowInvite(false)} />}
    </div>
  );
}

export default function BrainstormPage() {
  const role = useCrmStore((s) => s.role);
  const rounds = useCrmStore((s) => s.visibleRounds());
  const brainstormLoaded = useCrmStore((s) => s.brainstormLoaded);
  const brainstormError = useCrmStore((s) => s.brainstormError);
  const [showArchive, setShowArchive] = useState(false);
  const [inviteRound, setInviteRound] = useState(null);

  if (role !== "staff" && role !== "admin") {
    return <p className="px-4 py-10 text-center text-sm text-[#8A8285]">אזור זה זמין לצוות בלבד</p>;
  }

  const open = rounds.filter((r) => !isRoundClosed(r));
  const closed = rounds.filter((r) => isRoundClosed(r));

  return (
    <div className="relative min-h-full px-4 py-6">
      {/* רקע פסטלי רך שנותן לכרטיסיות את תחושת הריחוף */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -right-16 top-10 h-56 w-56 rounded-full bg-[#F6E4E6] blur-3xl opacity-70" />
        <div className="absolute -left-20 top-56 h-64 w-64 rounded-full bg-[#DFEEE8] blur-3xl opacity-70" />
        <div className="absolute right-6 bottom-24 h-52 w-52 rounded-full bg-[#E8E9F6] blur-3xl opacity-70" />
      </div>

      <h1 className="flex items-center gap-2 text-xl font-bold text-[#3A3335]">
        <Lightbulb size={22} className="text-[#8C4A55]" /> זירת סיעור המוחות
      </h1>
      <p className="mt-1 text-[13px] leading-relaxed text-[#8A8285]">
        מרחב אחד לחשוב יחד על מועמד/ת אחד/ת, שלושה ימים, שאלה אחת עמוקה.
      </p>

      {brainstormError && (
        <div className="mt-4 rounded-2xl bg-[#FBEDED] p-3">
          <p className="text-[12px] font-bold text-[#C24545]">הזירה עדיין לא פעילה</p>
          <p className="mt-1 text-[11px] leading-relaxed text-[#8A8285]">
            השרת חוסם כרגע את הגישה לזירה. זה קורה עד שכללי האבטחה החדשים מתפרסמים. כל שאר המערכת
            ממשיכה לעבוד כרגיל.
          </p>
        </div>
      )}

      {role === "admin" && (
        <div className="mt-4">
          <OpenRoundPanel onOpened={(round) => setInviteRound(round)} />
        </div>
      )}

      <div className="mt-5 space-y-4">
        {open.length === 0 && !brainstormError && brainstormLoaded && (
          <p className="rounded-3xl bg-white/60 px-4 py-8 text-center text-[13px] leading-relaxed text-[#8A8285] backdrop-blur">
            {role === "admin"
              ? "אין כרגע סבב פעיל. פתחי סבב חדש למעלה, והצוות יקבל שלושה ימים לחשוב יחד."
              : "אין כרגע סבב פעיל. כשהמנהלת תפתח סבב חדש תקבלו הודעה בוואטסאפ."}
          </p>
        )}
        {open.map((round) => (
          <RoundBoard key={round.id} round={round} />
        ))}
      </div>

      {closed.length > 0 && (
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setShowArchive((v) => !v)}
            className="flex w-full items-center justify-between rounded-2xl bg-white/70 px-4 py-3 text-right backdrop-blur"
          >
            <span className="text-[13px] font-bold text-[#3A3335]">סבבים שהסתיימו ({closed.length})</span>
            <ChevronDown size={18} className={`text-[#8A8285] transition ${showArchive ? "rotate-180" : ""}`} />
          </button>
          {showArchive && (
            <div className="mt-3 space-y-4">
              {closed.map((round) => (
                <RoundBoard key={round.id} round={round} />
              ))}
            </div>
          )}
        </div>
      )}

      {inviteRound && <WhatsappInvite round={inviteRound} onClose={() => setInviteRound(null)} />}
    </div>
  );
}
