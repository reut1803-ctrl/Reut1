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
  Compass,
  PenLine,
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
  participationOf,
  initialsOf,
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
  const setSecondQuestion = useCrmStore((s) => s.setBrainstormSecondQuestion);

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
  const [editingAngle, setEditingAngle] = useState(false);
  const [angleDraft, setAngleDraft] = useState(round.secondQuestion || "");
  const [savingAngle, setSavingAngle] = useState(false);
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
  // מי מהצוות כבר כתב ומי עדיין לא - כולל מי שטרם נכנס
  const participation = useMemo(() => participationOf(authAllowlist, notes), [authAllowlist, notes]);

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

  const handleSaveAngle = async () => {
    setSavingAngle(true);
    try {
      await setSecondQuestion(round.id, angleDraft);
      setEditingAngle(false);
      showToast("הזווית הנוספת פורסמה לצוות");
    } catch {
      showToast("הפרסום נכשל, נסי שוב");
    }
    setSavingAngle(false);
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
          <p className="text-[11px] font-semibold text-[#C06E5E]">סיעור מוחות על</p>
          <h2 className="truncate text-[18px] font-bold text-[#5A4A3C]">
            {round.candidateName || "מועמד/ת"}
          </h2>
          {/* טיוטה עדיין לא "נפתחה", ולכן מוצג תאריך ההכנה שלה.
              ערך חסר מחזיר מחרוזת ריקה - ולא 1.1.1970. */}
          <p className="mt-0.5 text-[10px] leading-relaxed text-[#C3B5A5]">
            {draft ? "הוכן" : "נפתח"} ע״י {round.openedBy}
            {startedAtLine ? ` · ${startedAtLine}` : ""}
          </p>
        </div>
        {round.candidateId && (
          <button
            type="button"
            onClick={() => setPeekId(round.candidateId)}
            className="flex shrink-0 items-center gap-1 rounded-full bg-white/80 px-3 py-1.5 text-[11px] font-semibold text-[#C06E5E] shadow-sm transition active:scale-95"
          >
            <Eye size={13} /> הצצה לכרטיס
          </button>
        )}
      </div>

      <div className="mt-3 rounded-2xl bg-[#FDF6EC]/80 p-3">
        <p className="flex items-center gap-1.5 text-[10px] font-bold text-[#8A6A32]">
          <Sparkles size={12} /> השאלה לסבב
        </p>
        <p className="mt-1 text-[13.5px] font-semibold leading-relaxed text-[#5A4A3C]">{round.question}</p>
      </div>

      {/* הזווית הנוספת: שאלה רחבה שגם מי שלא מכיר/ה את ההיסטוריה יכול/ה לענות עליה.
          זה מה שמאפשר לכל הצוות להשתתף, ולא רק למי שהיה מעורב בעבר. */}
      {round.secondQuestion && !editingAngle && (
        <div className="mt-2 rounded-2xl border border-[#C3D0B4] bg-[#E6EDDF]/70 p-3">
          <div className="flex items-start justify-between gap-2">
            <p className="flex items-center gap-1.5 text-[10px] font-bold text-[#6F7D5C]">
              <Compass size={12} /> זווית נוספת · פתוח לכולם
            </p>
            {isAdmin && !closed && (
              <button
                type="button"
                onClick={() => {
                  setAngleDraft(round.secondQuestion || "");
                  setEditingAngle(true);
                }}
                aria-label="עריכת הזווית הנוספת"
                className="shrink-0 rounded-full p-1 text-[#6F7D5C] transition hover:bg-white/70"
              >
                <PenLine size={13} />
              </button>
            )}
          </div>
          <p className="mt-1 text-[13.5px] font-semibold leading-relaxed text-[#5A4A3C]">{round.secondQuestion}</p>
          <p className="mt-1.5 text-[10.5px] leading-relaxed text-[#4E7A69]">
            גם מי שלא מכיר/ה את הרקע מוזמן/ת לענות דווקא על זו.
          </p>
        </div>
      )}

      {/* הוספה או עריכה של הזווית הנוספת תוך כדי סבב פעיל */}
      {isAdmin && !closed && (editingAngle || !round.secondQuestion) && (
        <div className="mt-2 rounded-2xl border border-dashed border-[#C3D0B4] bg-white/70 p-3">
          <p className="flex items-center gap-1.5 text-[11.5px] font-bold text-[#6F7D5C]">
            <Compass size={13} /> {round.secondQuestion ? "עריכת הזווית הנוספת" : "הוספת זווית נוספת לצוות"}
          </p>
          {!round.secondQuestion && !editingAngle && (
            <p className="mt-1 text-[11px] leading-relaxed text-[#8C7B6B]">
              שאלה רחבה שכל אחד/ת יכול/ה לענות עליה, גם בלי להכיר את ההיסטוריה.
            </p>
          )}
          <textarea
            value={angleDraft}
            onChange={(e) => setAngleDraft(e.target.value)}
            rows={2}
            placeholder="לאילו כיוונים חדשים כדאי לכוון את החיפוש עכשיו?"
            className="mt-2 w-full resize-none rounded-xl border border-[#EADCCB] bg-white px-3 py-2.5 text-[13px] leading-relaxed outline-none focus:border-[#6F7D5C]"
          />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={handleSaveAngle}
              disabled={savingAngle || !angleDraft.trim()}
              className="flex-1 rounded-xl bg-[#8C9A78] py-2 text-[12.5px] font-semibold text-white transition active:scale-[0.98] disabled:opacity-30"
            >
              {savingAngle ? "שומרת..." : "פרסום הזווית לצוות"}
            </button>
            {editingAngle && (
              <button
                type="button"
                onClick={() => setEditingAngle(false)}
                className="rounded-xl border border-[#EADCCB] bg-white px-3 py-2 text-[12.5px] font-semibold text-[#5A4A3C]"
              >
                ביטול
              </button>
            )}
          </div>
        </div>
      )}

      {/* טיוטה: הסבב מוכן אך עדיין לא גלוי לאיש. השעון מתחיל רק בשיגור. */}
      {draft ? (
        <div className="mt-3 rounded-2xl border border-dashed border-[#E2A396] bg-white/70 p-3">
          <p className="flex items-center gap-1.5 text-[12px] font-bold text-[#C06E5E]">
            <FileEdit size={14} /> טיוטה - עדיין לא שוגר לצוות
          </p>
          <p className="mt-1 text-[11.5px] leading-relaxed text-[#8C7B6B]">
            רק את רואה אותו כרגע. שלושת הימים יתחילו מרגע השיגור.
          </p>
          {launchError && (
            <p className="mt-2 rounded-xl bg-[#FBEDE9] px-3 py-2 text-[11px] leading-relaxed text-[#C4584C]">
              {launchError}
            </p>
          )}
          <button
            type="button"
            onClick={handleLaunch}
            disabled={launching}
            className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-2xl bg-[#C06E5E] py-2.5 text-[13px] font-semibold text-white transition active:scale-[0.98] disabled:opacity-40"
          >
            <Rocket size={15} /> {launching ? "משגרת..." : "שיגור לצוות והתחלת הספירה"}
          </button>
        </div>
      ) : (
        <div className="mt-3">
          <RoundTimer round={round} />
        </div>
      )}

      {/* כפתור בולט לעדכון הצוות. במקום הכי גלוי, כי בלי הודעה אף אחד לא נכנס. */}
      {isAdmin && !draft && (
        <button
          type="button"
          onClick={() => setShowInvite(true)}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#8C9A78] py-3 text-[13.5px] font-bold text-white shadow-[0_8px_20px_rgba(32,166,107,0.25)] transition active:scale-[0.98]"
        >
          <MessageCircle size={17} /> הודע לצוות בוואטסאפ
        </button>
      )}

      {/* חיווי השתתפות: עיגול לכל איש/אשת צוות. צבעוני = כבר כתב/ה, אפור = טרם. */}
      {!draft && participation.total > 0 && (
        <div className="mt-3 rounded-2xl bg-white/60 p-3">
          <p className="mb-2 flex items-center gap-1.5 text-[10.5px] font-bold text-[#8C7B6B]">
            <Users size={12} /> {participation.joinedCount} מתוך {participation.total} כבר השתתפו
          </p>
          <div className="flex flex-wrap gap-2">
            {participation.people.map((person) => {
              const palette = paletteOf(person.email);
              return (
                <span
                  key={person.email}
                  title={`${person.name} - ${person.joined ? "השתתף/ה" : "טרם השתתף/ה"}`}
                  className="flex flex-col items-center gap-0.5"
                >
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-bold transition"
                    style={
                      person.joined
                        ? { background: palette.dot, color: "#fff", boxShadow: `0 0 0 2px ${palette.border}` }
                        : { background: "#F5EDE3", color: "#C3B5A5", border: "1px dashed #D8D2D0" }
                    }
                  >
                    {initialsOf(person.name, person.email)}
                  </span>
                  <span
                    className={`max-w-[52px] truncate text-[9px] ${
                      person.joined ? "font-semibold text-[#5A4A3C]" : "text-[#C3B5A5]"
                    }`}
                  >
                    {person.name.split(/\s+/)[0]}
                  </span>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* מילות המפתח שעולות מהצוות */}
      {keywords.length > 0 && (
        <div className="mt-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <Tag size={12} className="text-[#C3B5A5]" />
            {keywords.map((k) => (
              <span
                key={k.stem}
                className="rounded-full bg-[#F7DFD8] px-2.5 py-1 font-bold text-[#A05243]"
                style={{ fontSize: `${Math.min(15, 10.5 + k.count * 0.9)}px` }}
              >
                {k.word}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* הכרטיסיות הצפות, עם הקווים שמחברים בין כיוונים דומים */}
      <div ref={boardRef} className="relative mt-4">
        <MindMapLines containerRef={boardRef} pairs={pairs} />
        {notes.length === 0 ? (
          <p className="rounded-2xl bg-white/60 px-3 py-6 text-center text-[12px] leading-relaxed text-[#8C7B6B]">
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
                  <div className="mt-2 mr-4 space-y-2 border-r-2 border-[#EADCCB] pr-3">
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
        <div className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-[#F5EDE3] px-3 py-3 text-[12px] font-semibold text-[#8C7B6B]">
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
            <span className="flex items-center gap-1.5 text-[12.5px] font-bold text-[#C06E5E]">
              <Settings2 size={14} /> כלי מנהלת
              {round.summary ? <span className="text-[10px] font-normal text-[#8C7B6B]">· יש סיכום</span> : null}
            </span>
            <ChevronDown size={17} className={`text-[#8C7B6B] transition ${showTools ? "rotate-180" : ""}`} />
          </button>

          {showTools && (
            <div className="mt-3 space-y-2.5">
              <div className="flex gap-2">
                {closed ? (
                  <button
                    type="button"
                    onClick={() => reopenRound(round.id)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-[#EADCCB] bg-white py-2.5 text-[12px] font-semibold text-[#5A4A3C] transition active:scale-[0.98]"
                  >
                    <RotateCcw size={14} /> עוד 3 ימים
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => closeRound(round.id)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-[#EADCCB] bg-white py-2.5 text-[12px] font-semibold text-[#5A4A3C] transition active:scale-[0.98]"
                  >
                    <Lock size={14} /> סגירה עכשיו
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="flex w-full items-center justify-center gap-1.5 rounded-2xl py-2 text-[11px] font-semibold text-[#C4584C]"
              >
                <Trash2 size={13} /> מחיקת הסבב
              </button>
            </div>
          )}
        </div>
      )}

      {/* הסיכום - נשאר גלוי תמיד למנהלת, כי זה הצעד האחרון והחשוב של הסבב */}
      {isAdmin && !draft && (
        <div className="mt-3 rounded-2xl bg-[#FDF6EC]/80 p-3">
          <p className="text-[12.5px] font-bold text-[#8A6A32]">
            {closed ? "השורה התחתונה מהדיון" : "השורה התחתונה מהדיון (אפשר כבר עכשיו)"}
          </p>
          <textarea
            value={summaryDraft}
            onChange={(e) => setSummaryDraft(e.target.value)}
            rows={3}
            placeholder="מה המסקנה? זה יופיע בראש כרטיס המועמד/ת."
            className="mt-2 w-full resize-none rounded-xl border border-[#EADCCB] bg-white px-3 py-2.5 text-[13px] leading-relaxed outline-none focus:border-[#C06E5E]"
          />
          <button
            type="button"
            onClick={handleSaveSummary}
            disabled={savingSummary || !summaryDraft.trim()}
            className="mt-2 w-full rounded-xl bg-[#C06E5E] py-2 text-[12.5px] font-semibold text-white transition active:scale-[0.98] disabled:opacity-30"
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
    return <p className="px-4 py-10 text-center text-sm text-[#8C7B6B]">אזור זה זמין לצוות בלבד</p>;
  }

  const open = rounds.filter((r) => !isRoundClosed(r));
  const closed = rounds.filter((r) => isRoundClosed(r));

  return (
    <div className="relative min-h-full px-4 py-6">
      {/* רקע פסטלי רך שנותן לכרטיסיות את תחושת הריחוף */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -right-16 top-10 h-56 w-56 rounded-full bg-[#F7DFD8] blur-3xl opacity-70" />
        <div className="absolute -left-20 top-56 h-64 w-64 rounded-full bg-[#E6EDDF] blur-3xl opacity-70" />
        <div className="absolute right-6 bottom-24 h-52 w-52 rounded-full bg-[#E8E9F6] blur-3xl opacity-70" />
      </div>

      <h1 className="flex items-center gap-2 text-xl font-bold text-[#5A4A3C]">
        <Lightbulb size={22} className="text-[#C06E5E]" /> זירת סיעור המוחות
      </h1>
      <p className="mt-1 text-[13px] leading-relaxed text-[#8C7B6B]">
        מרחב אחד לחשוב יחד על מועמד/ת אחד/ת, שלושה ימים, שאלה אחת עמוקה.
      </p>

      {brainstormError ? (
        <div className="mt-4 rounded-3xl border border-[#EFC9A8] bg-[#FDF6EC] p-4">
          <p className="flex items-center gap-1.5 text-[13.5px] font-bold text-[#8A6A32]">
            <KeyRound size={15} /> נשאר צעד אחד להפעלת הזירה
          </p>
          <p className="mt-2 text-[12px] leading-relaxed text-[#5A4A3C]">
            הזירה בנויה ומוכנה, אבל מסד הנתונים עדיין לא יודע להכניס אליה אף אחד. זו הרשאה שצריך
            לאשר פעם אחת בלבד בחשבון ה-Firebase, ורק בעלת החשבון יכולה לעשות זאת.
          </p>
          <p className="mt-2 text-[11.5px] leading-relaxed text-[#8C7B6B]">
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
          <p className="rounded-3xl bg-white/60 px-4 py-8 text-center text-[13px] leading-relaxed text-[#8C7B6B] backdrop-blur">
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
            <span className="text-[13px] font-bold text-[#5A4A3C]">סבבים שהסתיימו ({closed.length})</span>
            <ChevronDown size={18} className={`text-[#8C7B6B] transition ${showArchive ? "rotate-180" : ""}`} />
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
