"use client";

import { useMemo, useRef, useState } from "react";
import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { Search, Check, Camera, Loader2, ArrowRight, Heart, X } from "lucide-react";
import { crmDb } from "@/lib/crm/firebaseClient";
import { nameKeys } from "@/lib/crm/nameKey";
import {
  REGIONS,
  CANDIDATE_TAGS,
  religiousLevelsFor,
  occupationsFor,
} from "@/lib/crm/mockData";

// עמוד ההרשמה החיצוני. פתוח לכל אחד, בלי התחברות ובלי גישה למאגר עצמו:
//   * שלב א' בודק שם מדויק אחד מול מפתח השמות (ראו lib/crm/nameKey.js).
//     אין כאן שאילתת חיפוש, ולכן אי אפשר לסרוק את רשימת המועמדים.
//   * שלב ב' אוסף את הפרטים.
//   * שלב ג' מפקיד את הפנייה באוסף נפרד, והמערכת הפנימית ממירה אותה לכרטיס.
//     מאגר המועמדים עצמו נשאר סגור לחלוטין לכתיבה מבחוץ.

const AVAILABILITY = ["פנוי", "לא פנוי", "בהפסקה"];

// הצהרת הפרטיות שהנרשם/ת מאשר/ת. הנוסח נשמר גם בתוך הפנייה עצמה,
// כדי שיהיה תיעוד מדויק של מה שאושר ומתי.
const PRIVACY_TEXT =
  "ידוע לי שהפרטים שאני מוסר/ת נועדו אך ורק לצורך התאמות שידוך במסגרת המאגר, וכי המידע נשמר בדיסקרטיות מלאה ומונגש אך ורק לצוות המנהל את המאגר באחריות ובשמירה על פרטיותי.";

const EMPTY = {
  gender: "male",
  name: "",
  phone: "",
  age: "",
  height: "",
  eda: "",
  tag: "",
  religiousLevel: "",
  region: REGIONS[0],
  city: "",
  currentOccupation: "",
  occupations: [],
  bio: "",
  complexityNotes: "",
  referenceContacts: "",
};

function Label({ children, required }) {
  return (
    <p className="mb-1.5 text-[13px] font-semibold text-[#3A3335]">
      {children}
      {required && <span className="text-[#C24545]"> *</span>}
    </p>
  );
}

function Field({ label, required, children, hint }) {
  return (
    <div>
      <Label required={required}>{label}</Label>
      {children}
      {hint && <p className="mt-1 text-[11px] leading-relaxed text-[#8A8285]">{hint}</p>}
    </div>
  );
}

const inputClass =
  "w-full rounded-2xl border border-[#EAE5E3] bg-white px-4 py-3 text-[14px] text-[#3A3335] outline-none transition placeholder:text-[#C9C2C4] focus:border-[#C98894] focus:ring-2 focus:ring-[#8C4A55]/15";

function ChoiceRow({ options, value, onChange, columns = 2 }) {
  return (
    <div className={`grid gap-2 ${columns === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
      {options.map((o) => {
        const active = value === o;
        return (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            className={`rounded-2xl border px-3 py-2.5 text-[13px] font-semibold transition active:scale-[0.98] ${
              active
                ? "border-[#8C4A55] bg-[#F6E4E6] text-[#6E3540]"
                : "border-[#EAE5E3] bg-white text-[#8A8285]"
            }`}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

export default function RegisterPage() {
  // search = שלב א' | form = שלב ב' | done = שלב ג'
  const [step, setStep] = useState("search");
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  // קוד התקלה מוצג בקטן, כדי שאפשר יהיה לשלוח צילום מסך אחד ולדעת מיד מה קרה
  const [errorCode, setErrorCode] = useState("");
  const [match, setMatch] = useState(null); // { id, name, availabilityStatus }
  const [savingStatus, setSavingStatus] = useState(false);
  const [statusSaved, setStatusSaved] = useState(false);

  const [form, setForm] = useState(EMPTY);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState("");
  // אישור הצהרת הפרטיות. בלעדיו אי אפשר לשלוח את הטופס.
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const fileRef = useRef(null);

  const set = (partial) => setForm((f) => ({ ...f, ...partial }));

  const religiousOptions = useMemo(() => religiousLevelsFor(form.gender).filter((o) => o !== "הכל"), [form.gender]);
  // רשימת המסלולים לפי המגדר שנבחר. מה שכבר סומן ממשיך להופיע גם אם
  // מחליפים מגדר, כדי שבחירה קיימת לא תיעלם מהמסך.
  const occupationOptions = useMemo(
    () => occupationsFor(form.gender, form.occupations),
    [form.gender, form.occupations]
  );
  const toggleOccupation = (o) =>
    setForm((f) => {
      const cur = f.occupations || [];
      return { ...f, occupations: cur.includes(o) ? cur.filter((x) => x !== o) : [...cur, o] };
    });

  // --- שלב א': בדיקה מול המאגר ---
  const handleSearch = async () => {
    // מנסים את כל צורות המפתח של השם: כפי שהוקלד, וגם בלי תלות בסדר המילים.
    const keys = nameKeys(query);
    if (keys.length === 0) {
      setSearchError("צריך להקליד שם מלא");
      return;
    }
    setSearching(true);
    setSearchError("");
    setMatch(null);
    try {
      let found = null;
      let lastError = null;
      for (const key of keys) {
        try {
          const snap = await getDoc(doc(crmDb, "nameIndex", key));
          if (snap.exists()) {
            found = snap.data();
            break;
          }
        } catch (err) {
          lastError = err;
        }
      }

      // אף מפתח לא נבדק בהצלחה - זו תקלה, לא "לא נמצא"
      if (!found && lastError) throw lastError;

      if (!found) {
        // באמת אין רשומה כזו - ממשיכים ישירות לטופס, עם השם שכבר הוקלד
        set({ name: query.trim() });
        setStep("form");
        return;
      }

      const candidateId = found.candidateId;
      const statusSnap = await getDoc(doc(crmDb, "candidateStatus", candidateId));
      setMatch({
        id: candidateId,
        name: statusSnap.data()?.name || found.name || query.trim(),
        availabilityStatus: statusSnap.data()?.availabilityStatus || AVAILABILITY[0],
      });
    } catch (err) {
      // הבחנה בין שתי תקלות שונות לגמרי: חסימה בשרת מול תקלת רשת.
      // בלי ההבחנה הזו שתיהן נראו אותו דבר, ולא היה אפשר לדעת מה לתקן.
      setSearchError(
        err?.code === "permission-denied"
          ? "הבדיקה מול המאגר עדיין לא נפתחה. אפשר להמשיך למילוי הטופס, ואנחנו נשמח לקבל את הפרטים."
          : "לא הצלחנו לבדוק כרגע - כנראה תקלת רשת. אפשר לנסות שוב, או להמשיך למילוי הטופס."
      );
      setErrorCode(err?.code || "unknown");
    } finally {
      setSearching(false);
    }
  };

  const handleUpdateStatus = async (status) => {
    if (!match || savingStatus) return;
    setSavingStatus(true);
    setStatusSaved(false);
    try {
      // האוסף הזה מכיל שם וסטטוס בלבד, והעדכון מוגבל לשדה הסטטוס
      await setDoc(doc(crmDb, "candidateStatus", match.id), { availabilityStatus: status }, { merge: true });
      setMatch((m) => ({ ...m, availabilityStatus: status }));
      setStatusSaved(true);
    } catch {
      setSearchError("העדכון לא נשמר. אפשר לנסות שוב.");
    } finally {
      setSavingStatus(false);
    }
  };

  // --- העלאת תמונה ---
  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPhotoUploading(true);
    setPhotoError("");
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok || !data?.url) throw new Error(data?.error || "ההעלאה נכשלה");
      setPhotoUrl(data.url);
    } catch (err) {
      setPhotoError(err?.message || "לא הצלחנו להעלות את התמונה. אפשר לנסות שוב.");
    } finally {
      setPhotoUploading(false);
    }
  };

  // --- שלב ג': שליחה ---
  const missing = [];
  if (!form.name.trim()) missing.push("שם מלא");
  if (!form.phone.trim()) missing.push("טלפון");
  if (!form.age) missing.push("גיל");
  if (!form.height) missing.push("גובה");
  if (!form.eda.trim()) missing.push("עדה");
  if (!form.tag) missing.push("שיוך");
  if (!photoUrl) missing.push("תמונה");
  if (!agreedToTerms) missing.push("אישור הצהרת הפרטיות");
  const ready = missing.length === 0;

  const handleSubmit = async () => {
    if (!ready || submitting) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      await addDoc(collection(crmDb, "intakeSubmissions"), {
        status: "pending",
        gender: form.gender,
        name: form.name.trim(),
        phone: form.phone.trim(),
        age: Number(form.age) || null,
        height: Number(form.height) || null,
        eda: form.eda.trim(),
        tag: form.tag,
        religiousLevel: form.religiousLevel || null,
        region: form.region,
        city: form.city.trim(),
        currentOccupation: form.currentOccupation.trim(),
        occupations: form.occupations || [],
        bio: form.bio.trim(),
        complexityNotes: form.complexityNotes.trim(),
        referenceContacts: form.referenceContacts.trim(),
        photoUrl,
        // תיעוד ההסכמה: מתי בדיוק אושרה, ומה בדיוק אושר
        termsAccepted: true,
        termsAcceptedAt: serverTimestamp(),
        termsText: PRIVACY_TEXT,
        createdAt: serverTimestamp(),
      });
      setStep("done");
      window.scrollTo({ top: 0 });
    } catch (err) {
      setSubmitError(`השליחה נכשלה. נסו שוב, ואם זה חוזר - צרו קשר עם המשרד. (${err?.code || ""})`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-dvh bg-[#F6F5F4] text-[#3A3335]" dir="rtl">
      <header className="border-b border-[#EAE5E3] bg-white/90 px-5 py-4 backdrop-blur safe-top">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/hands.jpg" alt="" className="h-11 w-11 shrink-0 rounded-2xl object-cover" />
          <div>
            <p className="text-[15px] font-bold leading-tight">הרשמה למאגר השידוכים</p>
            <p className="text-[12px] text-[#8A8285]">הפרטים נשמרים אצלנו בלבד ומטופלים בדיסקרטיות</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-5 pb-16 pt-6 safe-bottom">
        {/* ---------- שלב א': בדיקה במאגר ---------- */}
        {step === "search" && (
          <>
            <div className="rounded-3xl border border-[#EAE5E3] bg-white p-5 shadow-[0_4px_18px_rgba(58,51,53,0.06)]">
              <h1 className="text-[19px] font-bold">קודם כל - נבדוק אם כבר רשומים אצלנו</h1>
              <p className="mt-2 text-[13px] leading-relaxed text-[#8A8285]">
                הקלידו את השם המלא. אם הוא כבר במאגר, אפשר לעדכן מכאן את סטטוס הפניות. אם לא -
                נמשיך למילוי טופס קצר.
              </p>

              <div className="relative mt-4">
                <Search size={17} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#B5AEB0]" />
                <input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setMatch(null);
                    setSearchError("");
                    setErrorCode("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="שם פרטי ושם משפחה"
                  className={`${inputClass} pr-11`}
                />
              </div>

              {searchError && (
                <div className="mt-2">
                  <p className="text-[12px] leading-relaxed text-[#C24545]">{searchError}</p>
                  {errorCode && (
                    <p dir="ltr" className="mt-0.5 text-left text-[10px] text-[#C9C2C4]">{errorCode}</p>
                  )}
                </div>
              )}

              <button
                onClick={handleSearch}
                disabled={searching}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#8C4A55] py-3.5 text-[14px] font-bold text-white transition active:scale-[0.98] disabled:opacity-60"
              >
                {searching ? <Loader2 size={17} className="animate-spin" /> : <Search size={17} />}
                {searching ? "בודק..." : "בדיקה"}
              </button>

              <button
                onClick={() => {
                  set({ name: query.trim() });
                  setStep("form");
                }}
                className="mt-2 w-full py-2 text-[13px] font-semibold text-[#8C4A55] underline"
              >
                אני נרשם/ת בפעם הראשונה
              </button>
            </div>

            {match && (
              <div className="mt-4 rounded-3xl border border-[#E7CE93] bg-[#FFFCF5] p-5">
                <p className="text-[13px] font-semibold text-[#946200]">מצאנו אותך במאגר</p>
                <p className="mt-1 text-[18px] font-bold">{match.name}</p>
                <p className="mt-3 mb-2 text-[13px] font-semibold">מה הסטטוס שלך כרגע?</p>
                <ChoiceRow
                  options={AVAILABILITY}
                  value={match.availabilityStatus}
                  onChange={handleUpdateStatus}
                  columns={3}
                />
                {savingStatus && <p className="mt-2 text-[12px] text-[#8A8285]">שומר...</p>}
                {statusSaved && !savingStatus && (
                  <p className="mt-3 flex items-center gap-1.5 text-[13px] font-semibold text-[#20A66B]">
                    <Check size={15} /> הסטטוס עודכן, תודה!
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {/* ---------- שלב ב': הטופס ---------- */}
        {step === "form" && (
          <div className="space-y-4">
            <button
              onClick={() => setStep("search")}
              className="flex items-center gap-1 text-[13px] font-semibold text-[#8A8285]"
            >
              <ArrowRight size={15} /> חזרה
            </button>

            <div className="rounded-3xl border border-[#EAE5E3] bg-white p-5 shadow-[0_4px_18px_rgba(58,51,53,0.06)]">
              <h1 className="text-[19px] font-bold">נעים להכיר</h1>
              <p className="mt-1.5 text-[13px] leading-relaxed text-[#8A8285]">
                כמה פרטים, וצוות המשרד יחזור אליכם. שדות עם <span className="font-bold text-[#C24545]">*</span> הם חובה.
              </p>
            </div>

            <div className="space-y-4 rounded-3xl border border-[#EAE5E3] bg-white p-5">
              <Field label="בחור או בחורה" required>
                <ChoiceRow
                  options={["בחור", "בחורה"]}
                  value={form.gender === "female" ? "בחורה" : "בחור"}
                  onChange={(v) => set({ gender: v === "בחורה" ? "female" : "male", religiousLevel: "" })}
                />
              </Field>

              <Field label="שם מלא" required>
                <input
                  value={form.name}
                  onChange={(e) => set({ name: e.target.value })}
                  placeholder="שם פרטי ושם משפחה"
                  className={inputClass}
                />
              </Field>

              <Field label="טלפון" required hint="לשם כך ניצור אתכם קשר">
                <input
                  value={form.phone}
                  onChange={(e) => set({ phone: e.target.value })}
                  inputMode="tel"
                  dir="ltr"
                  placeholder="050-0000000"
                  className={`${inputClass} text-right`}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="גיל" required>
                  <input
                    value={form.age}
                    onChange={(e) => set({ age: e.target.value.replace(/\D/g, "").slice(0, 2) })}
                    inputMode="numeric"
                    placeholder="26"
                    className={inputClass}
                  />
                </Field>
                <Field label="גובה (ס״מ)" required>
                  <input
                    value={form.height}
                    onChange={(e) => set({ height: e.target.value.replace(/\D/g, "").slice(0, 3) })}
                    inputMode="numeric"
                    placeholder="175"
                    className={inputClass}
                  />
                </Field>
              </div>

              <Field label="עדה" required>
                <input
                  value={form.eda}
                  onChange={(e) => set({ eda: e.target.value })}
                  placeholder="אשכנזי, ספרדי, תימני, מעורב..."
                  className={inputClass}
                />
              </Field>

              <Field label="שיוך" required hint="בוחרים אפשרות אחת - זו שהכי מתארת אתכם">
                <ChoiceRow
                  options={CANDIDATE_TAGS.map((t) => t.name)}
                  value={form.tag}
                  onChange={(v) => set({ tag: v })}
                />
              </Field>

              <Field label="רמת תורניות">
                <ChoiceRow
                  options={religiousOptions}
                  value={form.religiousLevel}
                  onChange={(v) => set({ religiousLevel: v })}
                  columns={3}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="אזור">
                  <select
                    value={form.region}
                    onChange={(e) => set({ region: e.target.value })}
                    className={inputClass}
                  >
                    {REGIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="עיר">
                  <input value={form.city} onChange={(e) => set({ city: e.target.value })} className={inputClass} />
                </Field>
              </div>

              <Field label="מה אתם עושים היום">
                <input
                  value={form.currentOccupation}
                  onChange={(e) => set({ currentOccupation: e.target.value })}
                  placeholder="לימודים, עבודה, שירות..."
                  className={inputClass}
                />
              </Field>

              <Field label="המסלול שלי" hint="כל הדרכים שעברתם בחיים - אפשר לסמן כמה">
                <div className="flex flex-wrap gap-2">
                  {occupationOptions.map((o) => {
                    const active = form.occupations?.includes(o);
                    return (
                      <button
                        key={o}
                        type="button"
                        onClick={() => toggleOccupation(o)}
                        className={`rounded-full border px-3 py-1.5 text-[12px] font-semibold transition active:scale-95 ${
                          active
                            ? "border-transparent bg-[#8C4A55] text-white"
                            : "border-[#EAE5E3] bg-white text-[#3A3335]"
                        }`}
                      >
                        {o}
                      </button>
                    );
                  })}
                </div>
              </Field>
            </div>

            <div className="space-y-4 rounded-3xl border border-[#EAE5E3] bg-white p-5">
              <Field label="תיאור אישי" hint="כמה מילים עליכם - מי אתם, מה חשוב לכם, מה אתם מחפשים">
                <textarea
                  value={form.bio}
                  onChange={(e) => set({ bio: e.target.value })}
                  rows={5}
                  className={`${inputClass} resize-none leading-relaxed`}
                />
              </Field>

              <Field
                label="מורכבויות או דברים שחשוב שנדע"
                hint="הכל נשאר אצלנו. זה עוזר לנו להציע התאמה נכונה ולא לבזבז לכם זמן"
              >
                <textarea
                  value={form.complexityNotes}
                  onChange={(e) => set({ complexityNotes: e.target.value })}
                  rows={4}
                  className={`${inputClass} resize-none leading-relaxed`}
                />
              </Field>

              <Field label="מספרים לבירורים" hint="שמות ומספרים של אנשים שאפשר לדבר איתם עליכם">
                <textarea
                  value={form.referenceContacts}
                  onChange={(e) => set({ referenceContacts: e.target.value })}
                  rows={3}
                  placeholder={"הרב כהן - 050-0000000\nחברה מהסמינר - 052-0000000"}
                  className={`${inputClass} resize-none leading-relaxed`}
                />
              </Field>
            </div>

            <div className="rounded-3xl border border-[#EAE5E3] bg-white p-5">
              <Label required>תמונה אישית</Label>
              {photoUrl ? (
                <div className="relative overflow-hidden rounded-2xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoUrl} alt="התמונה שהועלתה" className="h-56 w-full object-cover" />
                  <button
                    onClick={() => setPhotoUrl(null)}
                    aria-label="הסרת התמונה"
                    className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#3A3335] shadow"
                  >
                    <X size={17} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={photoUploading}
                  className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#D8CFCB] bg-[#FBFAF9] text-[#8C4A55] transition active:scale-[0.99] disabled:opacity-60"
                >
                  {photoUploading ? <Loader2 size={22} className="animate-spin" /> : <Camera size={22} />}
                  <span className="text-[13px] font-semibold">
                    {photoUploading ? "מעלה את התמונה..." : "בחירת תמונה"}
                  </span>
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
              {photoError && <p className="mt-2 text-[12px] leading-relaxed text-[#C24545]">{photoError}</p>}
            </div>

            {/* אישור הצהרת הפרטיות - שדה חובה, ממש לפני השליחה */}
            <label className="flex cursor-pointer items-start gap-3 rounded-3xl border border-[#EAE5E3] bg-white p-4">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 h-5 w-5 shrink-0 accent-[#8C4A55]"
              />
              <span className="text-[12px] leading-relaxed text-[#3A3335]">
                {PRIVACY_TEXT}
                <span className="text-[#C24545]"> *</span>
              </span>
            </label>

            {!ready && (
              <p className="rounded-2xl bg-[#FFF3E4] px-4 py-3 text-[12px] leading-relaxed text-[#B45309]">
                חסר עוד: {missing.join(", ")}
              </p>
            )}
            {submitError && (
              <p className="rounded-2xl bg-red-50 px-4 py-3 text-[12px] leading-relaxed text-[#C24545]">{submitError}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={!ready || submitting}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#8C4A55] py-4 text-[15px] font-bold text-white transition active:scale-[0.98] disabled:opacity-40"
            >
              {submitting && <Loader2 size={17} className="animate-spin" />}
              {submitting ? "שולח..." : "שליחת הפרטים"}
            </button>
          </div>
        )}

        {/* ---------- שלב ג': סיום ---------- */}
        {step === "done" && (
          <div className="mt-8 rounded-3xl border border-[#EAE5E3] bg-white p-7 text-center shadow-[0_4px_18px_rgba(58,51,53,0.06)]">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#F6E4E6]">
              <Heart size={28} className="fill-[#8C4A55] text-[#8C4A55]" />
            </div>
            <h1 className="text-[21px] font-bold">קיבלנו את הפרטים</h1>
            <p className="mt-3 text-[14px] leading-relaxed text-[#8A8285]">
              תודה שסיפרתם לנו עליכם. הפרטים הגיעו לצוות המשרד, ואנחנו נעבור עליהם באופן אישי.
              <br />
              ניצור אתכם קשר בהקדם.
            </p>
            <p className="mt-5 rounded-2xl bg-[#F6F5F4] px-4 py-3 text-[12px] leading-relaxed text-[#8A8285]">
              הפרטים שמסרתם שמורים אצלנו בדיסקרטיות מלאה ואינם נחשפים לאף גורם מחוץ לצוות.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
