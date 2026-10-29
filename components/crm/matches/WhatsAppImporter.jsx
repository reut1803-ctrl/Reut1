"use client";

// ניתוח מהיר מקבוצת וואטסאפ - רכיב תוספת בתוך עוזר ההתאמות (גלוי למנהלת בלבד).
//
// בטוח למספר הטלפון: אין חיבור לוואטסאפ ואין בוט. המנהלת מייצאת את הצ'אט
// בעצמה (ייצוא רשמי) ומעלה את הקובץ, או מדביקה הודעות.
// בטוח לפרטיות: הפענוח וההחלפה של טלפונים, מיילים ושמות שולחים בתגים קורים
// כאן, בדפדפן (lib/crm/whatsappChat.js). המיפוי חזרה לא יוצא מהמכשיר.
// בטוח למאגר: לא נכתב שום דבר למסד הנתונים. שמירת כרטיס חיצוני למאגר נעשית
// רק ידנית - העתקה, ומילוי בטופס ההוספה הרגיל.
// התוצאה האחרונה נשמרת ב-sessionStorage, כדי שמעבר לטופס ההוספה וחזרה לא
// יאבד אותה.

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { MessagesSquare, Upload, Sparkles, AlertTriangle, Eye, Copy, Check, ChevronDown, UserPlus, Phone } from "lucide-react";
import { crmAuth } from "@/lib/crm/firebaseClient";
import { parseChat, messagesInWindow, lastMessageAt, tokenizeChat, restoreTokens } from "@/lib/crm/whatsappChat";

const SESSION_KEY = "aiWhatsapp:v1";
const MAX_FILE_BYTES = 5 * 1024 * 1024;

const readSession = () => {
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    const v = raw ? JSON.parse(raw) : null;
    return v && Array.isArray(v.profiles) && Array.isArray(v.matches) ? v : null;
  } catch {
    return null;
  }
};
const writeSession = (v) => {
  try {
    if (v) window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(v));
    else window.sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* דפדפן שחוסם אחסון - התוצאה פשוט לא נשמרת למעבר בין מסכים */
  }
};

const fmt = (ms) =>
  new Date(ms).toLocaleString("he-IL", { timeZone: "Asia/Jerusalem", day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" });

async function callWhatsapp(payload) {
  const user = crmAuth.currentUser;
  if (!user) throw new Error("נדרשת התחברות מחדש");
  const idToken = await user.getIdToken();
  const res = await fetch("/api/ai-match/whatsapp/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, idToken }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) throw new Error(data?.error || `שגיאה בניתוח (${res.status})`);
  return data;
}

export default function WhatsAppImporter({ anon, byId, nowMs, getFeedback, onView }) {
  const [open, setOpen] = useState(false);
  const [raw, setRaw] = useState("");
  const [fileName, setFileName] = useState("");
  const [useFileEnd, setUseFileEnd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState("");
  const fileRef = useRef(null);

  useEffect(() => {
    const saved = readSession();
    if (saved) {
      setResult(saved);
      setOpen(true);
    }
  }, []);

  // פענוח מקומי: כמה הודעות יש, וכמה מהן מהיממה האחרונה
  const parsed = useMemo(() => {
    try {
      return parseChat(raw);
    } catch {
      return { messages: [], timed: false };
    }
  }, [raw]);
  const lastAt = parsed.timed ? lastMessageAt(parsed.messages) : 0;
  const windowEnd = useFileEnd && lastAt ? lastAt : nowMs();
  const inWindow = parsed.timed ? messagesInWindow(parsed.messages, windowEnd) : parsed.messages;

  const onFile = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setError("");
    if (/\.zip$/i.test(f.name)) {
      setError('זה קובץ ZIP. בייצוא מוואטסאפ בחרי "ללא מדיה", ויתקבל קובץ טקסט.');
      return;
    }
    if (f.size > MAX_FILE_BYTES) {
      setError("הקובץ גדול מדי. אפשר לייצא קבוצה עם פחות היסטוריה, או להדביק רק את ההודעות הרלוונטיות.");
      return;
    }
    try {
      const text = await f.text();
      setRaw(text);
      setFileName(f.name);
      setUseFileEnd(false);
    } catch {
      setError("לא הצלחתי לקרוא את הקובץ.");
    }
  };

  const analyze = async () => {
    if (loading || inWindow.length === 0) return;
    setLoading(true);
    setError("");
    try {
      const tok = tokenizeChat(inWindow);
      const data = await callWhatsapp({
        chat: tok.text,
        pool: anon.pool,
        feedback: getFeedback(),
      });
      const next = {
        at: Date.now(),
        analyzed: tok.used,
        profiles: data.profiles || [],
        matches: (data.matches || []).filter((m) => anon.codeToId[m.candidate]),
        note: data.note || "",
        contacts: tok.contacts,
        senders: tok.senders,
        // לתרגום הקודים האנונימיים בחזרה - נכון לרגע הניתוח
        codeToId: anon.codeToId,
      };
      setResult(next);
      writeSession(next);
    } catch (err) {
      setError(err?.message || "משהו השתבש");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    writeSession(null);
    setRaw("");
    setFileName("");
    setError("");
  };

  const show = (text) => (result ? restoreTokens(text, result) : text);
  const profileText = (p) =>
    [
      `${p.gender}${p.age ? `, ${p.age}` : ""}${p.sector ? `, ${p.sector}` : ""}${p.location ? `, ${p.location}` : ""}`,
      p.summary,
      p.requirements && `מחפש/ת: ${p.requirements}`,
      p.contact?.length ? `טלפון: ${p.contact.map(show).join(", ")}` : "",
      p.quote && `מתוך ההודעה: ${show(p.quote)}`,
    ]
      .filter(Boolean)
      .join("\n");

  const copyProfile = async (p) => {
    try {
      await navigator.clipboard.writeText(profileText(p));
      setCopied(p.ref);
      setTimeout(() => setCopied(""), 2000);
    } catch {
      setError("הדפדפן חסם את ההעתקה.");
    }
  };

  const internalName = (code) => {
    const c = byId.get(result?.codeToId?.[code]);
    return c ? [String(c.name || "").trim(), c.age, c.tag].filter(Boolean).join(" · ") : "";
  };
  const byRef = new Map((result?.profiles || []).map((p) => [p.ref, p]));
  const matchedRefs = new Set((result?.matches || []).map((m) => m.profile));

  const profileBox = (p) => (
    <div className="rounded-2xl border border-[#EAE5E3] bg-[#F6F5F4] p-2.5 text-[12px] leading-relaxed text-[#3A3335]">
      <p className="font-bold">
        {p.gender}
        {p.age && ` · ${p.age}`}
        {p.sector && ` · ${p.sector}`}
        {p.location && ` · ${p.location}`}
      </p>
      <p className="mt-0.5">{p.summary}</p>
      {p.requirements && <p className="mt-0.5 text-[#8A8285]">מחפש/ת: {p.requirements}</p>}
      {(p.contact?.length > 0 || p.source) && (
        <p className="mt-1 flex flex-wrap items-center gap-1 text-[11.5px] text-[#8C4A55]">
          <Phone size={11} />
          {p.contact?.length > 0 ? p.contact.map(show).join(", ") : "אין טלפון בהודעה"}
          {p.source && <span className="text-[#8A8285]"> · נשלח ע״י {show(p.source)}</span>}
        </p>
      )}
      <div className="mt-1.5 flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => copyProfile(p)} className="flex items-center gap-1 text-[11.5px] font-semibold text-[#8C4A55]">
          {copied === p.ref ? <Check size={12} /> : <Copy size={12} />} {copied === p.ref ? "הועתק" : "העתקה"}
        </button>
        <Link href="/crm/add-candidate" className="flex items-center gap-1 text-[11.5px] font-semibold text-[#8C4A55]">
          <UserPlus size={12} /> הוספה ידנית למאגר
        </Link>
      </div>
    </div>
  );

  return (
    <div className="rounded-3xl border border-[#EAE5E3] bg-white shadow-[0_4px_18px_rgba(58,51,53,0.06)]">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between px-4 py-3.5">
        <span className="flex items-center gap-2 text-[14px] font-bold text-[#3A3335]">
          <MessagesSquare size={16} className="text-[#8C4A55]" /> ניתוח מהיר מקבוצת וואטסאפ
        </span>
        <ChevronDown size={16} className={`text-[#8A8285] transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="space-y-3 border-t border-[#EAE5E3] px-4 pb-4 pt-3">
          {!result && (
            <>
              <p className="text-[11.5px] leading-relaxed text-[#8A8285]">
                בוואטסאפ: פותחים את הקבוצה ← ⋮ ← עוד ← ייצוא צ&apos;אט ← ללא מדיה. מעלים כאן את קובץ הטקסט, או מדביקים הודעות.
                אין כאן חיבור לוואטסאפ, ולכן אין שום סיכון למספר. טלפונים ושמות שולחים לא נשלחים לבינה.
              </p>

              <input ref={fileRef} type="file" accept=".txt,text/plain,.zip" onChange={onFile} className="hidden" />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[#C98894] bg-[#FBF5F6] py-3 text-[13px] font-semibold text-[#8C4A55]"
              >
                <Upload size={15} /> {fileName ? `נבחר: ${fileName}` : "העלאת קובץ צ'אט (txt)"}
              </button>

              <textarea
                value={fileName ? "" : raw}
                onChange={(e) => {
                  setRaw(e.target.value);
                  setFileName("");
                  setUseFileEnd(false);
                }}
                rows={3}
                placeholder="או הדביקי כאן הודעות מהקבוצה..."
                className="w-full resize-none rounded-2xl border border-[#EAE5E3] bg-white px-3 py-2.5 text-[12.5px] outline-none focus:border-[#8C4A55]"
              />

              {raw.trim() && (
                <div className="text-[11.5px] leading-relaxed text-[#8A8285]">
                  {parsed.timed ? (
                    <>
                      נמצאו {parsed.messages.length} הודעות. {inWindow.length} מהן מ-24 השעות{" "}
                      {useFileEnd ? `האחרונות בקובץ (עד ${fmt(lastAt)})` : "האחרונות"}.
                      {!useFileEnd && inWindow.length === 0 && lastAt > 0 && (
                        <button
                          type="button"
                          onClick={() => setUseFileEnd(true)}
                          className="mr-1 font-semibold text-[#8C4A55] underline underline-offset-2"
                        >
                          לנתח את 24 השעות האחרונות בקובץ (עד {fmt(lastAt)})
                        </button>
                      )}
                    </>
                  ) : (
                    "טקסט מודבק - ינותח כולו."
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={analyze}
                disabled={loading || inWindow.length === 0 || anon.pool.length === 0}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#8C4A55] py-3 text-[13px] font-bold text-white transition active:scale-[0.98] disabled:opacity-40"
              >
                <Sparkles size={15} /> {loading ? "מנתח/ת את ההודעות... עד דקה" : "ניתוח והצלבה מול המאגר"}
              </button>
            </>
          )}

          {error && (
            <p className="flex items-start gap-1.5 rounded-2xl bg-[#FBEDED] p-3 text-[12px] leading-relaxed text-[#C24545]">
              <AlertTriangle size={13} className="mt-0.5 shrink-0" /> {error}
            </p>
          )}

          {result && (
            <>
              <div className="flex items-center justify-between text-[11.5px] text-[#8A8285]">
                <span>
                  נותחו {result.analyzed} הודעות · {result.profiles.length} כרטיסים
                </span>
                <button type="button" onClick={reset} className="font-semibold text-[#8C4A55] underline underline-offset-2">
                  ניתוח חדש
                </button>
              </div>
              {result.note && <p className="text-[12px] leading-relaxed text-[#8A8285]">{show(result.note)}</p>}

              {result.matches.length > 0 && (
                <p className="text-[13px] font-bold text-[#3A3335]">התאמות מובילות מהוואטסאפ</p>
              )}
              {result.matches.map((m) => {
                const p = byRef.get(m.profile);
                const id = result.codeToId[m.candidate];
                if (!p || !id || !byId.get(id)) return null;
                return (
                  <div key={`${m.profile}-${m.candidate}`} className="space-y-2 rounded-3xl border border-[#EAE5E3] p-3">
                    {profileBox(p)}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onView(id)}
                        aria-label="צפייה בכרטיס מהמאגר"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F6E4E6] text-[#8C4A55]"
                      >
                        <Eye size={15} />
                      </button>
                      <p className="text-[13px] font-bold text-[#3A3335]">{internalName(m.candidate)}</p>
                      <span className="rounded-full bg-[#E9F6EF] px-2 py-0.5 text-[10px] font-bold text-[#178A57]">מהמאגר</span>
                    </div>
                    <p className="text-[12.5px] leading-relaxed text-[#3A3335]">{show(m.reasoning)}</p>
                    {m.blindSpot && (
                      <p className="rounded-2xl border border-[#F0D3A0] bg-[#FFF8E7] p-2.5 text-[12px] leading-relaxed text-[#3A3335]">
                        <span className="font-bold text-[#946200]">לבירור: </span>
                        {show(m.blindSpot)}
                      </p>
                    )}
                  </div>
                );
              })}

              {result.profiles.some((p) => !matchedRefs.has(p.ref)) && (
                <>
                  <p className="text-[13px] font-bold text-[#3A3335]">לא נמצאו במאגר מועמדים מתאימים להגדרות המבוקשות עבור:</p>
                  {result.profiles.filter((p) => !matchedRefs.has(p.ref)).map((p) => <div key={p.ref}>{profileBox(p)}</div>)}
                </>
              )}

              <p className="text-[11px] leading-relaxed text-[#B5AEB0]">
                שום כרטיס לא נשמר למאגר לבד. להוספה: &quot;העתקה&quot;, ואז בטופס ההוספה &quot;מילוי מהיר מטקסט&quot;.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
