"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { prefsOf, useRows, useTripCtx, useTripToday } from "@/lib/tripContext";
import { useAuth } from "@/lib/auth";
import { fb } from "@/lib/firebase";
import { formatDrive, useOrigin, useShabbat, useWeather } from "@/lib/context";
import { freeHours } from "@/lib/recommend";
import { INTERESTS, KIDS } from "@/content/sfGuide";
import { caNow, heDate } from "@/lib/time";
import Icon from "../app/Icon";
import type { Activity } from "./PlanView";

type Msg = { role: "user" | "assistant"; text: string; error?: string };
const KEY = "ct-chat-v1";

const SUGGESTIONS = [
  "מה עושים היום עם הבנות בגשם?",
  "איפה אוכלים כשר באזור שלנו?",
  "מה קורה בסוף השבוע הקרוב בסן פרנסיסקו?",
  "תכנני לנו יום רגוע ליד המים",
  "מה כדאי לקנות בסופר לשבת?",
];

const ERRORS: Record<string, string> = {
  no_key: "העוזרת עוד לא מחוברת. צריך להוסיף מפתח ב-Vercel — ההוראות מופיעות למטה.",
  not_member: "רק מטיילים מחוברים יכולים לשאול. נסו לצאת ולהיכנס שוב.",
  key: "המפתח של העוזרת לא תקין. צריך ליצור מפתח חדש ולהדביק אותו שוב ב-Vercel.",
  credit: "נגמרה היתרה בחשבון של Anthropic. אפשר להוסיף יתרה בעמוד החיוב שלהם.",
  busy: "העוזרת עמוסה כרגע. נסו שוב בעוד דקה.",
  other: "משהו השתבש. נסו שוב.",
  offline: "אין חיבור לאינטרנט. העוזרת צריכה קליטה.",
};

/** הופך את התשובה לטקסט מעוצב: **מודגש**, רשימות וקישורים — בלי HTML חופשי */
function Rich({ text }: { text: string }) {
  const inline = (s: string, k: string): ReactNode[] => {
    const out: ReactNode[] = [];
    const re = /\*\*(.+?)\*\*|\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;
    let last = 0;
    let m: RegExpExecArray | null;
    let i = 0;
    while ((m = re.exec(s))) {
      if (m.index > last) out.push(s.slice(last, m.index));
      if (m[1]) out.push(<strong key={`${k}b${i++}`}>{m[1]}</strong>);
      else out.push(<a key={`${k}a${i++}`} href={m[3]} target="_blank" rel="noopener noreferrer">{m[2]}</a>);
      last = m.index + m[0].length;
    }
    if (last < s.length) out.push(s.slice(last));
    return out;
  };
  const blocks: ReactNode[] = [];
  let list: ReactNode[] = [];
  const flush = () => { if (list.length) { blocks.push(<ul key={`u${blocks.length}`}>{list}</ul>); list = []; } };
  text.split("\n").forEach((line, n) => {
    const t = line.trim();
    if (!t) { flush(); return; }
    const li = t.match(/^(?:[-•*]|\d+[.)])\s+(.*)$/);
    if (li) { list.push(<li key={n}>{inline(li[1], `l${n}`)}</li>); return; }
    flush();
    const h = t.match(/^#{1,4}\s+(.*)$/);
    blocks.push(h ? <h4 key={n}>{inline(h[1], `h${n}`)}</h4> : <p key={n}>{inline(t, `p${n}`)}</p>);
  });
  flush();
  return <>{blocks}</>;
}

function SetupGuide() {
  return (
    <details className="panel glass setup" open>
      <summary className="panel-title">איך מחברים את העוזרת (פעם אחת, כ-10 דקות)</summary>
      <ol className="setup-steps">
        <li>נכנסים ל-<b>console.anthropic.com</b> ונרשמים עם חשבון הגוגל.</li>
        <li>בתפריט: <b>Billing</b> (חיוב) ← מוסיפים כרטיס אשראי ויתרה התחלתית (5 דולר מספיקים להמון שאלות).</li>
        <li>מומלץ: <b>Settings ← Limits</b> — מגדירים תקרת הוצאה חודשית, למשל 10 דולר.</li>
        <li>בתפריט: <b>API Keys</b> ← <b>Create Key</b> ← נותנים שם ״קליפורניה״ ← <b>מעתיקים</b> את המפתח (מתחיל ב-sk-ant).</li>
        <li>ב-<b>vercel.com</b>: הפרויקט ← <b>Settings</b> ← <b>Environment Variables</b>.</li>
        <li>בשדה Key כותבים <code dir="ltr">ANTHROPIC_API_KEY</code>, ובשדה Value מדביקים את המפתח ← <b>Save</b>.</li>
        <li><b>Deployments</b> ← שלוש הנקודות ליד העדכון האחרון ← <b>Redeploy</b>. אחרי דקה — העוזרת עובדת.</li>
      </ol>
      <p className="hint">את המפתח לא שולחים לאף אחד, גם לא בצ׳אט. הוא נשמר רק ב-Vercel, והאתר בודק שרק אתם שואלים.</p>
    </details>
  );
}

export default function AssistantView() {
  const { demo, user } = useAuth();
  const { tripDoc } = useTripCtx();
  const today = useTripToday(tripDoc);
  const acts = useRows<Activity>("activities");
  const days = useRows<{ id: string; lodging?: string }>("days");
  const { origin } = useOrigin();
  const { weather } = useWeather(origin.lat, origin.lng);
  const shabbat = useShabbat(origin.lat, origin.lng);

  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [searching, setSearching] = useState(false);
  const [needsKey, setNeedsKey] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try { const raw = localStorage.getItem(KEY); if (raw) setMsgs(JSON.parse(raw)); } catch { /* */ }
  }, []);
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(msgs.slice(-30))); } catch { /* */ }
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs]);

  function context(): string {
    const now = caNow();
    const prefs = prefsOf(tripDoc);
    const free = freeHours({ now: Date.now(), origin, weather, shabbat });
    const plan = (acts ?? []).filter((a) => a.date === today).sort((a, b) => a.time.localeCompare(b.time))
      .map((a) => `${a.time} ${a.title}${a.status === "done" ? " (בוצע)" : a.status === "paused" ? " (מושהה)" : ""}`);
    const t = (ms: number | null | undefined) => ms ? new Intl.DateTimeFormat("he-IL", { timeZone: "America/Los_Angeles", weekday: "long", hour: "2-digit", minute: "2-digit", hour12: false }).format(ms) : null;
    return [
      `עכשיו בקליפורניה: ${heDate(now.date)}, ${now.time}`,
      tripDoc.startDate && tripDoc.endDate ? `תאריכי הטיול: ${tripDoc.startDate} עד ${tripDoc.endDate}` : null,
      origin.source === "gps" ? `המיקום שלנו: ${origin.lat.toFixed(3)}, ${origin.lng.toFixed(3)}` : "המיקום: בערך מרכז סן פרנסיסקו",
      weather ? `מזג אוויר: ${weather.temp}°, ${weather.label}${weather.rainSoon ? ", צפוי גשם בשעות הקרובות" : ""}` : null,
      shabbat?.candles ? `הדלקת נרות הקרובה: ${t(shabbat.candles)}; צאת שבת: ${t(shabbat.havdalah)}` : null,
      `זמן פנוי היום: ${formatDrive(free.hours)}${free.limit === "shabbat" ? " (עד ההכנות לשבת)" : ""}`,
      `אנחנו אוהבים: ${INTERESTS.filter((i) => prefs.interests.includes(i.id)).map((i) => i.label).join(", ") || "לא צוין"}`,
      `הבנות מחפשות: ${KIDS.filter((k) => prefs.kids.includes(k.id)).map((k) => k.label).join(", ") || "לא צוין"}`,
      `קצב: ${prefs.pace === "calm" ? "רגוע" : prefs.pace === "active" ? "הרבה חוויות" : "מאוזן"}; עד ${formatDrive(prefs.maxDrive)} נסיעה`,
      plan.length ? `המסלול של היום: ${plan.join(" · ")}` : "אין פעילויות במסלול של היום",
      days?.find((d) => d.id === today)?.lodging ? `ישנים הלילה ב: ${days.find((d) => d.id === today)!.lodging}` : null,
      user?.name ? `השואל/ת: ${user.name}` : null,
    ].filter(Boolean).join("\n");
  }

  async function ask(text: string) {
    const question = text.trim();
    if (!question || busy) return;
    const history = msgs.filter((m) => !m.error).map((m) => ({ role: m.role, text: m.text }));
    setMsgs((m) => [...m, { role: "user", text: question }, { role: "assistant", text: "" }]);
    setQ("");
    setBusy(true);
    const setLast = (patch: Partial<Msg>) => setMsgs((m) => { const c = [...m]; c[c.length - 1] = { ...c[c.length - 1], ...patch }; return c; });

    if (demo) {
      await new Promise((r) => setTimeout(r, 500));
      setLast({ text: "זו תצוגה מקדימה, ולכן אין כאן חיבור לעוזרת. באתר האמיתי, אחרי שמוסיפים מפתח ב-Vercel, תקבלו כאן תשובה אמיתית — לפי המיקום, מזג האוויר, הזמן עד שבת והמסלול שלכם." });
      setBusy(false);
      return;
    }
    if (!navigator.onLine) { setLast({ error: ERRORS.offline }); setBusy(false); return; }

    try {
      const token = await fb.auth().currentUser?.getIdToken();
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token ?? ""}` },
        body: JSON.stringify({ question, history, context: context() }),
      });
      if (!res.ok) {
        const code = (await res.json().catch(() => ({}))).code ?? "other";
        if (code === "no_key") setNeedsKey(true);
        setLast({ error: ERRORS[code] ?? ERRORS.other });
        return;
      }
      const reader = res.body!.getReader();
      const dec = new TextDecoder();
      let acc = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        const err = acc.match(/\u0000error:(\w+)\u0000/);
        if (err) { setLast({ error: ERRORS[err[1]] ?? ERRORS.other, text: "" }); return; }
        setSearching(acc.endsWith("\u0000search\u0000"));
        setLast({ text: acc.replace(/\u0000search\u0000/g, "") });
      }
    } catch {
      setLast({ error: ERRORS.other });
    } finally {
      setBusy(false);
      setSearching(false);
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    void ask(q);
  }

  return (
    <div className="stack chat">
      {msgs.length === 0 && (
        <div className="chat-intro glass">
          <span className="chat-avatar"><Icon name="spark" /></span>
          <p>שאלו אותי הכול על הטיול, בעברית. אני רואה את השעה, מזג האוויר, הזמן עד שבת, המסלול שלכם ומה הבנות אוהבות — ויכולה גם לחפש ברשת מה קורה עכשיו.</p>
        </div>
      )}

      {msgs.map((m, i) => (
        <div key={i} className={`bubble bubble--${m.role} ${m.error ? "bubble--err" : ""}`}>
          {m.error ? <p>{m.error}</p> : m.role === "assistant" ? (
            m.text ? <Rich text={m.text} /> : <p className="typing">{searching ? "מחפשת ברשת…" : "חושבת…"}<span className="dots"><i /><i /><i /></span></p>
          ) : <p>{m.text}</p>}
        </div>
      ))}
      <div ref={endRef} />

      {needsKey && <SetupGuide />}

      <div className="chips-row chips-row--scroll">
        {SUGGESTIONS.map((s) => <button key={s} type="button" className="chip-btn" onClick={() => ask(s)} disabled={busy}>{s}</button>)}
      </div>

      <form className="chat-bar glass" onSubmit={submit}>
        <textarea
          id="chat-q"
          className="chat-input"
          rows={1}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void ask(q); } }}
          placeholder="מה בא לכם לשאול?"
          aria-label="שאלה לעוזרת"
          maxLength={1500}
        />
        <button className="chat-send" type="submit" disabled={busy || !q.trim()} aria-label="שליחה">
          {busy ? <span className="spinner spinner--light" /> : "←"}
        </button>
      </form>
      {msgs.length > 0 && (
        <button type="button" className="text-btn center" onClick={() => { setMsgs([]); setNeedsKey(false); }}>שיחה חדשה</button>
      )}
      {!needsKey && msgs.length === 0 && (
        <details className="hint setup-small"><summary>עוד לא חיברתם את העוזרת? ההוראות כאן</summary><SetupGuide /></details>
      )}
    </div>
  );
}
