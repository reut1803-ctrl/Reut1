"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  FileEdit,
  Eye,
  KeyRound,
  Lightbulb,
  Lock,
  MessageCircle,
  RotateCcw,
  Rocket,
  Settings2,
  Sparkles,
  Tag,
  Trash2,
  Users,
} from "lucide-react";
import { useCrmStore } from "@/lib/crm/store";
import {
  buildThreads,
  extractKeywords,
  isRoundClosed,
  isRoundDraft,
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
import Composer from "@/components/crm/brainstorm/Composer";
import CandidatePeek from "@/components/crm/brainstorm/CandidatePeek";
import { fullDateLine } from "@/lib/crm/hebrewDate";


// לוח הדיון של סבב אחד: השאלה, השעון, ענן מילות המפתח, הכרטיסיות הצפות
// עם הקווים המחברים ביניהן, ותיבת הכתיבה.
function RoundBoard({ round }) {
  const role = useCrmStore((s) => s.role);
  const notes = useCrmStore((s) => s.notesForRound(round.id));
  const closeRound = useCrmStore((s) => s.closeBrainstormRound);
  const reopenRound = useCrmStore((s) => s.reopenBrainstormRound);
  const saveSummary = useCrmStore((s) => s.saveBrainstormSummary);
  const deleteRound = useCrmStore((s) => s.deleteBrainstormRound);
  const showToast = useCrmStore((s) => s.showToast);
  const authAllowlist = useCrmStore((s) => s.authAllowlist);
  const launchRound = useCrmStore((s) => s.launchBrainstormRound);

  // צבע קבוע ושונה לכל איש/אשת צוות, לפי המקום ברשימת ההרשאות
  const roster = useMemo(
    () => authAllowlist.map((e) => String(e.email || e.id || "").toLowerCase()),
    [authAllowlist]
  );
  const paletteOf = (email) => paletteFromRoster(email, roster);

  const [replyTo, setReplyTo] = useState(null);
  const [launching, setLaunching] = useState(false);
  const [launchError, setLaunchError] = useState("");
  const [summaryDraft, setSummaryDraft] = useState(round.summary || "");
  const [savingSummary, setSavingSummary] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [peekId, setPeekId] = useState(null);
  const boardRef = useRef(null);

  const closed = isRoundClosed(round);
  const draft = isRoundDraft(round);
  const isAdmin = role === "admin";
  // התאריך האמיתי שנשמר בסבב, בעברית ובלועזית. סבב שעדיין טיוטה מציג את מועד ההכנה.
  const startedAtLine = fullDateLine(draft ? round.createdAt : round.openedAt || round.createdAt);

  const keywords = useMemo(() => extractKeywords(notes.map((n) => n.text)), [notes]);
  const threads = useMemo(() => buildThreads(notes), [notes]);
  // הקווים המחברים נמתחים רק בין הכרטיסיות הראשיות, כדי שהלוח לא יתמלא בקווים
  const pairs = useMemo(
    () => relatedPairs(threads.map((t) => t.note), keywords),
    [threads, keywords]
  );
  // שמות הצוות, לצורך הדגשת התיוגים בתוך הטקסט
  const mentionNames = useMemo(
    () => authAllowlist.map((e) => e.name).filter(Boolean),
    [authAllowlist]
  );
  const gold = useMemo(() => topLikedIds(notes), [notes]);
  const participants = useMemo(() => {
    const map = new Map();
    notes.forEach((n) => {
      if (!map.has(n.authorEmail)) map.set(n.authorEmail, n.authorName || n.authorEmail);
    });
    return [...map.entries()];
  }, [notes]);

  const handleLaunch = async () => {
    setLaunching(true);
    setLaunchError("");
    try {
      await launchRound(round.id);
      showToast("הסבב שוגר. עכשיו הצוות רואה אותו והשעון התחיל");
      setShowInvite(true);
    } catch (err) {
      setLaunchError(
        err?.code === "permission-denied"
          ? "השרת דחה את השיגור. ייתכן שכללי האבטחה החדשים עוד לא פורסמו."
          : "השיגור נכשל בגלל תקלת תקשורת. נסי שוב בעוד רגע."
      );
    }
    setLaunching(false);
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
          {/* טיוטה עדיין לא "נפתחה", ולכן מוצג תאריך ההכנה שלה.
              ערך חסר מחזיר מחרוזת ריקה - ולא 1.1.1970. */}
          <p className="mt-0.5 text-[10px] leading-relaxed text-[#B5AEB0]">
            {draft ? "הוכן" : "נפתח"} ע״י {round.openedBy}
            {startedAtLine ? ` · ${startedAtLine}` : ""}
          </p>
        </div>
        {round.candidateId && (
          <button
            type="button"
            onClick={() => setPeekId(round.candidateId)}
            className="flex shrink-0 items-center gap-1 rounded-full bg-white/80 px-3 py-1.5 text-[11px] font-semibold text-[#8C4A55] shadow-sm transition active:scale-95"
          >
            <Eye size={13} /> הצצה לכרטיס
          </button>
        )}
      </div>

      <div className="mt-3 rounded-2xl bg-[#FFF8E7]/80 p-3">
        <p className="flex items-center gap-1.5 text-[10px] font-bold text-[#946200]">
          <Sparkles size={12} /> השאלה לסבב
        </p>
        <p className="mt-1 text-[13.5px] font-semibold leading-relaxed text-[#3A3335]">{round.question}</p>
      </div>

      {/* טיוטה: הסבב מוכן אך עדיין לא גלוי לאיש. השעון מתחיל רק בשיגור. */}
      {draft ? (
        <div className="mt-3 rounded-2xl border border-dashed border-[#C98894] bg-white/70 p-3">
          <p className="flex items-center gap-1.5 text-[12px] font-bold text-[#8C4A55]">
            <FileEdit size={14} /> טיוטה - עדיין לא שוגר לצוות
          </p>
          <p className="mt-1 text-[11.5px] leading-relaxed text-[#8A8285]">
            רק את רואה אותו כרגע. שלושת הימים יתחילו מרגע השיגור.
          </p>
          {launchError && (
            <p className="mt-2 rounded-xl bg-[#FBEDED] px-3 py-2 text-[11px] leading-relaxed text-[#C24545]">
              {launchError}
            </p>
          )}
          <button
            type="button"
            onClick={handleLaunch}
            disabled={launching}
            className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-2xl bg-[#8C4A55] py-2.5 text-[13px] font-semibold text-white transition active:scale-[0.98] disabled:opacity-40"
          >
            <Rocket size={15} /> {launching ? "משגרת..." : "שיגור לצוות והתחלת הספירה"}
          </button>
        </div>
      ) : (
        <div className="mt-3">
          <RoundTimer round={round} />
        </div>
      )}

      {/* פס אחד שקט: מי השתתף, ומה חוזר על עצמו בדברי הצוות */}
      {(participants.length > 0 || keywords.length > 0) && (
        <div className="mt-3 space-y-2">
          {participants.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              {participants.map(([email, name]) => (
                <span key={email} className="flex items-center gap-1 text-[10.5px] font-semibold text-[#8A8285]">
                  <span className="h-2 w-2 rounded-full" style={{ background: paletteOf(email).dot }} />
                  {name}
                </span>
              ))}
            </div>
          )}
          {keywords.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <Tag size={12} className="text-[#B5AEB0]" />
              {keywords.map((k) => (
                <span
                  key={k.stem}
                  className="rounded-full bg-[#F6E4E6] px-2.5 py-1 font-bold text-[#6E3540]"
                  style={{ fontSize: `${Math.min(15, 10.5 + k.count * 0.9)}px` }}
                >
                  {k.word}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* הכרטיסיות הצפות, עם הקווים שמחברים בין כיוונים דומים */}
      <div ref={boardRef} className="relative mt-4">
        <MindMapLines containerRef={boardRef} pairs={pairs} />
        {notes.length === 0 ? (
          <p className="rounded-2xl bg-white/60 px-3 py-6 text-center text-[12px] leading-relaxed text-[#8A8285]">
            {draft
              ? "הסבב מוכן. ברגע שתשגרי אותו, הצוות יוכל להתחיל לכתוב כאן."
              : "עוד לא נכתב כאן כלום. הכרטיסייה הראשונה היא תמיד הכי חשובה - היא פותחת את הכיוון לכולם."}
          </p>
        ) : (
          <div className="relative z-10 space-y-3">
            {threads.map(({ note, replies }) => (
              <div key={note.id}>
                <NoteCard
                  note={note}
                  gold={gold.has(note.id)}
                  locked={closed}
                  palette={paletteOf(note.authorEmail)}
                  mentionNames={mentionNames}
                  onReply={closed || draft ? null : setReplyTo}
                />
                {replies.length > 0 && (
                  <div className="mt-2 mr-4 space-y-2 border-r-2 border-[#EAE5E3] pr-3">
                    {replies.map((reply) => (
                      <NoteCard
                        key={reply.id}
                        note={reply}
                        isReply
                        gold={gold.has(reply.id)}
                        locked={closed}
                        palette={paletteOf(reply.authorEmail)}
                        mentionNames={mentionNames}
                        onReply={closed || draft ? null : setReplyTo}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* תיבת הכתיבה */}
      {draft ? null : closed ? (
        <div className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-[#EFEDEB] px-3 py-3 text-[12px] font-semibold text-[#6B6467]">
          <Lock size={14} /> הסבב נעול. אפשר לקרוא הכל, אך לא להוסיף.
        </div>
      ) : (
        <Composer
          roundId={round.id}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          onSent={() => setReplyTo(null)}
        />
      )}

      {/* כלי המנהלת - מקופלים, כדי שהלוח עצמו יישאר נקי לקריאה */}
      {isAdmin && !draft && (
        <div className="mt-4 border-t border-white/70 pt-3">
          <button
            type="button"
            onClick={() => setShowTools((v) => !v)}
            className="flex w-full items-center justify-between text-right"
          >
            <span className="flex items-center gap-1.5 text-[12.5px] font-bold text-[#8C4A55]">
              <Settings2 size={14} /> כלי מנהלת
              {round.summary ? <span className="text-[10px] font-normal text-[#8A8285]">· יש סיכום</span> : null}
            </span>
            <ChevronDown size={17} className={`text-[#8A8285] transition ${showTools ? "rotate-180" : ""}`} />
          </button>

          {showTools && (
            <div className="mt-3 space-y-2.5">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowInvite(true)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-[#20A66B] py-2.5 text-[12px] font-semibold text-white transition active:scale-[0.98]"
                >
                  <MessageCircle size={14} /> תזכורת לצוות
                </button>
                {closed ? (
                  <button
                    type="button"
                    onClick={() => reopenRound(round.id)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-[#EAE5E3] bg-white py-2.5 text-[12px] font-semibold text-[#3A3335] transition active:scale-[0.98]"
                  >
                    <RotateCcw size={14} /> עוד 3 ימים
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => closeRound(round.id)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-[#EAE5E3] bg-white py-2.5 text-[12px] font-semibold text-[#3A3335] transition active:scale-[0.98]"
                  >
                    <Lock size={14} /> סגירה עכשיו
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="flex w-full items-center justify-center gap-1.5 rounded-2xl py-2 text-[11px] font-semibold text-[#C24545]"
              >
                <Trash2 size={13} /> מחיקת הסבב
              </button>
            </div>
          )}
        </div>
      )}

      {/* הסיכום - נשאר גלוי תמיד למנהלת, כי זה הצעד האחרון והחשוב של הסבב */}
      {isAdmin && !draft && (
        <div className="mt-3 rounded-2xl bg-[#FFF8E7]/80 p-3">
          <p className="text-[12.5px] font-bold text-[#946200]">
            {closed ? "השורה התחתונה מהדיון" : "השורה התחתונה מהדיון (אפשר כבר עכשיו)"}
          </p>
          <textarea
            value={summaryDraft}
            onChange={(e) => setSummaryDraft(e.target.value)}
            rows={3}
            placeholder="מה המסקנה? זה יופיע בראש כרטיס המועמד/ת."
            className="mt-2 w-full resize-none rounded-xl border border-[#EAE5E3] bg-white px-3 py-2.5 text-[13px] leading-relaxed outline-none focus:border-[#8C4A55]"
          />
          <button
            type="button"
            onClick={handleSaveSummary}
            disabled={savingSummary || !summaryDraft.trim()}
            className="mt-2 w-full rounded-xl bg-[#8C4A55] py-2 text-[12.5px] font-semibold text-white transition active:scale-[0.98] disabled:opacity-30"
          >
            {savingSummary ? "שומרת..." : "שמירת הסיכום"}
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

      {peekId && <CandidatePeek candidateId={peekId} onClose={() => setPeekId(null)} />}
    </div>
  );
}

export default function BrainstormPage() {
  const role = useCrmStore((s) => s.role);
  const rounds = useCrmStore((s) => s.visibleRounds());
  const markSeen = useCrmStore((s) => s.markBrainstormSeen);

  // מרגע הכניסה לזירה, התיוגים שממתינים נחשבים כנראו והסימון בתפריט מתאפס
  useEffect(() => {
    markSeen();
  }, [markSeen]);

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

      {brainstormError ? (
        <div className="mt-4 rounded-3xl border border-[#F0D3A0] bg-[#FFF8E7] p-4">
          <p className="flex items-center gap-1.5 text-[13.5px] font-bold text-[#946200]">
            <KeyRound size={15} /> נשאר צעד אחד להפעלת הזירה
          </p>
          <p className="mt-2 text-[12px] leading-relaxed text-[#3A3335]">
            הזירה בנויה ומוכנה, אבל מסד הנתונים עדיין לא יודע להכניס אליה אף אחד. זו הרשאה שצריך
            לאשר פעם אחת בלבד בחשבון ה-Firebase, ורק בעלת החשבון יכולה לעשות זאת.
          </p>
          <p className="mt-2 text-[11.5px] leading-relaxed text-[#8A8285]">
            אחרי האישור החד-פעמי הזה הזירה תעבוד לתמיד, ולא נצטרך לחזור לזה שוב. בינתיים כל שאר
            המערכת ממשיכה לעבוד כרגיל.
          </p>
        </div>
      ) : (
        role === "admin" && (
          <div className="mt-4">
            <OpenRoundPanel onOpened={(round) => setInviteRound(round)} />
          </div>
        )
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
