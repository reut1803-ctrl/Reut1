"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "./Header";
import DateField from "./DateField";
import { PERSONAL_FIELDS, REFERENCES_QUESTION, genderLabel } from "../lib/questions";
import { loadData, addIntake } from "../lib/store";
import { compressImage } from "../lib/image";
import { User, Briefcase, Camera, MessageCircle, Contact, Lightbulb, ChevronRight, ChevronLeft, ShieldCheck, Heart, Coffee, Croissant, FileText } from "lucide-react";
import AgreementModal from "./AgreementModal";

const CORE_FIELDS = PERSONAL_FIELDS.slice(0, 6);
const OCC_FIELDS = PERSONAL_FIELDS.slice(6);

// הסרת אימוג'ים מטקסט (כדי להחליף את הקפה/קרואסון באיור מונפש).
const stripEmoji = (s) => (s || "").replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{1F1E6}-\u{1F1FF}\u{FE0F}\u{200D}]/gu, "").trim();

export default function Questionnaire({ gender }) {
  const router = useRouter();
  const genderText = gender === "female" ? "בחורה" : "בחור";

  const DRAFT_KEY = `shidduch_draft_${gender}`;
  function loadDraft() {
    if (typeof window === "undefined") return null;
    try {
      const r = localStorage.getItem(DRAFT_KEY);
      return r ? JSON.parse(r) : null;
    } catch (e) {
      return null;
    }
  }

  const [openQuestions, setOpenQuestions] = useState([]);
  const [intro, setIntro] = useState("");
  const [inApp, setInApp] = useState(false);
  const [started, setStarted] = useState(false); // מסך פתיחה (ברכה) לפני הטופס
  const [showAgreement, setShowAgreement] = useState(false);
  const [step, setStep] = useState(0);
  const [agree, setAgree] = useState(false);
  const [form, setForm] = useState(() => loadDraft()?.form || {});
  const [photo, setPhoto] = useState(() => loadDraft()?.photo || "");
  const [refs, setRefs] = useState(
    () => loadDraft()?.refs || [
      { name: "", relation: "", phone: "" },
      { name: "", relation: "", phone: "" },
    ]
  );
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const data = loadData();
    setOpenQuestions(data.openQuestions || []);
    const it = data.intro || {};
    setIntro(gender === "female" ? it.female : it.male);
  }, [gender]);

  useEffect(() => {
    const ua = navigator.userAgent || "";
    setInApp(/FBAN|FBAV|Instagram|Line\/|Twitter|Snapchat|Pinterest|; wv\)/i.test(ua));
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, photo, refs }));
    } catch (e) {}
  }, [form, photo, refs, DRAFT_KEY]);

  function setField(key, value) { setForm((f) => ({ ...f, [key]: value })); }
  function setRef(i, key, value) { setRefs((r) => r.map((item, idx) => (idx === i ? { ...item, [key]: value } : item))); }

  async function onPhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setPhoto(await compressImage(file));
    } catch (err) {
      setError("בעיה בטעינת התמונה. נסו לצלם מחדש או לבחור תמונה אחרת (רצוי בפורמט JPG).");
    }
  }

  const steps = [
    { title: "פרטים אישיים", icon: User },
    { title: "עיסוק ותמונה", icon: Briefcase },
    { title: "קצת עליך", icon: MessageCircle },
    { title: "אנשי קשר", icon: Contact },
    { title: "אישור וסיום", icon: ShieldCheck },
  ];
  const lastStep = steps.length - 1;

  function validateStep(s) {
    if (s === 0) {
      for (const f of CORE_FIELDS) if (!form[f.key] || String(form[f.key]).trim() === "") return `נא למלא: ${genderLabel(f, gender)}`;
    }
    if (s === 1) {
      for (const f of OCC_FIELDS) if (!form[f.key] || String(form[f.key]).trim() === "") return `נא למלא: ${genderLabel(f, gender)}`;
      if (!photo) return "נא להוסיף תמונה";
    }
    if (s === 2) {
      for (const q of openQuestions) if (!form[q.key] || String(form[q.key]).trim() === "") return "נא לענות על כל השאלות";
    }
    if (s === 3) {
      for (const r of refs) if (!r.name.trim() || !r.relation.trim() || !r.phone.trim()) return "נא למלא את פרטי שני אנשי הקשר";
    }
    if (s === 4) {
      if (!agree) return "נא לאשר את תיבת הפרטיות כדי לסיים";
    }
    return "";
  }

  function goNext() {
    const err = validateStep(step);
    if (err) { setError(err); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    setError("");
    setStep((s) => Math.min(s + 1, lastStep));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function goPrev() {
    setError("");
    setStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function onSubmit() {
    const err = validateStep(lastStep);
    if (err) { setError(err); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    const answers = {};
    openQuestions.forEach((q) => { answers[q.key] = form[q.key]; });
    setSubmitting(true);
    let ref;
    try {
      ref = await addIntake({
        gender,
        fullName: form.fullName,
        location: form.location,
        age: form.age,
        birthDate: form.birthDate,
        height: form.height,
        community: form.community,
        work: form.work,
        degree: form.degree,
        parentsWork: form.parentsWork,
        phone: form.phone,
        photo,
        answers,
        references: refs,
      });
    } catch (err) {
      setSubmitting(false);
      setError("אירעה תקלה בשליחה. ודאו חיבור לאינטרנט ונסו שוב. אם פתחתם מתוך וואטסאפ/אינסטגרם — כדאי לפתוח את הדף בדפדפן (Chrome/Safari). מה שמילאתם נשמר ולא אבד.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}
    router.push(`/thank-you?id=${ref.id}`);
  }

  // ----- מסך פתיחה (ברכה) -----
  if (!started) {
    return (
      <div>
        <Header />
        <main className="mx-auto max-w-md px-4 pb-20 pt-8">
          <div className="card relative space-y-4 pb-14 text-center">
            <h1 className="animate-fadein text-xl font-bold leading-relaxed text-roseDark" style={{ animationDelay: "0ms" }}>
              ברוכים הבאים למערכת ההרשמה של מיזם שידוכים "הקהילה איתך"
            </h1>
            <p className="animate-fadein text-sm font-medium text-ink/60" style={{ animationDelay: "150ms" }}>לתלמידי הרב הלומדים מתורתו</p>
            <p className="animate-fadein text-base leading-relaxed text-ink/80" style={{ animationDelay: "300ms" }}>
              אנו רואים זכות גדולה ללוות אתכם בתהליך המשמעותי הזה, באכפתיות, במסירות ובלב פתוח.
            </p>
            <blockquote className="animate-fadein mx-auto rounded-2xl border-r-4 border-rose/50 bg-blush/50 px-5 py-4 text-right text-base italic leading-relaxed text-ink/90" style={{ animationDelay: "450ms" }}>
              "ברכה להצלחה רבה במיזם השידוכים על טהרת הקדש. שירבו בתים נאמנים בישראל! ברכת כוח"ט לשנה טובה ומתוקה!"
              <footer className="mt-2 text-sm font-bold not-italic text-roseDark">— הרב יצחק גינזבורג</footer>
            </blockquote>
            <div className="animate-fadein" style={{ animationDelay: "600ms" }}>
              <button type="button" onClick={() => setShowAgreement(true)} className="mx-auto flex items-center justify-center gap-1.5 text-sm text-ink/55 underline underline-offset-4 hover:text-rose">
                <FileText className="h-4 w-4" strokeWidth={1.75} /> לקריאת הסכם ההתקשרות ומדיניות הפרטיות
              </button>
            </div>

            {/* כפתור "שובר מסגרת": חצי בתוך הכרטיס, חצי מחוצה לו */}
            <div className="absolute inset-x-0 bottom-0 flex translate-y-1/2 justify-center">
              <button
                onClick={() => setStarted(true)}
                className="animate-fadein rounded-full border border-[#CBB089]/60 px-10 py-3.5 text-center shadow-[0_18px_34px_-10px_rgba(70,18,30,0.7),0_4px_10px_rgba(70,18,30,0.2)] transition active:scale-[0.98]"
                style={{ animationDelay: "650ms", background: "linear-gradient(155deg,#8a3344,#551828)" }}
              >
                <span className="flex items-center justify-center gap-2 text-lg font-bold text-[#FBF3E6]"><Heart className="h-5 w-5" strokeWidth={1.75} /> להצטרפות למאגר</span>
                <span className="mt-0.5 block text-[11px] font-medium tracking-[0.25em] text-[#E6CF9F]">הקהילה איתך</span>
              </button>
            </div>
          </div>
        </main>
        {showAgreement && <AgreementModal onClose={() => setShowAgreement(false)} />}
      </div>
    );
  }

  const StepIcon = steps[step].icon;

  return (
    <div>
      <Header />
      <main className="mx-auto max-w-md px-4 py-6 pb-28">
        <h1 className="mb-1 text-2xl font-bold text-roseDark">שאלון היכרות</h1>
        <p className="mb-4 text-sm text-ink/60">מסלול: {genderText}</p>

        {/* פס התקדמות השלבים */}
        <div className="mb-5">
          <div className="mb-2 flex items-center justify-between text-xs font-semibold text-ink/60">
            <span className="flex items-center gap-1.5 text-roseDark"><StepIcon className="h-4 w-4" strokeWidth={1.75} /> {steps[step].title}</span>
            <span>שלב {step + 1} מתוך {steps.length}</span>
          </div>
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= step ? "bg-rose" : "bg-sand"}`} />
            ))}
          </div>
        </div>

        {step === 0 && intro && (
          <div className="mb-5 rounded-3xl bg-blush/60 px-5 py-5 text-center">
            <div className="mb-2 flex items-center justify-center gap-3 text-rose">
              <Coffee className="animate-float h-9 w-9" strokeWidth={1.5} />
              <Croissant className="animate-float h-9 w-9" strokeWidth={1.5} style={{ animationDelay: "600ms" }} />
            </div>
            <p className="text-base font-medium leading-relaxed text-ink">{stripEmoji(intro)}</p>
          </div>
        )}
        {step === 0 && inApp && (
          <div className="mb-4 flex items-start gap-2 rounded-2xl bg-amber-100 px-4 py-3 text-sm font-medium text-amber-800">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} /> <span>פתחתם מתוך אפליקציה (וואטסאפ/אינסטגרם). כדי שהשליחה תעבוד חלק, מומלץ לפתוח את הדף בדפדפן.</span>
          </div>
        )}
        {error && <div className="mb-4 rounded-2xl bg-rose/10 px-4 py-3 text-sm font-medium text-roseDark">{error}</div>}

        {/* ----- תוכן השלב (עם מעבר רך) ----- */}
        <div key={step} className="animate-fadein">
          <div className="card space-y-4">
            {step === 0 && CORE_FIELDS.map((f) => (
              <div key={f.key}>
                <label className="field-label">{genderLabel(f, gender)}</label>
                {f.type === "date" ? (
                  <DateField value={form[f.key]} onChange={(v) => setField(f.key, v)} />
                ) : (
                  <input className="field-input" type={f.type} value={form[f.key] || ""} onChange={(e) => setField(f.key, e.target.value)} />
                )}
              </div>
            ))}

            {step === 1 && (
              <>
                {OCC_FIELDS.map((f) => (
                  <div key={f.key}>
                    <label className="field-label">{genderLabel(f, gender)}</label>
                    <input className="field-input" type={f.type} value={form[f.key] || ""} onChange={(e) => setField(f.key, e.target.value)} />
                  </div>
                ))}
                <div>
                  <label className="field-label flex items-center gap-1.5"><Camera className="h-4 w-4" strokeWidth={1.75} /> הוספת תמונה</label>
                  <input className="field-input" type="file" accept="image/*" onChange={onPhoto} />
                  {photo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photo} alt="תצוגה מקדימה" className="mt-3 h-28 w-28 rounded-2xl object-cover" />
                  )}
                </div>
              </>
            )}

            {step === 2 && (
              openQuestions.length === 0
                ? <p className="text-sm text-ink/50">אין שאלות נוספות. אפשר להמשיך.</p>
                : openQuestions.map((q) => (
                  <div key={q.key}>
                    <label className="field-label">{genderLabel(q, gender)}</label>
                    <textarea className="field-input min-h-[90px]" value={form[q.key] || ""} onChange={(e) => setField(q.key, e.target.value)} />
                  </div>
                ))
            )}

            {step === 3 && (
              <>
                <p className="text-sm text-ink/70">{REFERENCES_QUESTION}</p>
                {refs.map((r, i) => (
                  <div key={i} className="space-y-2 rounded-2xl bg-blush/40 p-3">
                    <p className="text-sm font-medium text-roseDark">איש קשר {i + 1}</p>
                    <input className="field-input" placeholder="שם" value={r.name} onChange={(e) => setRef(i, "name", e.target.value)} />
                    <input className="field-input" placeholder="מה הם בשבילך" value={r.relation} onChange={(e) => setRef(i, "relation", e.target.value)} />
                    <input className="field-input" placeholder="טלפון" type="tel" value={r.phone} onChange={(e) => setRef(i, "phone", e.target.value)} />
                  </div>
                ))}
              </>
            )}

            {step === 4 && (
              <>
                {/* בלוק A: עלויות והצטרפות */}
                <div className="rounded-2xl bg-blush/40 p-4">
                  <p className="mb-2 text-base font-bold text-roseDark">עלויות והצטרפות</p>
                  <p className="text-sm leading-relaxed text-ink/80">ההצטרפות למאגר — <b>ללא עלות ובלי התחייבות</b>.</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink/80">דמי הצלחה — <b>2,000 ₪ מכל צד</b>, משולמים בווארט אך ורק כאשר קיבלתם החלטה להינשא בעז"ה.</p>
                  <button type="button" onClick={() => setShowAgreement(true)} className="mt-3 flex items-center gap-1.5 text-sm font-medium text-roseDark underline underline-offset-4 hover:text-rose">
                    <FileText className="h-4 w-4" strokeWidth={1.75} /> לקריאת הסכם ההתקשרות ומדיניות הפרטיות
                  </button>
                </div>

                {/* בלוק B: אישור פרטיות (חובה) */}
                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-sand bg-white/70 p-4 transition hover:border-rose/40">
                  <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-rose" checked={agree} onChange={(e) => { setAgree(e.target.checked); setError(""); }} />
                  <span className="text-sm leading-relaxed text-ink/80">
                    ידוע לי שהפרטים נועדו אך ורק לצורך התאמות שידוך. המידע מגיע להנהלת המיזם ול"שגרירים" שפועלים באכפתיות. אני מאשר/ת שהמידע יישמר במאגר סגור בדיסקרטיות מלאה, ולא יועבר לצד שלישי. <span className="text-roseDark">*</span>
                  </span>
                </label>
              </>
            )}
          </div>
        </div>

        {/* ----- ניווט בין שלבים ----- */}
        <div className="sticky-actions -mx-4 mt-5 flex items-center gap-3 px-4">
          {step > 0 && (
            <button type="button" onClick={goPrev} className="btn-soft flex-1"><ChevronRight className="h-4 w-4" strokeWidth={2} /> הקודם</button>
          )}
          {step < lastStep ? (
            <button type="button" onClick={goNext} className="btn-primary flex-1">הבא <ChevronLeft className="h-4 w-4" strokeWidth={2} /></button>
          ) : (
            <button type="button" onClick={onSubmit} disabled={submitting} className="btn-primary flex-1">{submitting ? "שולח…" : "שליחה"}</button>
          )}
        </div>
      </main>
      {showAgreement && <AgreementModal onClose={() => setShowAgreement(false)} />}
    </div>
  );
}
