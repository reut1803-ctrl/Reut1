"use client";

// עוזר ההתאמות - רכיב תוספת, גלוי למנהלת המערכת בלבד.
//
// קריאה בלבד: הרכיב לא כותב שום דבר למסד הנתונים. הוא בונה מהכרטיסים
// שכבר טעונים אצל המנהלת רשימה אנונימית (ראו lib/crm/aiAnonymize.js),
// שולח אותה לנתיב השרת /api/ai-match, ומציג את התשובה.
// ההכרעות היומיות נשמרות בדפדפן של המנהלת בלבד (localStorage), עד מחר.
// גם הערות הדיוק של המנהלת נשמרות שם בלבד (ראו lib/crm/aiFeedback.js).

import { Component, useEffect, useMemo, useRef, useState } from "react";
import {
  Sparkles,
  RefreshCw,
  MessageCircle,
  Send,
  ChevronDown,
  AlertTriangle,
  HelpCircle,
  Quote,
  Eye,
  PenLine,
  Trash2,
} from "lucide-react";
import { useCrmStore, PROPOSAL_DROPPED, OWNER_EMAIL } from "@/lib/crm/store";
import { crmAuth } from "@/lib/crm/firebaseClient";
import { anonymizePool, validateDecisions } from "@/lib/crm/aiAnonymize";
import { readFeedback, addFeedback, removeFeedback, feedbackForPrompt, FEEDBACK_MAX_CHARS } from "@/lib/crm/aiFeedback";
import ProfileDetailModal from "@/components/crm/profiles/ProfileDetailModal";
import WhatsAppImporter from "@/components/crm/matches/WhatsAppImporter";
import VibeScanner from "@/components/crm/matches/VibeScanner";
import { readVibes, vibeFor } from "@/lib/crm/aiVibe";

// מעטפת בטיחות מקומית: אם חלונית הצפייה נכשלת, היא פשוט נסגרת -
// בלי להפיל את ההכרעות ואת שאר המסך.
class SafeBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error) {
    console.error("עוזר ההתאמות - חלונית נכשלה:", error);
    this.props.onError?.();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

const CACHE_PREFIX = "aiMatchPicks:v2";

const readCache = (key) => {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
const writeCache = (key, value) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* דפדפן שחוסם אחסון - פשוט לא נשמר עד מחר */
  }
};

// פנייה לנתיב השרת עם אסימון הכניסה של המנהלת.
// ניסיון חוזר אחד בלבד, ורק כשהשירות עמוס או לא ענה בזמן.
async function callAdvisor(payload) {
  const user = crmAuth.currentUser;
  if (!user) throw new Error("נדרשת התחברות מחדש");
  const attempt = async () => {
    const idToken = await user.getIdToken();
    const res = await fetch("/api/ai-match/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, idToken }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) {
      const err = new Error(data?.error || `שגיאה בעוזר ההתאמות (${res.status})`);
      err.status = res.status;
      throw err;
    }
    return data;
  };
  try {
    return await attempt();
  } catch (err) {
    if (err.status === 429 || err.status === 504) {
      await new Promise((r) => setTimeout(r, 2500));
      return attempt();
    }
    throw err;
  }
}

export default function AiMatchAdvisor() {
  const googleUser = useCrmStore((s) => s.googleUser);
  const board = useCrmStore((s) => s.board);
  const allCandidates = useCrmStore((s) => s.allCandidates);
  const candidates_ = useCrmStore((s) => s.candidates);
  const candidateStatus = useCrmStore((s) => s.candidateStatus);
  const candidatesLoaded = useCrmStore((s) => s.candidatesLoaded);
  const proposals = useCrmStore((s) => s.proposals);
  const serverOffsetMs = useCrmStore((s) => s.serverOffsetMs);

  const isOwner = String(googleUser?.email || "").trim().toLowerCase() === OWNER_EMAIL;

  const everyone = useMemo(
    () => [...allCandidates("male"), ...allCandidates("female")],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allCandidates, candidates_, candidateStatus]
  );
  const byId = useMemo(() => new Map(everyone.map((c) => [c.id, c])), [everyone]);
  const anon = useMemo(
    () => anonymizePool(everyone, proposals, { droppedStatus: PROPOSAL_DROPPED }),
    [everyone, proposals]
  );

  // וייב חזותי שנסרק מתמונות הפרופיל (נשמר בדפדפן בלבד) מצורף לכל מועמד/ת
  // ברשימה האנונימית. מי שלא נסרק/ה - נשלח/ת בדיוק כמו קודם.
  const [vibes, setVibes] = useState({});
  useEffect(() => {
    setVibes(readVibes());
  }, []);
  const pool = useMemo(
    () =>
      anon.pool.map((p) => {
        const v = vibeFor(vibes, byId.get(anon.codeToId[p.code]));
        return v ? { ...p, visual: v } : p;
      }),
    [anon, vibes, byId]
  );
  const anonWithVibe = useMemo(() => ({ ...anon, pool }), [anon, pool]);

  // שם פרטי בלבד, גם בתצוגה
  const firstName = (id) => String(byId.get(id)?.name || "").trim().split(/\s+/)[0] || "?";
  const withNames = (text) =>
    String(text || "").replace(/\b([MF]\d{2,3})\b/g, (code) => {
      const id = anon.codeToId[code];
      return id ? firstName(id) : code;
    });

  // --- 3 הכרעות שיא ---
  // "היום" לפי שעון ישראל, כדי שההכרעות מתחלפות בחצות ולא בשתיים בלילה
  const today = new Date(Date.now() + (serverOffsetMs || 0)).toLocaleDateString("en-CA", { timeZone: "Asia/Jerusalem" });
  const cacheKey = `${CACHE_PREFIX}:${today}:${board}`;
  const [picks, setPicks] = useState(null);
  const [picksLoading, setPicksLoading] = useState(false);
  const [picksError, setPicksError] = useState("");
  const attempted = useRef(new Set());

  // --- הערות לדיוק הבינה ---
  const [feedback, setFeedback] = useState([]);
  const [noteFor, setNoteFor] = useState(null); // מזהה המועמד/ת שבכרטיס שלה פתוח שדה הערה
  const [noteDraft, setNoteDraft] = useState("");
  const [noteError, setNoteError] = useState("");
  const [notesOpen, setNotesOpen] = useState(false);
  useEffect(() => {
    setFeedback(readFeedback());
  }, []);
  // מנגנון הגנה: אם הזיכרון לא נטען או פגום - שולחים בלעדיו, וההכרעות
  // והשיחה עובדות בדיוק כמו קודם
  const promptFeedback = () => {
    try {
      return feedbackForPrompt(feedback, { byId, idToCode: anon.idToCode, everyone });
    } catch {
      return [];
    }
  };
  const [generalDraft, setGeneralDraft] = useState("");
  const saveGeneralNote = () => {
    const next = addFeedback({ text: generalDraft });
    if (!next) {
      setNoteError("הדפדפן חסם את השמירה. ההערה לא נשמרה.");
      return;
    }
    setFeedback(next);
    setGeneralDraft("");
    setNoteError("");
  };

  const saveNote = (d) => {
    const next = addFeedback({
      text: noteDraft,
      candidateId: d.candidateId,
      optionAId: d.optionAId,
      optionBId: d.optionBId,
      winnerId: d.winnerId,
    });
    if (!next) {
      setNoteError("הדפדפן חסם את השמירה. ההערה לא נשמרה.");
      return;
    }
    setFeedback(next);
    setNoteFor(null);
    setNoteDraft("");
    setNoteError("");
  };
  const deleteNote = (id) => {
    const next = removeFeedback(id);
    if (next) setFeedback(next);
  };

  // --- צפייה מהירה בכרטיס, בלי לצאת מהמסך ---
  const [viewId, setViewId] = useState(null);

  const runPicks = async () => {
    if (picksLoading) return;
    setPicksLoading(true);
    setPicksError("");
    try {
      const data = await callAdvisor({
        mode: "picks",
        focusGender: board,
        pool,
        forbiddenPairs: anon.forbiddenPairs,
        feedback: promptFeedback(),
      });
      // בדיקה שאינה סומכת על הבינה, ואז המרה למזהי הכרטיסים האמיתיים
      const valid = validateDecisions(data.decisions, anon).map((d) => ({
        candidateId: anon.codeToId[d.candidate],
        optionAId: anon.codeToId[d.optionA],
        optionBId: anon.codeToId[d.optionB],
        winnerId: anon.codeToId[d.winner],
        religiousFit: withNames(d.religiousFit),
        emotionalFit: withNames(d.emotionalFit),
        whyNotOther: withNames(d.whyNotOther),
        blindSpot: withNames(d.blindSpot),
        questionToCheck: withNames(d.questionToCheck),
        evidence: withNames(d.evidence),
      }));
      const result = { decisions: valid, note: withNames(data.note), at: Date.now() };
      setPicks(result);
      // תוצאה ריקה לא נשמרת ליום כולו - בכניסה הבאה מנסים שוב
      if (valid.length > 0) writeCache(cacheKey, result);
    } catch (err) {
      setPicksError(err?.message || "משהו השתבש");
    } finally {
      setPicksLoading(false);
    }
  };

  // פעם ביום לכל מאגר: אם אין הכרעות שמורות מהיום - מפיקים אוטומטית
  useEffect(() => {
    if (!isOwner || !candidatesLoaded) return;
    const cached = readCache(cacheKey);
    if (cached) {
      setPicks(cached);
      setPicksError("");
      return;
    }
    setPicks(null);
    if (attempted.current.has(cacheKey) || anon.pool.length === 0) return;
    attempted.current.add(cacheKey);
    runPicks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwner, candidatesLoaded, cacheKey]);

  // הכרעה שאחד הצדדים בה כבר אינו פנוי (נכנס לתהליך, שינה סטטוס) - יורדת מהמסך
  const eligibleIds = useMemo(() => new Set(Object.values(anon.codeToId)), [anon]);
  const shownPicks = (picks?.decisions || []).filter(
    (d) => eligibleIds.has(d.candidateId) && eligibleIds.has(d.optionAId) && eligibleIds.has(d.optionBId)
  );

  // --- שותף חשיבה ---
  const [chatOpen, setChatOpen] = useState(false);
  const [chat, setChat] = useState([]);
  const [draft, setDraft] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState("");
  const chatEnd = useRef(null);

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ block: "nearest" });
  }, [chat, chatLoading]);

  const sendChat = async () => {
    const text = draft.trim();
    if (!text || chatLoading) return;
    const next = [...chat, { role: "user", content: text }];
    setChat(next);
    setDraft("");
    setChatLoading(true);
    setChatError("");
    try {
      const data = await callAdvisor({
        mode: "chat",
        pool,
        forbiddenPairs: anon.forbiddenPairs,
        feedback: promptFeedback(),
        messages: next,
      });
      setChat([...next, { role: "assistant", content: data.reply || "" }]);
    } catch (err) {
      setChatError(err?.message || "משהו השתבש");
      setChat(chat);
      setDraft(text);
    } finally {
      setChatLoading(false);
    }
  };

  if (!isOwner) return null;

  const person = (id) => {
    const c = byId.get(id);
    if (!c) return "?";
    return [firstName(id), c.age, c.tag].filter(Boolean).join(" · ");
  };
  // בכותרת: שם מלא ויישוב, כדי שיהיה ברור מיד במי מדובר. המסך גלוי למנהלת
  // בלבד, והשם המלא לעולם אינו נשלח לבינה.
  const personFull = (id) => {
    const c = byId.get(id);
    if (!c) return "?";
    return [String(c.name || "").trim() || firstName(id), c.age, c.tag, c.city].filter(Boolean).join(" · ");
  };
  const eyeButton = (id, size = 15) => (
    <button
      type="button"
      onClick={() => setViewId(id)}
      aria-label={`צפייה בכרטיס של ${firstName(id)}`}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F6E4E6] text-[#8C4A55] transition active:scale-95"
    >
      <Eye size={size} />
    </button>
  );
  const viewed = viewId ? byId.get(viewId) : null;
  const nameOf = (id) => firstName(id);

  return (
    <div className="mt-4 space-y-3">
      {/* ---------- 3 הכרעות שיא ---------- */}
      <div className="rounded-3xl bg-gradient-to-l from-[#8C4A55] to-[#6E3540] p-5 text-white shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-lg font-bold">
              <Sparkles size={20} /> 3 הכרעות שיא להיום
            </p>
            <p className="mt-1 text-[12.5px] text-white/80">
              {board === "female" ? "בחורות" : "בחורים"} במוקד · {anon.pool.length} פנויים במאגר · גלוי לך בלבד
            </p>
          </div>
          <button
            type="button"
            onClick={runPicks}
            disabled={picksLoading || anon.pool.length === 0}
            aria-label="הפקה מחדש"
            className="flex shrink-0 items-center gap-1.5 rounded-2xl bg-white/15 px-3 py-2 text-[12px] font-semibold transition hover:bg-white/25 disabled:opacity-50"
          >
            <RefreshCw size={14} className={picksLoading ? "animate-spin" : ""} /> רענון
          </button>
        </div>
      </div>

      {picksLoading && (
        <div className="rounded-3xl border border-[#EAE5E3] bg-white p-5 text-center text-[13px] text-[#8A8285]">
          קורא/ת את המאגר ומכריע/ה... זה לוקח עד דקה.
        </div>
      )}

      {picksError && !picksLoading && (
        <div className="rounded-3xl border border-[#F2C0B4] bg-[#FBEDED] p-4 text-[12.5px] leading-relaxed text-[#C24545]">
          <p className="flex items-center gap-1.5 font-semibold">
            <AlertTriangle size={14} /> {picksError}
          </p>
          <button type="button" onClick={runPicks} className="mt-2 font-semibold underline underline-offset-2">
            ניסיון נוסף
          </button>
        </div>
      )}

      {!picksLoading && picks && shownPicks.length === 0 && !picksError && (
        <div className="rounded-3xl border border-[#EAE5E3] bg-white p-5 text-center text-[13px] leading-relaxed text-[#8A8285]">
          היום אין הכרעה שעומדת ברף. {picks.note}
        </div>
      )}

      {!picksLoading &&
        shownPicks.map((d) => {
          const loserId = d.winnerId === d.optionAId ? d.optionBId : d.optionAId;
          return (
            <div
              key={d.candidateId}
              className="rounded-3xl border border-[#EAE5E3] bg-white p-4 shadow-[0_4px_18px_rgba(58,51,53,0.06)]"
            >
              <div className="flex items-center gap-2">
                {eyeButton(d.candidateId, 16)}
                <p className="text-[15px] font-bold leading-snug text-[#3A3335]">{personFull(d.candidateId)}</p>
              </div>

              <div className="mt-2 grid grid-cols-2 gap-2">
                {[d.winnerId, loserId].map((id) => {
                  const won = id === d.winnerId;
                  // הכיתוב מותאם למגדר של האפשרות: בחור "מנצח", בחורה "מנצחת"
                  const male = byId.get(id)?.gender === "male";
                  const label = won ? (male ? "מנצח" : "מנצחת") : male ? "פחות מתאים" : "פחות מתאימה";
                  return (
                    <div
                      key={id}
                      className={`rounded-2xl border p-2.5 text-center ${
                        won ? "border-[#20A66B] bg-[#E9F6EF]" : "border-[#EAE5E3] bg-[#F6F5F4]"
                      }`}
                    >
                      <p className={`text-[10px] font-bold ${won ? "text-[#178A57]" : "text-[#B5AEB0]"}`}>
                        {label}
                      </p>
                      <p className="mt-0.5 text-[13px] font-semibold text-[#3A3335]">{person(id)}</p>
                      <button
                        type="button"
                        onClick={() => setViewId(id)}
                        className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-[#8C4A55]"
                      >
                        <Eye size={13} /> צפייה
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 space-y-2 text-[12.5px] leading-relaxed text-[#3A3335]">
                <p>
                  <span className="font-bold text-[#8C4A55]">ראש דתי: </span>
                  {d.religiousFit}
                </p>
                <p>
                  <span className="font-bold text-[#8C4A55]">השלמה רגשית: </span>
                  {d.emotionalFit}
                </p>
                <p className="text-[#8A8285]">
                  <span className="font-semibold">למה לא {firstName(loserId)}: </span>
                  {d.whyNotOther}
                </p>
              </div>

              <div className="mt-3 rounded-2xl border border-[#F0D3A0] bg-[#FFF8E7] p-3 text-[12px] leading-relaxed text-[#3A3335]">
                <p className="flex items-center gap-1 font-bold text-[#946200]">
                  <AlertTriangle size={12} /> נקודה עיוורת לבדיקה
                </p>
                <p className="mt-0.5">{d.blindSpot}</p>
                <p className="mt-2 flex items-center gap-1 font-bold text-[#946200]">
                  <HelpCircle size={12} /> שאלה לבירור
                </p>
                <p className="mt-0.5">{d.questionToCheck}</p>
              </div>

              {d.evidence && (
                <p className="mt-2 flex gap-1.5 text-[11px] italic leading-relaxed text-[#8A8285]">
                  <Quote size={11} className="mt-0.5 shrink-0" /> {d.evidence}
                </p>
              )}

              {/* ---------- הערה לדיוק הבינה ---------- */}
              <div className="mt-3 border-t border-[#EAE5E3] pt-2.5">
                {feedback
                  .filter((n) => n.candidateId === d.candidateId)
                  .map((n) => (
                    <div key={n.id} className="mb-1.5 flex items-start gap-2 rounded-xl bg-[#F6F5F4] px-2.5 py-2 text-[11.5px] leading-relaxed text-[#3A3335]">
                      <PenLine size={12} className="mt-0.5 shrink-0 text-[#8C4A55]" />
                      <span className="flex-1 whitespace-pre-wrap">{n.text}</span>
                      <button type="button" onClick={() => deleteNote(n.id)} aria-label="מחיקת ההערה" className="shrink-0 text-[#B5AEB0]">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                {noteFor === d.candidateId ? (
                  <div>
                    <textarea
                      value={noteDraft}
                      onChange={(e) => setNoteDraft(e.target.value.slice(0, FEEDBACK_MAX_CHARS))}
                      rows={2}
                      autoFocus
                      placeholder="למשל: היא פתוחה מדי בשבילו"
                      className="w-full resize-none rounded-2xl border border-[#EAE5E3] bg-white px-3 py-2 text-[12.5px] outline-none focus:border-[#8C4A55]"
                    />
                    {noteError && <p className="mt-1 text-[11px] text-[#C24545]">{noteError}</p>}
                    <div className="mt-1.5 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => saveNote(d)}
                        disabled={!noteDraft.trim()}
                        className="rounded-xl bg-[#8C4A55] px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-40"
                      >
                        שמירה
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNoteFor(null);
                          setNoteDraft("");
                          setNoteError("");
                        }}
                        className="text-[12px] font-semibold text-[#8A8285]"
                      >
                        ביטול
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setNoteFor(d.candidateId);
                      setNoteDraft("");
                      setNoteError("");
                    }}
                    className="flex items-center gap-1 text-[11.5px] font-semibold text-[#8C4A55]"
                  >
                    <PenLine size={12} /> הערה לדיוק ה-AI
                  </button>
                )}
              </div>
            </div>
          );
        })}

      {/* ---------- וייב חזותי מהתמונות (בתוך מעטפת בטיחות) ---------- */}
      <SafeBoundary>
        <VibeScanner
          candidates={Object.values(anon.codeToId).map((id) => byId.get(id)).filter(Boolean)}
          vibes={vibes}
          onVibes={setVibes}
        />
      </SafeBoundary>

      {/* ---------- ניתוח מהיר מקבוצת וואטסאפ (בתוך מעטפת בטיחות) ---------- */}
      <SafeBoundary>
        <WhatsAppImporter
          anon={anonWithVibe}
          byId={byId}
          nowMs={() => Date.now() + (serverOffsetMs || 0)}
          getFeedback={promptFeedback}
          onView={setViewId}
        />
      </SafeBoundary>

      {/* ---------- זיכרון השדכנית: כל ההערות שנשמרו בצד ---------- */}
      <div className="rounded-3xl border border-[#EAE5E3] bg-white shadow-[0_4px_18px_rgba(58,51,53,0.06)]">
        <button
          type="button"
          onClick={() => setNotesOpen((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-3.5"
        >
          <span className="flex items-center gap-2 text-[14px] font-bold text-[#3A3335]">
            <PenLine size={16} className="text-[#8C4A55]" /> הזיכרון שלי לבינה ({feedback.length})
          </span>
          <ChevronDown size={16} className={`text-[#8A8285] transition ${notesOpen ? "rotate-180" : ""}`} />
        </button>
        {notesOpen && (
          <div className="space-y-1.5 border-t border-[#EAE5E3] px-4 pb-4 pt-3">
            <p className="text-[11px] leading-relaxed text-[#8A8285]">
              נשמרים בצד, במכשיר הזה בלבד, ולא בכרטיסים. 25 האחרונים נשלחים לבינה בכל פנייה.
            </p>
            <div className="flex items-end gap-2">
              <textarea
                value={generalDraft}
                onChange={(e) => setGeneralDraft(e.target.value.slice(0, FEEDBACK_MAX_CHARS))}
                rows={2}
                placeholder='למשל: רונן רוצה עד גיל 36'
                className="min-h-[44px] flex-1 resize-none rounded-2xl border border-[#EAE5E3] bg-white px-3 py-2 text-[12.5px] outline-none focus:border-[#8C4A55]"
              />
              <button
                type="button"
                onClick={saveGeneralNote}
                disabled={!generalDraft.trim()}
                className="h-11 shrink-0 rounded-2xl bg-[#8C4A55] px-3 text-[12px] font-semibold text-white disabled:opacity-40"
              >
                שמירה
              </button>
            </div>
            {noteError && noteFor === null && <p className="text-[11px] text-[#C24545]">{noteError}</p>}
            {[...feedback].reverse().map((n) => (
              <div key={n.id} className="flex items-start gap-2 rounded-xl bg-[#F6F5F4] px-2.5 py-2 text-[11.5px] leading-relaxed text-[#3A3335]">
                <span className="flex-1">
                  {n.candidateId && byId.get(n.candidateId) && (
                    <span className="font-semibold text-[#8C4A55]">{nameOf(n.candidateId)}: </span>
                  )}
                  <span className="whitespace-pre-wrap">{n.text}</span>
                </span>
                <button type="button" onClick={() => deleteNote(n.id)} aria-label="מחיקת ההערה" className="shrink-0 text-[#B5AEB0]">
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ---------- שותף חשיבה ---------- */}
      <div className="rounded-3xl border border-[#EAE5E3] bg-white shadow-[0_4px_18px_rgba(58,51,53,0.06)]">
        <button
          type="button"
          onClick={() => setChatOpen((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-3.5"
        >
          <span className="flex items-center gap-2 text-[14px] font-bold text-[#3A3335]">
            <MessageCircle size={16} className="text-[#8C4A55]" /> שותף חשיבה
          </span>
          <ChevronDown size={16} className={`text-[#8A8285] transition ${chatOpen ? "rotate-180" : ""}`} />
        </button>

        {chatOpen && (
          <div className="border-t border-[#EAE5E3] px-4 pb-4 pt-3">
            <div className="max-h-80 space-y-2 overflow-y-auto">
              {chat.length === 0 && (
                <p className="text-[12px] leading-relaxed text-[#8A8285]">
                  אפשר לשאול על המאגר, למשל: &quot;למי הכי מתאימה בחורה שקטה ועמוקה מירושלים?&quot;
                </p>
              )}
              {chat.map((m, i) => (
                <div
                  key={i}
                  className={`whitespace-pre-wrap rounded-2xl px-3 py-2 text-[12.5px] leading-relaxed ${
                    m.role === "user" ? "mr-8 bg-[#F6E4E6] text-[#3A3335]" : "ml-8 bg-[#F6F5F4] text-[#3A3335]"
                  }`}
                >
                  {m.role === "assistant" ? withNames(m.content) : m.content}
                </div>
              ))}
              {chatLoading && <p className="text-[12px] text-[#8A8285]">חושב/ת...</p>}
              <div ref={chatEnd} />
            </div>

            {chatError && <p className="mt-2 text-[12px] text-[#C24545]">{chatError}</p>}

            <div className="mt-3 flex items-end gap-2">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendChat();
                  }
                }}
                rows={2}
                placeholder="שאלה על המאגר..."
                className="min-h-[44px] flex-1 resize-none rounded-2xl border border-[#EAE5E3] bg-white px-3 py-2.5 text-[13px] outline-none focus:border-[#8C4A55]"
              />
              <button
                type="button"
                onClick={sendChat}
                disabled={!draft.trim() || chatLoading}
                aria-label="שליחה"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#8C4A55] text-white transition active:scale-95 disabled:opacity-40"
              >
                <Send size={16} />
              </button>
            </div>
            {chat.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setChat([]);
                  setChatError("");
                }}
                className="mt-2 text-[11px] font-semibold text-[#8A8285] underline underline-offset-2"
              >
                שיחה חדשה
              </button>
            )}
          </div>
        )}
      </div>

      {/* ---------- צפייה מהירה: אותו כרטיס מלא שמוצג במאגר ---------- */}
      {viewed && (
        <SafeBoundary key={viewId} onError={() => setViewId(null)}>
          <ProfileDetailModal candidate={viewed} onClose={() => setViewId(null)} />
        </SafeBoundary>
      )}
    </div>
  );
}
