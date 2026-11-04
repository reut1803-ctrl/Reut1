"use client";

// "מצא/י התאמה" למועמד/ת אחד/ת - חלונית שנפתחת מכרטיס המועמד/ת (למנהלת בלבד).
//
// שני שלבים:
//   1. משפך בקוד, בלי בינה (lib/crm/aiShortlist.js): מי בכלל רלוונטי, ומי
//      הכי קרוב - עד 12. מוצג מיד, כולל כמה נפסלו ולמה.
//   2. הבינה שופטת לעומק רק את הרשימה הקצרה (/api/ai-match/candidate).
// קריאה בלבד: לא נכתב שום דבר למסד הנתונים. המידע שנשלח אנונימי, כמו
// בעוזר ההתאמות - קוד ושם פרטי בלבד, וכרטיס חסוי לא נשלח לעולם.

import { Component, useMemo, useState } from "react";
import { X, Sparkles, Eye, Filter, AlertTriangle, HelpCircle, Quote, ChevronDown } from "lucide-react";
import { useCrmStore, PROPOSAL_DROPPED } from "@/lib/crm/store";
import { crmAuth } from "@/lib/crm/firebaseClient";
import { anonymizePool } from "@/lib/crm/aiAnonymize";
import { buildShortlist, serviceSignal } from "@/lib/crm/aiShortlist";
import { readVibes, vibeFor } from "@/lib/crm/aiVibe";
import { readFeedback, feedbackForPrompt } from "@/lib/crm/aiFeedback";
import { useBackToClose } from "@/lib/crm/useBackToClose";
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

async function callFinder(payload) {
  const user = crmAuth.currentUser;
  if (!user) throw new Error("נדרשת התחברות מחדש");
  const idToken = await user.getIdToken();
  const res = await fetch("/api/ai-match/candidate/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, idToken }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) throw new Error(data?.error || `שגיאה בחיפוש ההתאמה (${res.status})`);
  return data;
}

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
  // הרשימה האנונימית, עם הוייב החזותי (אם נסרק) וסימן השירות
  const pool = useMemo(() => {
    const vibes = readVibes();
    return anon.pool.map((p) => {
      const v = vibeFor(vibes, byId.get(anon.codeToId[p.code]));
      return { ...p, ...(v ? { visual: v } : {}), service: serviceSignal(p) };
    });
  }, [anon, byId]);

  const me = byId.get(candidateId);
  const focusCode = anon.idToCode[candidateId];
  const funnel = useMemo(() => buildShortlist(pool, anon.forbiddenPairs, focusCode), [pool, anon, focusCode]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [viewId, setViewId] = useState(null);
  const [showRejected, setShowRejected] = useState(false);

  const firstName = (id) => String(byId.get(id)?.name || "").trim().split(/\s+/)[0] || "?";
  const withNames = (text) =>
    String(text || "").replace(/\b([MF]\d{2,3})\b/g, (code) => {
      const id = anon.codeToId[code];
      return id ? firstName(id) : code;
    });
  const fullLine = (id) => {
    const c = byId.get(id);
    return c ? [String(c.name || "").trim(), c.age, c.height && `${c.height} ס״מ`, c.tag, c.city].filter(Boolean).join(" · ") : "?";
  };

  const run = async () => {
    if (loading || !funnel.focus) return;
    setLoading(true);
    setError("");
    try {
      let feedback = [];
      try {
        feedback = feedbackForPrompt(readFeedback(), { byId, idToCode: anon.idToCode, everyone });
      } catch {
        feedback = [];
      }
      const data = await callFinder({ focus: funnel.focus, options: funnel.options, feedback });
      setResult(data);
    } catch (err) {
      setError(err?.message || "משהו השתבש");
    } finally {
      setLoading(false);
    }
  };

  const name = String(me?.name || "").trim().split(/\s+/)[0] || "";
  const excludedText = Object.entries(funnel.excluded || {})
    .map(([k, v]) => `${k}: ${v}`)
    .join(" · ");

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
                {funnel.options.length > 0 && ` ${funnel.options.length} הקרובים ביותר נשלחים לבינה לבדיקה מעמיקה.`}
              </p>
              {excludedText && <p className="mt-1 text-[11px] text-[#8A8285]">נפסלו - {excludedText}</p>}
            </div>

            {funnel.options.length === 0 ? (
              <p className="rounded-2xl bg-white p-4 text-center text-[13px] text-[#8A8285]">אין התאמה מתאימה כרגע.</p>
            ) : (
              !result && (
                <button
                  type="button"
                  onClick={run}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#8C4A55] py-3 text-[14px] font-bold text-white transition active:scale-[0.98] disabled:opacity-50"
                >
                  <Sparkles size={15} /> {loading ? "הבינה בוחנת כל אפשרות... עד חצי דקה" : "בדיקה מעמיקה של הרשימה הקצרה"}
                </button>
              )
            )}

            {error && (
              <p className="flex items-start gap-1.5 rounded-2xl bg-[#FBEDED] p-3 text-[12px] text-[#C24545]">
                <AlertTriangle size={13} className="mt-0.5 shrink-0" /> {error}
              </p>
            )}

            {/* ---------- שלב 2: תוצאות הבינה ---------- */}
            {result && (
              <>
                {/lite/i.test(result.model || "") && (
                  <p className="rounded-2xl bg-[#FFF8E7] p-2.5 text-[11px] text-[#946200]">
                    השרתים של Google היו עמוסים, והתשובה הגיעה ממודל מהיר ופשוט יותר. כדאי לנסות שוב מאוחר יותר.
                  </p>
                )}
                {result.recommendations.length === 0 && (
                  <p className="rounded-2xl bg-white p-4 text-center text-[13px] text-[#8A8285]">{withNames(result.note)}</p>
                )}
                {result.recommendations.map((r, i) => {
                  const id = anon.codeToId[r.candidate];
                  if (!id || !byId.get(id)) return null;
                  return (
                    <div key={r.candidate} className="rounded-3xl border border-[#EAE5E3] bg-white p-4 shadow-[0_4px_18px_rgba(58,51,53,0.06)]">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setViewId(id)}
                          aria-label={`צפייה בכרטיס של ${firstName(id)}`}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F6E4E6] text-[#8C4A55]"
                        >
                          <Eye size={15} />
                        </button>
                        <p className="flex-1 text-[14px] font-bold leading-snug text-[#3A3335]">
                          {i + 1}. {fullLine(id)}
                        </p>
                        <span className="rounded-full bg-[#E9F6EF] px-2 py-0.5 text-[11px] font-bold text-[#178A57]">{r.fitScore}/10</span>
                      </div>
                      <div className="mt-2.5 space-y-1.5 text-[12.5px] leading-relaxed text-[#3A3335]">
                        <p>
                          <span className="font-bold text-[#8C4A55]">אורח חיים: </span>
                          {withNames(r.lifestyle)}
                        </p>
                        <p>
                          <span className="font-bold text-[#8C4A55]">ערכי ליבה: </span>
                          {withNames(r.coreValues)}
                        </p>
                        <p>
                          <span className="font-bold text-[#8C4A55]">אנרגיה והשלמה: </span>
                          {withNames(r.energy)}
                        </p>
                        <p>
                          <span className="font-bold text-[#8C4A55]">תקשורת וצרכים: </span>
                          {withNames(r.communication)}
                        </p>
                      </div>
                      <div className="mt-2.5 rounded-2xl border border-[#F0D3A0] bg-[#FFF8E7] p-2.5 text-[12px] leading-relaxed">
                        <p className="flex items-center gap-1 font-bold text-[#946200]">
                          <AlertTriangle size={12} /> לבדוק מראש
                        </p>
                        <p>{withNames(r.blindSpot)}</p>
                        <p className="mt-1.5 flex items-center gap-1 font-bold text-[#946200]">
                          <HelpCircle size={12} /> שאלה לבירור
                        </p>
                        <p>{withNames(r.question)}</p>
                      </div>
                      {r.evidence && (
                        <p className="mt-2 flex gap-1.5 text-[11px] italic leading-relaxed text-[#8A8285]">
                          <Quote size={11} className="mt-0.5 shrink-0" /> {withNames(r.evidence)}
                        </p>
                      )}
                    </div>
                  );
                })}

                {result.rejected.length > 0 && (
                  <div className="rounded-2xl bg-white">
                    <button
                      type="button"
                      onClick={() => setShowRejected((v) => !v)}
                      className="flex w-full items-center justify-between px-3 py-2.5 text-[12.5px] font-semibold text-[#3A3335]"
                    >
                      למה לא האחרים ({result.rejected.length})
                      <ChevronDown size={15} className={`transition ${showRejected ? "rotate-180" : ""}`} />
                    </button>
                    {showRejected && (
                      <div className="space-y-1.5 border-t border-[#EAE5E3] px-3 pb-3 pt-2">
                        {result.rejected.map((r) => {
                          const id = anon.codeToId[r.candidate];
                          return (
                            <p key={r.candidate} className="text-[11.5px] leading-relaxed text-[#8A8285]">
                              <button type="button" onClick={() => id && setViewId(id)} className="font-semibold text-[#8C4A55]">
                                {firstName(id)}
                              </button>
                              : {withNames(r.reason)}
                            </p>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setResult(null)}
                  className="w-full text-center text-[12px] font-semibold text-[#8A8285] underline underline-offset-2"
                >
                  בדיקה חוזרת
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
