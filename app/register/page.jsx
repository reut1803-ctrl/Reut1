"use client";

// טופס ההרשמה החיצוני - עמוד ציבורי, בלי התחברות.
//
// שני מסלולים:
//   1. מי שכבר במאגר - מוצא/ת את עצמו/ה לפי שם ומעדכן/ת את סטטוס הפניות.
//   2. מי שאינו/ה במאגר - ממלא/ת טופס הרשמה שמגיע ללוח הבקרה של המנהלת.
//
// אבטחה: העמוד לעולם אינו קורא את מאגר המועמדים. חיפוש השם נעשה מול אוסף
// רזה (nameIndex) שמכיל שם ומזהה בלבד, ובבקשה למסמך בודד - כך שאי אפשר
// לסרוק ממנו רשימת שמות. ההרשמה אינה נכתבת למאגר אלא לאוסף נפרד
// (intakeSubmissions), והמנהלת היא שממירה אותה לכרטיס מתוך לוח הבקרה.

import { useState } from "react";
import { doc, getDoc, setDoc, addDoc, collection } from "firebase/firestore";
import { crmDb } from "@/lib/crm/firebaseClient";
import { nameKeys } from "@/lib/crm/nameKey";
import { AVAILABILITY_STATUSES } from "@/lib/crm/store";
import { REGIONS, religiousLevelsFor, occupationTagsFor } from "@/lib/crm/mockData";
import { Search, Heart, Check, AlertCircle, Sparkles, Phone, Users, HandHeart, ExternalLink } from "lucide-react";

// מגבלת זמן לחיפוש. Firestore אינו נכשל כשאין רשת - הוא ממתין וממשיך לנסות
// בלי סוף, ובלי המגבלה הזו המבקר/ת היה/הייתה נתקע/ת על "בודקים..." לנצח.
// אחרי הזמן הזה פשוט ממשיכים לטופס: עדיף הרשמה כפולה על מבקר/ת שנתקע/ת.
const SEARCH_TIMEOUT_MS = 8000;

const withTimeout = (promise, ms) =>
  Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms))]);

const EMPTY = {
  gender: "female",
  name: "",
  age: "",
  height: "",
  eda: "",
  city: "",
  region: REGIONS[0],
  religiousLevel: "",
  currentOccupation: "",
  phone: "",
  bio: "",
  referenceContacts: "",
};

export default function RegisterPage() {
  const [step, setStep] = useState("search");
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [match, setMatch] = useState(null);
  const [savingStatus, setSavingStatus] = useState(false);
  const [statusSaved, setStatusSaved] = useState("");

  const [form, setForm] = useState(EMPTY);
  const [occupations, setOccupations] = useState([]);
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [done, setDone] = useState(false);

  const set = (partial) => setForm((f) => ({ ...f, ...partial }));

  // חיפוש שם: בקשה למסמך בודד לכל מפתח אפשרי. אין כאן שום שאילתת רשימה,
  // ולכן אי אפשר לשלוף מכאן שמות שלא הוקלדו במפורש.
  const handleSearch = async () => {
    const keys = nameKeys(query);
    if (keys.length === 0) {
      setSearchError("צריך להקליד שם מלא (לפחות שתי אותיות)");
      return;
    }
    setSearching(true);
    setSearchError("");
    try {
      let found = null;
      for (const key of keys) {
        const snap = await withTimeout(getDoc(doc(crmDb, "nameIndex", key)), SEARCH_TIMEOUT_MS);
        if (snap.exists()) {
          found = snap.data();
          break;
        }
      }
      if (!found?.candidateId) {
        setMatch(null);
        setStep("form");
        set({ name: query.trim() });
        return;
      }
      const statusSnap = await withTimeout(
        getDoc(doc(crmDb, "candidateStatus", found.candidateId)),
        SEARCH_TIMEOUT_MS
      );
      setMatch({
        id: found.candidateId,
        name: statusSnap.data()?.name || found.name || query.trim(),
        availabilityStatus: statusSnap.data()?.availabilityStatus || AVAILABILITY_STATUSES[0],
      });
      setStep("found");
    } catch {
      // חיפוש שנכשל לעולם לא יחסום הרשמה: ממשיכים לטופס עם הערה עדינה.
      // עדיף מועמד/ת שנרשם/ת פעמיים על מועמד/ת שלא הצליח/ה להירשם בכלל.
      setMatch(null);
      set({ name: query.trim() });
      setSearchError("לא הצלחנו לבדוק אם את/ה כבר אצלנו. אפשר פשוט להמשיך - נסדר את זה מצידנו.");
      setStep("form");
    } finally {
      setSearching(false);
    }
  };

  const handleUpdateStatus = async (status) => {
    if (!match) return;
    setSavingStatus(true);
    try {
      await setDoc(doc(crmDb, "candidateStatus", match.id), { availabilityStatus: status }, { merge: true });
      setMatch((m) => ({ ...m, availabilityStatus: status }));
      setStatusSaved(status);
    } catch {
      setStatusSaved("");
      setSearchError("העדכון לא נשמר. אפשר לנסות שוב, או לפנות אלינו.");
    } finally {
      setSavingStatus(false);
    }
  };

  const missing = [];
  if (!form.name.trim()) missing.push("שם מלא");
  if (!form.phone.trim()) missing.push("טלפון");
  if (!consent) missing.push("אישור התיבה בסוף הטופס");

  const handleSubmit = async () => {
    if (missing.length > 0) {
      setSubmitError(`עוד רגע ואנחנו שם - חסר: ${missing.join(" · ")}`);
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    try {
      // status:"pending" הוא תנאי בכללי האבטחה בשרת, ולכן הוא חייב להישלח כך
      await addDoc(collection(crmDb, "intakeSubmissions"), {
        status: "pending",
        gender: form.gender === "male" ? "male" : "female",
        name: form.name.trim(),
        age: form.age ? Number(form.age) : null,
        height: form.height ? Number(form.height) : null,
        eda: form.eda.trim(),
        city: form.city.trim(),
        region: form.region,
        religiousLevel: form.religiousLevel || null,
        currentOccupation: form.currentOccupation.trim(),
        occupations,
        phone: form.phone.trim(),
        bio: form.bio.trim(),
        referenceContacts: form.referenceContacts.trim(),
        consentAccepted: true,
        source: "register-form",
        createdAt: new Date().toISOString(),
      });
      setDone(true);
    } catch {
      setSubmitError("השליחה לא הצליחה כרגע. אפשר לנסות שוב בעוד רגע.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-[#F5EFE6] px-4 py-8">
      <div className="mx-auto w-full max-w-lg">
        <header className="text-center">
          <h1 className="text-2xl font-bold text-[#844442]">אדמה</h1>
          <p className="mt-1 text-[15px] font-semibold text-[#3A2E26]">מאגר שידוכים לחוות גבעות</p>
        </header>

        {/* ================= שלב החיפוש ================= */}
        {step === "search" && (
          <>
            <div className="mt-6 rounded-3xl bg-white p-5 shadow-[0_4px_18px_rgba(58,51,53,0.06)]">
              <p className="text-[15px] font-bold leading-relaxed text-[#3A2E26]">
                ברוכים הבאים לאדמה
              </p>
              <p className="mt-2 text-[14px] leading-relaxed text-[#7C6E60]">
                מקום שהוא קודם כל קהילה עוטפת, חמה וקרובה.
              </p>
              <p className="mt-3 text-[13px] leading-relaxed text-[#7C6E60]">
                כבר רשומים אצלנו? הקלידו את שמכם ותוכלו לעדכן את סטטוס הפניות שלכם.
                <br />
                עדיין לא? נשמח מאוד להכיר - הקלידו את שמכם ונמשיך משם.
              </p>

              <div className="relative mt-4">
                <Search size={17} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#A2937F]" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="שם מלא"
                  className="w-full rounded-2xl border border-[#CCBDAB] bg-white py-3 pr-10 pl-4 text-[15px] outline-none focus:border-[#844442]"
                />
              </div>
              {searchError && (
                <p className="mt-2 flex items-start gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-[12px] font-semibold text-[#C24545]">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" /> {searchError}
                </p>
              )}
              <button
                onClick={handleSearch}
                disabled={searching}
                className="mt-3 w-full rounded-2xl bg-[#844442] px-4 py-3 text-[15px] font-semibold text-white transition active:scale-95 disabled:opacity-60"
              >
                {searching ? "בודקים..." : "המשך"}
              </button>
            </div>

            <HowItWorks />
          </>
        )}

        {/* ================= נמצא/ה במאגר ================= */}
        {step === "found" && match && (
          <div className="mt-6 rounded-3xl bg-white p-5 shadow-[0_4px_18px_rgba(58,51,53,0.06)]">
            <p className="flex items-center gap-2 text-[15px] font-bold text-[#3A2E26]">
              <Heart size={18} className="text-[#844442]" /> שמחים לראות אותך, {match.name}
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-[#7C6E60]">
              את/ה כבר איתנו במאגר. אפשר לעדכן כאן את סטטוס הפניות שלך, כדי שנדע איך ללוות אותך נכון.
            </p>

            <p className="mt-4 mb-2 text-[13px] font-semibold text-[#3A2E26]">הסטטוס שלי כרגע</p>
            <div className="flex flex-wrap gap-2">
              {AVAILABILITY_STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => handleUpdateStatus(s)}
                  disabled={savingStatus}
                  className={`rounded-2xl border-2 px-4 py-2.5 text-[14px] font-semibold transition active:scale-95 disabled:opacity-60 ${
                    match.availabilityStatus === s
                      ? "border-[#844442] bg-[#844442] text-white"
                      : "border-[#CCBDAB] bg-white text-[#3A2E26]"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {statusSaved && (
              <p className="mt-3 flex items-center gap-1.5 rounded-xl bg-[#DDE6DF] px-3 py-2 text-[13px] font-semibold text-[#4A6552]">
                <Check size={15} /> נשמר. הסטטוס שלך עודכן ל"{statusSaved}".
              </p>
            )}

            <button
              onClick={() => {
                setStep("search");
                setMatch(null);
                setStatusSaved("");
                setQuery("");
              }}
              className="mt-4 w-full rounded-2xl border border-[#CCBDAB] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#3A2E26]"
            >
              חזרה
            </button>
          </div>
        )}

        {/* ================= טופס הרשמה ================= */}
        {step === "form" && !done && (
          <>
            <div className="mt-6 rounded-3xl bg-white p-5 shadow-[0_4px_18px_rgba(58,51,53,0.06)]">
              {searchError && (
                <p className="mb-3 rounded-2xl bg-[#FDF6E7] px-3.5 py-2.5 text-[12px] leading-relaxed text-[#7A5A18]">
                  {searchError}
                </p>
              )}
              <p className="text-[15px] font-bold text-[#3A2E26]">נעים מאוד, בואו נכיר</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-[#7C6E60]">
                כמה פרטים ראשונים, ואנחנו כבר חוזרים אליכם בשיחה אישית.
              </p>

              <div className="mt-4 space-y-4">
                <div>
                  <p className="mb-1.5 text-[13px] font-semibold text-[#3A2E26]">אני</p>
                  <div className="flex gap-2">
                    {[
                      { key: "female", label: "בחורה" },
                      { key: "male", label: "בחור" },
                    ].map((g) => (
                      <button
                        key={g.key}
                        onClick={() => {
                          set({ gender: g.key, religiousLevel: "" });
                          setOccupations([]);
                        }}
                        className={`flex-1 rounded-2xl border-2 px-3 py-2.5 text-[14px] font-semibold transition ${
                          form.gender === g.key
                            ? "border-[#844442] bg-[#844442] text-white"
                            : "border-[#CCBDAB] bg-white text-[#3A2E26]"
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>

                <Field label="שם מלא *">
                  <input type="text" value={form.name} onChange={(e) => set({ name: e.target.value })} className="reg-input" />
                </Field>

                <Field label="טלפון *">
                  <input type="tel" dir="ltr" value={form.phone} onChange={(e) => set({ phone: e.target.value })}
                    placeholder="050-1234567" className="reg-input" />
                </Field>

                <div className="grid grid-cols-3 gap-2.5">
                  <Field label="גיל">
                    <input type="number" value={form.age} onChange={(e) => set({ age: e.target.value })} className="reg-input" />
                  </Field>
                  <Field label="גובה">
                    <input type="number" value={form.height} onChange={(e) => set({ height: e.target.value })} className="reg-input" />
                  </Field>
                  <Field label="עדה">
                    <input type="text" value={form.eda} onChange={(e) => set({ eda: e.target.value })} className="reg-input" />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <Field label="יישוב">
                    <input type="text" value={form.city} onChange={(e) => set({ city: e.target.value })} className="reg-input" />
                  </Field>
                  <Field label="אזור">
                    <select value={form.region} onChange={(e) => set({ region: e.target.value })} className="reg-input">
                      {REGIONS.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </Field>
                </div>

                <Field label="רמת תורניות">
                  <select value={form.religiousLevel} onChange={(e) => set({ religiousLevel: e.target.value })} className="reg-input">
                    <option value="">בחירה...</option>
                    {religiousLevelsFor(form.gender).filter((l) => l !== "הכל").map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </Field>

                <Field label="מה אני עושה כיום">
                  <input type="text" value={form.currentOccupation} onChange={(e) => set({ currentOccupation: e.target.value })}
                    placeholder="לדוגמה: לומדת בסמינר / עובד בהייטק" className="reg-input" />
                </Field>

                <div>
                  <p className="mb-1.5 text-[13px] font-semibold text-[#3A2E26]">המסלול שלי</p>
                  <p className="mb-2 text-[11px] text-[#A2937F]">אפשר לסמן כמה שרוצים</p>
                  <div className="flex flex-wrap gap-2">
                    {occupationTagsFor(form.gender).map((t) => (
                      <button
                        key={t}
                        onClick={() =>
                          setOccupations((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]))
                        }
                        className={`rounded-full border px-3 py-1.5 text-[12px] font-semibold transition ${
                          occupations.includes(t)
                            ? "border-[#844442] bg-[#844442] text-white"
                            : "border-[#CCBDAB] bg-white text-[#3A2E26]"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <Field label="קצת עליי">
                  <textarea value={form.bio} onChange={(e) => set({ bio: e.target.value })} rows={5}
                    placeholder="מי אני, מה חשוב לי, ומה אני מחפש/ת..." className="reg-input resize-y" />
                </Field>

                <Field label="מספרים לבירורים">
                  <textarea value={form.referenceContacts} onChange={(e) => set({ referenceContacts: e.target.value })} rows={3}
                    placeholder="שם וטלפון של מי שאפשר לפנות אליו/ה" className="reg-input resize-y" />
                </Field>

                {/* תיבת האישור המשפטית - שדה חובה */}
                <label className="flex cursor-pointer items-start gap-2.5 rounded-2xl border border-[#CCBDAB] bg-[#F5EFE6] px-3.5 py-3">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 h-5 w-5 shrink-0 accent-[#844442]"
                  />
                  <span className="text-[12px] leading-relaxed text-[#3A2E26]">
                    ידוע לי שהפרטים שאני מוסר/ת נועדו אך ורק לצורך התאמות שידוך במסגרת המאגר,
                    וכי המידע נשמר בדיסקרטיות מלאה ומונגש אך ורק לצוות המנהל את המאגר
                    באחריות ובשמירה על פרטיותי. <span className="font-bold text-[#C24545]">*</span>
                  </span>
                </label>

                {(submitError || missing.length > 0) && (
                  <p className="flex items-start gap-1.5 rounded-2xl border-2 border-[#D9A441] bg-[#FDF6E7] px-3.5 py-3 text-[13px] font-semibold leading-relaxed text-[#7A5A18]">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    {submitError || `כדי לשלוח חסר: ${missing.join(" · ")}`}
                  </p>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full rounded-2xl bg-[#844442] px-4 py-3.5 text-[15px] font-semibold text-white transition active:scale-95 disabled:opacity-60"
                >
                  {submitting ? "שולחים..." : "שליחה ונשמח להכיר"}
                </button>
              </div>
            </div>

            <HowItWorks />
            <Costs />
          </>
        )}

        {/* ================= אחרי שליחה ================= */}
        {done && (
          <div className="mt-6 rounded-3xl bg-white p-6 text-center shadow-[0_4px_18px_rgba(58,51,53,0.06)]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#DDE6DF]">
              <Check size={28} className="text-[#4A6552]" />
            </div>
            <p className="mt-3 text-[17px] font-bold text-[#3A2E26]">קיבלנו, ואנחנו כבר בעניין</p>
            <p className="mt-2 text-[14px] leading-relaxed text-[#7C6E60]">
              הפרטים שלך הגיעו אלינו. ניצור איתך קשר טלפוני אישי בקרוב, כדי להכיר אותך באמת -
              בלי לחץ ובגובה העיניים.
              <br />
              <br />
              שמחים שאת/ה איתנו.
            </p>
          </div>
        )}

        <p className="mt-6 pb-4 text-center text-[11px] text-[#A2937F]">
          אדמה · מאגר שידוכים לחוות גבעות
        </p>
      </div>

      <style jsx global>{`
        .reg-input {
          width: 100%;
          border-radius: 1rem;
          border: 1px solid #ccbdab;
          background: white;
          padding: 0.7rem 0.85rem;
          font-size: 0.95rem;
          outline: none;
        }
        .reg-input:focus {
          border-color: #844442;
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <p className="mb-1.5 text-[13px] font-semibold text-[#3A2E26]">{label}</p>
      {children}
    </div>
  );
}

function HowItWorks() {
  const steps = [
    {
      icon: Sparkles,
      title: "ממלאים פרטים",
      text: "אתם ממלאים את הטופס כאן בקלות ובדיסקרטיות.",
    },
    {
      icon: Phone,
      title: "הכרות אישית",
      text: "אנחנו יוצרים איתכם קשר טלפוני אישי ונעים כדי להכיר אתכם באמת, בלי לחץ ובגובה העיניים.",
    },
    {
      icon: Users,
      title: "ליווי ובית חם",
      text: "משבצים אתכם לשגריר אישי שילווה אתכם, יהווה כתובת לכל התייעצות, ויעזור לנו לדייק את ההצעות הכי מתאימות עבורכם מתוך המאגר ומכלל חברי הצוות.",
    },
  ];
  return (
    <div className="mt-4 rounded-3xl bg-white p-5 shadow-[0_4px_18px_rgba(58,51,53,0.06)]">
      <p className="text-[15px] font-bold text-[#3A2E26]">איך זה עובד?</p>
      <div className="mt-3 space-y-3.5">
        {steps.map(({ icon: Icon, title, text }, i) => (
          <div key={title} className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F0E2DE] text-[#844442]">
              <Icon size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-[13.5px] font-bold text-[#3A2E26]">
                {i + 1}. {title}
              </p>
              <p className="mt-0.5 text-[13px] leading-relaxed text-[#7C6E60]">{text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Costs() {
  return (
    <div className="mt-4 rounded-3xl bg-white p-5 shadow-[0_4px_18px_rgba(58,51,53,0.06)]">
      <p className="flex items-center gap-2 text-[15px] font-bold text-[#3A2E26]">
        <HandHeart size={17} className="text-[#844442]" /> עלויות והצטרפות
      </p>

      <div className="mt-3 space-y-2.5">
        <div className="rounded-2xl bg-[#F5EFE6] px-3.5 py-3">
          <p className="text-[13.5px] font-bold text-[#844442]">כניסה למאגר ופתיחת תיק - 60 ש״ח בלבד</p>
          <p className="mt-0.5 text-[12.5px] leading-relaxed text-[#7C6E60]">
            כולל תהליך ההרשמה, שיחת ההיכרות והשיבוץ לשגריר.
          </p>
        </div>
        <div className="rounded-2xl bg-[#F5EFE6] px-3.5 py-3">
          <p className="text-[13.5px] font-bold text-[#844442]">ליווי אישי נוסף - 100 ש״ח בלבד</p>
          <p className="mt-0.5 text-[12.5px] leading-relaxed text-[#7C6E60]">
            אופציונלי, למי שמרגיש צורך בהמשך. ניתן לבקש דרך השגריר כשמרגישים צורך.
          </p>
        </div>
      </div>

      <p className="mt-3 text-[13px] leading-relaxed text-[#7C6E60]">
        <span className="font-semibold text-[#3A2E26]">דרכי תשלום:</span> ביט, פייבוקס או העברה
        בנקאית למספר{" "}
        <span dir="ltr" className="inline-block whitespace-nowrap font-semibold text-[#3A2E26]">
          054-308-5242
        </span>
        .
      </p>

      {/* קבוצת הפייבוקס - הדרך הנוחה והחינמית, ולכן היא מודגשת */}
      <div className="mt-3 rounded-2xl border-2 border-[#62826B] bg-[#DDE6DF] p-3.5">
        <p className="text-[13.5px] font-bold text-[#4A6552]">השימוש ב-PayBox חינם!</p>
        <p className="mt-1 text-[12.5px] leading-relaxed text-[#4A6552]">
          מחכים לך בקבוצת <span className="font-semibold">״כניסה למאגר - גבעות וחוות״</span>
        </p>
        <a
          href="https://links.payboxapp.com/jnLNxjUvE0b"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-2xl bg-[#62826B] px-4 py-3 text-[14px] font-semibold text-white transition active:scale-95"
        >
          <ExternalLink size={15} /> להצטרפות לקבוצה
        </a>
      </div>

      <p className="mt-3 text-[13px] leading-relaxed text-[#7C6E60]">
        <span className="font-semibold text-[#3A2E26]">מה מקבלים בתמורה?</span> דמי ההשתתפות נועדו
        לתחזוקת המעטפת, הליווי והשגריר האישי. אנחנו עושים את מרב ההשתדלות באהבה ומכל הלב כדי לעטוף
        אתכם ולמצוא את ההתאמה המדויקת ביותר. מדי פעם נפתח גם ריטריטים מיוחדים ומחברים שקשורים
        לאנשים שרוצים לגור בחוות וגבעות.
      </p>
    </div>
  );
}
