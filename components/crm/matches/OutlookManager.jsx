"use client";

// פרופילי השקפה - חילוץ ואישור (בתוך עוזר ההתאמות, למנהלת בלבד).
//
// הסוכן המחלץ קורא את "קצת עליי" ואת "מורכבויות וייחודיות" ומציע פרופיל
// בשדות סגורים. המנהלת עוברת, מתקנת בלחיצה ומאשרת. מטריצת תנאי הסף בקוד
// (lib/crm/outlook.js) משתמשת בפרופילים כדי לפסול שילובים לפני כל בינה.
//
// נשלח לבינה: מפתח אקראי ומגדר, תווית, רמת תורניות, מסלול, עיסוק, והטקסטים -
// אחרי ניקוי שמות משפחה, יישובים, טלפונים ומיילים. שום מזהה של הכרטיס.

import { useMemo, useRef, useState } from "react";
import { ScanSearch, AlertTriangle, Check, ChevronDown, Cloud, Smartphone, Eye } from "lucide-react";
import { crmAuth } from "@/lib/crm/firebaseClient";
import { scrubText } from "@/lib/crm/aiAnonymize";
import { OUTLOOK_FIELDS, fieldsFor, sourceHash, effectiveOutlook, labelConflict, UNKNOWN } from "@/lib/crm/outlook";

const BATCH = 5;
const PAUSE_MS = 5_000;
const PAGE = 15;

async function callExtract(items) {
  const user = crmAuth.currentUser;
  if (!user) throw new Error("נדרשת התחברות מחדש");
  const idToken = await user.getIdToken();
  const res = await fetch("/api/ai-match/outlook/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items, idToken }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) throw new Error(data?.error || `שגיאה בחילוץ (${res.status})`);
  return data;
}

// ניקוי לפני שליחה: שם המשפחה והיישוב של המועמד/ת עצמו/ה
function cleanFor(c) {
  const rest = String(c.name || "").trim().split(/\s+/).slice(1);
  const city = String(c.city || "").trim();
  const places = [city, ...city.split(/\s+/)].filter((w) => w.length >= 2);
  return (t) => scrubText(t || "", { surnames: rest, places });
}

export default function OutlookManager({ candidates, profiles, mode, save, localCount, migrateLocal, onView }) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("conflicts");
  const [shown, setShown] = useState(PAGE);
  const [migrated, setMigrated] = useState(null);
  const stopRef = useRef(false);

  const rows = useMemo(
    () =>
      candidates.map((c) => {
        const doc = profiles[c.id];
        const eff = effectiveOutlook(doc);
        return {
          c,
          doc,
          eff,
          stale: !!doc && doc.sourceHash !== sourceHash(c),
          conflict: eff ? labelConflict(c, eff) : "",
        };
      }),
    [candidates, profiles]
  );
  const pending = rows.filter((r) => !r.doc || r.stale);
  const extracted = rows.filter((r) => r.doc);
  const conflicts = extracted.filter((r) => r.conflict);
  const toApprove = extracted.filter((r) => !r.doc.approved);
  const approved = extracted.filter((r) => r.doc.approved);
  const list = tab === "conflicts" ? conflicts : tab === "pending" ? toApprove : approved;

  const run = async () => {
    setConfirming(false);
    setRunning(true);
    setError("");
    stopRef.current = false;
    const queue = pending.map((r) => r.c);
    try {
      for (let i = 0; i < queue.length && !stopRef.current; i += BATCH) {
        const batch = queue.slice(i, i + BATCH);
        // מפתחות אקראיים לכל קבוצה - שום מזהה של הכרטיס לא יוצא מהדפדפן
        const items = batch.map((c, j) => {
          const clean = cleanFor(c);
          return {
            key: `k${j}`,
            gender: c.gender,
            tag: c.tag || "",
            religiousLevel: c.religiousLevel || "",
            occupations: c.occupations || [],
            currentOccupation: clean(c.currentOccupation),
            bio: clean(c.bio),
            complexity: clean(c.complexityNotes),
          };
        });
        const data = await callExtract(items);
        for (let j = 0; j < batch.length; j += 1) {
          const fields = data.results?.[`k${j}`];
          if (!fields) continue;
          // חילוץ חדש מאפס את האישור, אבל שומר את התיקונים הידניים
          await save(batch[j].id, {
            fields,
            sourceHash: sourceHash(batch[j]),
            extractedAt: Date.now(),
            model: data.model || "",
            approved: false,
          });
        }
        if (i + BATCH < queue.length && !stopRef.current) await new Promise((r) => setTimeout(r, PAUSE_MS));
      }
    } catch (err) {
      setError(`${err?.message || "משהו השתבש"} מה שכבר חולץ נשמר - אפשר להמשיך אחר כך.`);
    } finally {
      setRunning(false);
    }
  };

  const setManual = (id, key, value) => save(id, { manual: { [key]: value } });
  const approve = (id) => save(id, { approved: true, approvedAt: Date.now() });

  const name = (c) => [String(c.name || "").trim(), c.age, c.tag || c.religiousLevel].filter(Boolean).join(" · ");

  return (
    <div className="rounded-3xl border border-[#EAE5E3] bg-white shadow-[0_4px_18px_rgba(58,51,53,0.06)]">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between px-4 py-3.5">
        <span className="flex items-center gap-2 text-[14px] font-bold text-[#3A3335]">
          <ScanSearch size={16} className="text-[#8C4A55]" /> פרופילי השקפה ({extracted.length}/{rows.length})
          {conflicts.length > 0 && (
            <span className="rounded-full bg-[#FBEDED] px-2 py-0.5 text-[10.5px] font-bold text-[#C24545]">{conflicts.length} סתירות</span>
          )}
        </span>
        <ChevronDown size={16} className={`text-[#8A8285] transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="space-y-3 border-t border-[#EAE5E3] px-4 pb-4 pt-3 text-[12px] leading-relaxed text-[#3A3335]">
          <p className="text-[#8A8285]">
            הבינה קוראת את &quot;קצת עליי&quot; ואת &quot;מורכבויות וייחודיות&quot;, ומציעה לכל מועמד/ת פרופיל: לבוש, חברה, הקפדה,
            רקע, שירות ופתיחות. את מאשרת או מתקנת. הפרופילים פוסלים בקוד שילובים שלא מתאימים - לפני כל בינה.
          </p>

          <p className={`flex items-start gap-1.5 rounded-2xl p-2.5 ${mode === "cloud" ? "bg-[#E9F6EF] text-[#178A57]" : "bg-[#FFF8E7] text-[#946200]"}`}>
            {mode === "cloud" ? <Cloud size={13} className="mt-0.5 shrink-0" /> : <Smartphone size={13} className="mt-0.5 shrink-0" />}
            <span>
              {mode === "cloud"
                ? "נשמר באוסף נפרד ב-Firebase ומסונכרן בין המכשירים."
                : mode === "local"
                ? "כלל הגישה לאוסף עוד לא פורסם ב-Firebase, ולכן הפרופילים נשמרים כרגע במכשיר הזה בלבד."
                : "טוען..."}
            </span>
          </p>
          {mode === "cloud" && localCount > 0 && migrated === null && (
            <button
              type="button"
              onClick={async () => setMigrated(await migrateLocal())}
              className="w-full rounded-2xl border border-[#20A66B] py-2 font-semibold text-[#178A57]"
            >
              העברת {localCount} פרופילים שנשמרו במכשיר אל הענן
            </button>
          )}
          {migrated !== null && <p className="text-[#178A57]">הועברו {migrated} פרופילים.</p>}

          {pending.length > 0 &&
            mode !== "loading" &&
            (running ? (
              <div className="flex items-center justify-between gap-2">
                <span>מחלץ/ת... נשארו {pending.length}</span>
                <button
                  type="button"
                  onClick={() => {
                    stopRef.current = true;
                  }}
                  className="rounded-xl border border-[#EAE5E3] px-3 py-1.5 font-semibold text-[#8A8285]"
                >
                  עצירה
                </button>
              </div>
            ) : confirming ? (
              <div className="space-y-2 rounded-2xl border border-[#F0D3A0] bg-[#FFF8E7] p-3">
                <p className="flex items-start gap-1.5">
                  <AlertTriangle size={13} className="mt-0.5 shrink-0 text-[#946200]" />
                  <span>
                    {pending.length} תיאורים, כולל &quot;מורכבויות וייחודיות&quot;, יישלחו ל-Google Gemini - בלי שמות משפחה, יישובים,
                    טלפונים ומיילים. במסלול החינמי Google רשאית להשתמש בתוכן לשיפור השירות.
                  </span>
                </p>
                <div className="flex gap-2">
                  <button type="button" onClick={run} className="rounded-xl bg-[#8C4A55] px-3 py-1.5 font-semibold text-white">
                    אישור וחילוץ
                  </button>
                  <button type="button" onClick={() => setConfirming(false)} className="font-semibold text-[#8A8285]">
                    ביטול
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="w-full rounded-2xl bg-[#8C4A55] py-2.5 text-[13px] font-bold text-white transition active:scale-[0.98]"
              >
                חילוץ {pending.length} פרופילים (כ-{Math.max(1, Math.ceil((pending.length / BATCH) * 0.3))} דק&apos;)
              </button>
            ))}
          {error && <p className="rounded-2xl bg-[#FBEDED] p-2.5 text-[#C24545]">{error}</p>}

          {extracted.length > 0 && (
            <>
              <div className="flex gap-1.5">
                {[
                  ["conflicts", `סתירות (${conflicts.length})`],
                  ["pending", `לאישור (${toApprove.length})`],
                  ["approved", `אושרו (${approved.length})`],
                ].map(([k, label]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => {
                      setTab(k);
                      setShown(PAGE);
                    }}
                    className={`flex-1 rounded-xl py-1.5 text-[11.5px] font-semibold ${tab === k ? "bg-[#8C4A55] text-white" : "bg-[#F6F5F4] text-[#8A8285]"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {list.length === 0 && <p className="text-center text-[#8A8285]">אין כאן כרגע.</p>}
              {list.slice(0, shown).map(({ c, doc, eff, stale, conflict }) => (
                <div key={c.id} className="rounded-2xl border border-[#EAE5E3] p-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onView(c.id)}
                      aria-label={`צפייה בכרטיס של ${String(c.name || "").split(" ")[0]}`}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F6E4E6] text-[#8C4A55]"
                    >
                      <Eye size={13} />
                    </button>
                    <p className="flex-1 font-bold">{name(c)}</p>
                    {doc.approved && <Check size={14} className="text-[#178A57]" />}
                  </div>
                  {conflict && <p className="mt-1.5 rounded-xl bg-[#FBEDED] px-2 py-1.5 text-[11.5px] text-[#C24545]">{conflict}</p>}
                  {stale && <p className="mt-1.5 text-[11px] text-[#946200]">התיאור בכרטיס השתנה מאז החילוץ - ייחלץ מחדש בחילוץ הבא.</p>}
                  <div className="mt-2 grid grid-cols-2 gap-1.5">
                    {fieldsFor(c.gender).map((k) => {
                      const f = doc.fields?.[k];
                      const manual = doc.manual?.[k];
                      return (
                        <label key={k} className="block">
                          <span className="text-[10.5px] text-[#8A8285]">
                            {OUTLOOK_FIELDS[k].label}
                            {!manual && f?.confidence === "נמוכה" && !doc.approved && " (ודאות נמוכה)"}
                          </span>
                          <select
                            value={eff[k]}
                            onChange={(e) => setManual(c.id, k, e.target.value)}
                            title={f?.quote || ""}
                            className={`w-full rounded-lg border px-1.5 py-1 text-[11.5px] ${
                              manual ? "border-[#8C4A55] bg-[#F6E4E6]" : eff[k] === UNKNOWN ? "border-[#EAE5E3] text-[#B5AEB0]" : "border-[#EAE5E3]"
                            }`}
                          >
                            {OUTLOOK_FIELDS[k].options.map((o) => (
                              <option key={o} value={o}>
                                {o}
                              </option>
                            ))}
                          </select>
                          {f?.quote && !manual && <span className="mt-0.5 block text-[10px] italic leading-snug text-[#B5AEB0]">&quot;{f.quote}&quot;</span>}
                        </label>
                      );
                    })}
                  </div>
                  {!doc.approved && (
                    <button
                      type="button"
                      onClick={() => approve(c.id)}
                      className="mt-2 w-full rounded-xl bg-[#20A66B] py-1.5 text-[12px] font-semibold text-white"
                    >
                      אישור הפרופיל
                    </button>
                  )}
                </div>
              ))}
              {list.length > shown && (
                <button type="button" onClick={() => setShown((n) => n + PAGE)} className="w-full text-center font-semibold text-[#8C4A55]">
                  עוד ({list.length - shown})
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
