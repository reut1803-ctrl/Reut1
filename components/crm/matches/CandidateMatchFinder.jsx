"use client";

// "מצא/י התאמה" למועמד/ת אחד/ת - חלונית שנפתחת מכרטיס המועמד/ת (למנהלת בלבד).
//
// שני שלבים:
//   1. משפך בקוד, בלי בינה (lib/crm/aiShortlist.js): מי בכלל רלוונטי, ומי
//      הכי קרוב - עד 6. מוצג מיד, כולל כמה נפסלו ולמה.
//   2. הסוכן השופט (/api/ai-match/judge): הבינה נותנת לכל אפשרות "פסק דין"
//      לכל ציר, והציון מחושב בקוד (lib/crm/judgeScore.js). מידע חסר אינו
//      מוריד ציון - הוא מסומן "לא ידוע" וההכרעה עוברת לשדכנית.
// קריאה בלבד: לא נכתב שום דבר למסד הנתונים. המידע שנשלח אנונימי, כמו
// בעוזר ההתאמות - קוד ושם פרטי בלבד, וכרטיס חסוי לא נשלח לעולם.

import { Component, useEffect, useMemo, useState } from "react";
import { X, Sparkles, Eye, Filter, AlertTriangle, HelpCircle, ChevronDown } from "lucide-react";
import { useCrmStore, PROPOSAL_DROPPED } from "@/lib/crm/store";
import { crmAuth } from "@/lib/crm/firebaseClient";
import { anonymizePool } from "@/lib/crm/aiAnonymize";
import { buildShortlist, serviceSignal } from "@/lib/crm/aiShortlist";
import { readVibes, vibeFor } from "@/lib/crm/aiVibe";
import { readFeedback, feedbackForPrompt } from "@/lib/crm/aiFeedback";
import { useOutlookProfiles } from "@/lib/crm/outlookStore";
import { effectiveOutlook } from "@/lib/crm/outlook";
import { hashInput, readFinderCache, writeFinderCache } from "@/lib/crm/aiCache";
import { recordAiUsage, isDailyQuotaError, useAiUsage } from "@/lib/crm/aiUsage";
import { useBackToClose } from "@/lib/crm/useBackToClose";
import { AXES, AXIS_KEYS } from "@/lib/crm/judgeScore";
import ProfileDetailModal from "@/components/crm/profiles/ProfileDetailModal";

class SafeBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error) {
    console.error("מצא/י התאמה - חלונית נכשלה:", error);
    this.props.onError?.();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

// גרסת התוצאה השמורה. תוצאה מגרסה קודמת (לפני השופט) נחשבת "ישנה".
const RESULT_VERSION = "judge-v1";

async function callJudge(payload) {
  const user = crmAuth.currentUser;
  if (!user) throw new Error("נדרשת התחברות מחדש");
  const idToken = await user.getIdToken();
  const res = await fetch("/api/ai-match/judge/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, idToken }),
  });
  const data = await res.json().catch(() => null);
  // מד השימוש היומי: כל פנייה נספרת (כמה פניות נשלחו בפועל, כולל מעבר בין מודלים)
  recordAiUsage(data?.attempts ?? 1, { exhausted: !res.ok && isDailyQuotaError(data?.error) });
  if (!res.ok || !data?.ok) {
    const err = new Error(data?.error || `שגיאה בחיפוש ההתאמה (${res.status})`);
    err.canUseLite = !!data?.canUseLite;
    throw err;
  }
  return data;
}

const VERDICT_STYLE = {
  מתאים: "bg-[#E9F6EF] text-[#178A57]",
  "פער קל": "bg-[#FFF8E7] text-[#946200]",
  "פער מהותי": "bg-[#FBEDED] text-[#C24545]",
  "לא ידוע": "bg-[#F6F5F4] text-[#B5AEB0]",
};

const STATUS_STYLE = {
  מומלץ: "bg-[#E9F6EF] text-[#178A57]",
  "פחות מתאים": "bg-[#F6F5F4] text-[#8A8285]",
  "חסר מידע": "bg-[#EEF2FB] text-[#3C5AA6]",
  "פער מהותי": "bg-[#FBEDED] text-[#C24545]",
  "נפסל בתנאי סף": "bg-[#FBEDED] text-[#C24545]",
};

export default function CandidateMatchFinder({ candidateId, onClose }) {
  useBackToClose(true, onClose);
  const allCandidates = useCrmStore((s) => s.allCandidates);
  const candidates_ = useCrmStore((s) => s.candidates);
  const candidateStatus = useCrmStore((s) => s.candidateStatus);
  const proposals = useCrmStore((s) => s.proposals);

  const everyone = useMemo(
    () => [...allCandidates("male"), ...allCandidates("female")],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allCandidates, candidates_, candidateStatus]
  );
  const byId = useMemo(() => new Map(everyone.map((c) => [c.id, c])), [everyone]);
  const anon = useMemo(() => anonymizePool(everyone, proposals, { droppedStatus: PROPOSAL_DROPPED }), [everyone, proposals]);
  // הרשימה האנונימית, עם הוייב החזותי (אם נסרק), סימן השירות ופרופיל ההשקפה (אם חולץ)
  const { profiles } = useOutlookProfiles(true);
  const pool = useMemo(() => {
    const vibes = readVibes();
    return anon.pool.map((p) => {
      const id = anon.codeToId[p.code];
      const v = vibeFor(vibes, byId.get(id));
      const o = effectiveOutlook(profiles[id]);
      return { ...p, ...(v ? { visual: v } : {}), ...(o ? { outlook: o } : {}), service: serviceSignal(p) };
    });
  }, [anon, byId, profiles]);

  const me = byId.get(candidateId);
  const focusCode = anon.idToCode[candidateId];
  const funnel = useMemo(() => buildShortlist(pool, anon.forbiddenPairs, focusCode), [pool, anon, focusCode]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [canUseLite, setCanUseLite] = useState(false);
  const [result, setResult] = useState(null);
  const [viewId, setViewId] = useState(null);
  const [showOthers, setShowOthers] = useState(false);

  const firstName = (id) => String(byId.get(id)?.name || "").trim().split(/\s+/)[0] || "?";
  const withNames = (text) =>
    String(text || "").replace(/\b([MF]\d{2,3})\b/g, (code) => {
      const id = anon.codeToId[code];
      return id ? firstName(id) : code;
    });
  // הזיכרון של השדכנית, בצורה שנשלחת לבינה
  const feedbackNow = () => {
    try {
      return feedbackForPrompt(readFeedback(), { byId, idToCode: anon.idToCode, everyone });
    } catch {
      return [];
    }
  };

  // חתימת הקלט: לפי מזהי הכרטיסים ולא לפי הקודים האנונימיים (שמשתנים כשהמאגר משתנה)
  const signature = useMemo(() => {
    if (!funnel.focus) return "";
    const strip = (p) => {
      const { code, ...rest } = p;
      return { ...rest, id: anon.codeToId[code] };
    };
    const fb = feedbackNow().map((n) => n.text);
    return hashInput({ v: RESULT_VERSION, focus: strip(funnel.focus), options: funnel.options.map(strip), fb });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [funnel, anon]);

  // תוצאה שמורה: אם החתימה זהה - מוצגת מיד, בלי פנייה לבינה.
  // תוצאה מגרסה קודמת (לפני השופט) אינה מוצגת - המבנה שלה שונה.
  const [cacheInfo, setCacheInfo] = useState(null);
  useEffect(() => {
    let alive = true;
    if (!signature) return undefined;
    readFinderCache(candidateId).then((entry) => {
      if (!alive || entry?.result?.version !== RESULT_VERSION) return;
      setResult(entry.result);
      setCacheInfo({ at: entry.at, stale: entry.hash !== signature });
    });
    return () => {
      alive = false;
    };
  }, [candidateId, signature]);
  const usage = useAiUsage(true);

  const fullLine = (id) => {
    const c = byId.get(id);
    return c ? [String(c.name || "").trim(), c.age, c.height && `${c.height} ס״מ`, c.tag, c.city].filter(Boolean).join(" · ") : "?";
  };

  const run = async ({ allowLite = false } = {}) => {
    if (loading || !funnel.focus) return;
    setLoading(true);
    setError("");
    setCanUseLite(false);
    try {
      const data = await callJudge({ focus: funnel.focus, options: funnel.options, feedback: feedbackNow(), allowLite });
      // שמירה עם מזהי כרטיסים ושמות פרטיים - כדי שהתוצאה תישאר נכונה גם כשהקודים משתנים
      const evaluations = (data.evaluations || [])
        .map((e) => ({
          ...e,
          candidateId: anon.codeToId[e.candidate],
          verdicts: Object.fromEntries(
            AXIS_KEYS.map((k) => [k, { ...e.verdicts?.[k], reason: withNames(e.verdicts?.[k]?.reason), evidence: withNames(e.verdicts?.[k]?.evidence) }])
          ),
          summary: withNames(e.summary),
          blindSpot: withNames(e.blindSpot),
          question: withNames(e.question),
        }))
        .filter((e) => e.candidateId);
      const normalized = { version: RESULT_VERSION, model: data.model || "", lite: !!data.lite, evaluations };
      setResult(normalized);
      setCacheInfo(null);
      writeFinderCache(candidateId, { hash: signature, result: normalized });
    } catch (err) {
      setError(err?.message || "משהו השתבש");
      setCanUseLite(!!err?.canUseLite);
    } finally {
      setLoading(false);
    }
  };

  const name = String(me?.name || "").trim().split(/\s+/)[0] || "";
  const excludedText = Object.entries(funnel.excluded || {})
    .map(([k, v]) => `${k}: ${v}`)
    .join(" · ");

  const evals = result?.evaluations || [];
  const top = evals.filter((e) => e.status === "מומלץ");
  const needYou = evals.filter((e) => e.status === "חסר מידע");
  const others = evals.filter((e) => e.status !== "מומלץ" && e.status !== "חסר מידע");

  const card = (e, { compact = false } = {}) => {
    const id = e.candidateId;
    if (!id || !byId.get(id)) return null;
    return (
      <div key={id} className="rounded-3xl border border-[#EAE5E3] bg-white p-4 shadow-[0_4px_18px_rgba(58,51,53,0.06)]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewId(id)}
            aria-label={`צפייה בכרטיס של ${firstName(id)}`}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F6E4E6] text-[#8C4A55]"
          >
            <Eye size={15} />
          </button>
          <p className="flex-1 text-[14px] font-bold leading-snug text-[#3A3335]">{fullLine(id)}</p>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${STATUS_STYLE[e.status] || ""}`}>
            {e.score === null || e.score === undefined ? e.status : `${e.score}/10`}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-[#8A8285]">
          {e.status === "נפסל בתנאי סף"
            ? `נפסל בבדיקת הקוד: ${e.hardReason}`
            : `${e.status} · מבוסס על ${e.known} מתוך ${AXIS_KEYS.length} צירים`}
          {e.unknown?.length > 0 && ` · לא ידוע: ${e.unknown.join(", ")}`}
        </p>
        {e.summary && <p className="mt-2 text-[12.5px] leading-relaxed text-[#3A3335]">{e.summary}</p>}
        {!compact && (
          <div className="mt-2 space-y-1.5">
            {AXIS_KEYS.map((k) => {
              const v = e.verdicts?.[k] || {};
              if (v.verdict === "לא ידוע") return null;
              return (
                <div key={k} className="text-[12px] leading-relaxed text-[#3A3335]">
                  <span className={`ml-1.5 inline-block rounded-full px-2 py-0.5 text-[10.5px] font-bold ${VERDICT_STYLE[v.verdict] || ""}`}>
                    {AXES[k].label}: {v.verdict}
                  </span>
                  {v.reason}
                  {v.evidence && <span className="block text-[10.5px] italic text-[#B5AEB0]">&quot;{v.evidence}&quot;</span>}
                </div>
              );
            })}
          </div>
        )}
        {!compact && (e.blindSpot || e.question) && (
          <div className="mt-2.5 rounded-2xl border border-[#F0D3A0] bg-[#FFF8E7] p-2.5 text-[12px] leading-relaxed">
            {e.blindSpot && (
              <>
                <p className="flex items-center gap-1 font-bold text-[#946200]">
                  <AlertTriangle size={12} /> לבדוק מראש
                </p>
                <p>{e.blindSpot}</p>
              </>
            )}
            {e.question && (
              <>
                <p className="mt-1.5 flex items-center gap-1 font-bold text-[#946200]">
                  <HelpCircle size={12} /> שאלה לבירור
                </p>
                <p>{e.question}</p>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[140] flex items-end justify-center sm:items-center" dir="rtl">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-[#F6F5F4] p-4 shadow-2xl sm:rounded-3xl">
        <div className="mb-3 flex items-center justify-between">
          <p className="flex items-center gap-2 text-[16px] font-bold text-[#3A3335]">
            <Sparkles size={18} className="text-[#8C4A55]" /> התאמה עבור {name}
          </p>
          <button onClick={onClose} aria-label="סגירה" className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow">
            <X size={18} />
          </button>
        </div>

        {!funnel.focus ? (
          <p className="rounded-2xl bg-white p-4 text-[13px] leading-relaxed text-[#8A8285]">
            החיפוש פועל רק למועמדים בסטטוס &quot;פנוי&quot; שאינם חסויים ואינם בתוך הצעה פתוחה או מוקפאת.
          </p>
        ) : (
          <div className="space-y-3">
            {/* ---------- שלב 1: המשפך בקוד ---------- */}
            <div className="rounded-2xl bg-white p-3 text-[12px] leading-relaxed text-[#3A3335]">
              <p className="flex items-center gap-1.5 font-bold text-[#8C4A55]">
                <Filter size={13} /> סינון ראשון (בלי בינה)
              </p>
              <p className="mt-1">
                מתוך {funnel.considered} {me?.gender === "female" ? "בחורים" : "בחורות"} פנויים - {funnel.passed} עברו את דרישות הסף.
                {funnel.options.length > 0 && ` ${funnel.options.length} הקרובים ביותר נשלחים לשופט.`}
              </p>
              {excludedText && <p className="mt-1 text-[11px] text-[#8A8285]">נפסלו - {excludedText}</p>}
              <p className="mt-1 text-[11px] text-[#B5AEB0]">שימוש היום בבינה: {usage.count} פניות</p>
            </div>

            {funnel.options.length === 0 ? (
              <p className="rounded-2xl bg-white p-4 text-center text-[13px] text-[#8A8285]">אין התאמה מתאימה כרגע.</p>
            ) : (
              !result && (
                <button
                  type="button"
                  onClick={() => run()}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#8C4A55] py-3 text-[14px] font-bold text-white transition active:scale-[0.98] disabled:opacity-50"
                >
                  <Sparkles size={15} /> {loading ? "השופט בוחן כל אפשרות... עד חצי דקה" : "בדיקה מעמיקה של הרשימה הקצרה"}
                </button>
              )
            )}

            {error && (
              <div className="rounded-2xl bg-[#FBEDED] p-3 text-[12px] text-[#C24545]">
                <p className="flex items-start gap-1.5">
                  <AlertTriangle size={13} className="mt-0.5 shrink-0" /> {error}
                </p>
                {canUseLite && (
                  <button
                    type="button"
                    onClick={() => run({ allowLite: true })}
                    disabled={loading}
                    className="mt-2 w-full rounded-xl border border-[#C24545] bg-white py-1.5 font-semibold text-[#C24545] disabled:opacity-50"
                  >
                    בדיקה מהירה במודל הקל (פחות מדויק)
                  </button>
                )}
              </div>
            )}

            {/* ---------- שלב 2: פסקי הדין של השופט ---------- */}
            {result && (
              <>
                {cacheInfo && (
                  <p className={`rounded-2xl p-2.5 text-[11px] ${cacheInfo.stale ? "bg-[#FFF8E7] text-[#946200]" : "bg-[#E9F6EF] text-[#178A57]"}`}>
                    {cacheInfo.stale
                      ? `תוצאה קודמת מ-${new Date(cacheInfo.at).toLocaleDateString("he-IL")}. מאז השתנו נתונים (מועמדים, תיאורים או פרופילים) - כדאי לבדוק מחדש.`
                      : `תוצאה שמורה מ-${new Date(cacheInfo.at).toLocaleDateString("he-IL")} - בלי פנייה לבינה. שום דבר לא השתנה מאז.`}
                  </p>
                )}
                {result.lite && (
                  <p className="rounded-2xl bg-[#FFF8E7] p-2.5 text-[11px] text-[#946200]">
                    הבדיקה נעשתה במודל הקל, לבקשתך. פסקי הדין פחות מדויקים - כדאי לבדוק שוב כשהמודל החזק זמין.
                  </p>
                )}

                {top.length > 0 ? (
                  <p className="text-[13px] font-bold text-[#3A3335]">מומלצים</p>
                ) : (
                  <p className="rounded-2xl bg-white p-4 text-center text-[13px] text-[#8A8285]">אין התאמה מתאימה כרגע.</p>
                )}
                {top.map((e) => card(e))}

                {needYou.length > 0 && (
                  <>
                    <p className="text-[13px] font-bold text-[#3C5AA6]">חסר מידע - להכרעתך ({needYou.length})</p>
                    <p className="-mt-1.5 text-[11px] text-[#8A8285]">
                      אין בתיאורים מספיק כדי לשפוט. זה לא פער - זו שאלה שרק את יכולה להכריע בה.
                    </p>
                    {needYou.map((e) => card(e))}
                  </>
                )}

                {others.length > 0 && (
                  <div className="rounded-2xl bg-white">
                    <button
                      type="button"
                      onClick={() => setShowOthers((v) => !v)}
                      className="flex w-full items-center justify-between px-3 py-2.5 text-[12.5px] font-semibold text-[#3A3335]"
                    >
                      פחות מתאימים ({others.length})
                      <ChevronDown size={15} className={`transition ${showOthers ? "rotate-180" : ""}`} />
                    </button>
                    {showOthers && <div className="space-y-2 border-t border-[#EAE5E3] p-2">{others.map((e) => card(e, { compact: false }))}</div>}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => run()}
                  disabled={loading}
                  className="w-full text-center text-[12px] font-semibold text-[#8A8285] underline underline-offset-2 disabled:opacity-50"
                >
                  {loading ? "בודקת..." : "בדיקה מחודשת (פנייה אחת לבינה)"}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {viewId && byId.get(viewId) && (
        <SafeBoundary key={viewId} onError={() => setViewId(null)}>
          <ProfileDetailModal candidate={byId.get(viewId)} onClose={() => setViewId(null)} />
        </SafeBoundary>
      )}
    </div>
  );
}

// עטיפה בטוחה לשימוש מכרטיס המועמד/ת: קריסה של החלונית סוגרת אותה בלבד
export function SafeCandidateMatchFinder(props) {
  return (
    <SafeBoundary onError={props.onClose}>
      <CandidateMatchFinder {...props} />
    </SafeBoundary>
  );
}
