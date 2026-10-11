"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "./Header";
import DateField from "./DateField";
import { PERSONAL_FIELDS, REFERENCES_QUESTION, genderLabel } from "../lib/questions";
import { loadData, addIntake } from "../lib/store";
import { compressImage } from "../lib/image";
import { User, Briefcase, Camera, MessageCircle, Contact, Lightbulb, ChevronRight, ChevronLeft } from "lucide-react";

// פרטי הליבה מחולקים לשני שלבים קצרים; ה-Schema זהה, רק התצוגה מדורגת.
const CORE_FIELDS = PERSONAL_FIELDS.slice(0, 6);  // שם, מגורים, גיל, ת.לידה, גובה, עדה
const OCC_FIELDS = PERSONAL_FIELDS.slice(6);      // עיסוק, תואר, הורים, טלפון

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
  const [step, setStep] = useState(0);
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

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }
  function setRef(i, key, value) {
    setRefs((r) => r.map((item, idx) => (idx === i ? { ...item, [key]: value } : item)));
  }

  async function onPhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setPhoto(await compressImage(file));
    } catch (err) {
      setError("בעיה בטעינת התמונה. נסו לצלם מחדש או לבחור תמונה אחרת (רצוי בפורמט JPG).");
    }
  }

  // ----- שלבי האשף -----
  const steps = [
    { title: "פרטים אישיים", icon: User },
    { title: "עיסוק ותמונה", icon: Briefcase },
    { title: "קצת עליך", icon: MessageCircle },
    { title: "אנשי קשר", icon: Contact },
  ];
  const lastStep = steps.length - 1;

  function validateStep(s) {
    if (s === 0) {
      for (const f of CORE_FIELDS) {
        if (!form[f.key] || String(form[f.key]).trim() === "") return `נא למלא: ${genderLabel(f, gender)}`;
      }
    }
    if (s === 1) {
      for (const f of OCC_FIELDS) {
        if (!form[f.key] || String(form[f.key]).trim() === "") return `נא למלא: ${genderLabel(f, gender)}`;
      }
      if (!photo) return "נא להוסיף תמונה";
    }
    if (s === 2) {
      for (const q of openQuestions) {
        if (!form[q.key] || String(form[q.key]).trim() === "") return "נא לענות על כל השאלות";
      }
    }
    if (s === 3) {
      for (const r of refs) {
        if (!r.name.trim() || !r.relation.trim() || !r.phone.trim()) return "נא למלא את פרטי שני אנשי הקשר";
      }
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
      // נכנס לתור הממתינים (intakeSubmissions) - לא ישירות למאגר.
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
              <div key={i} className={`h-1.5 flex-1 rounded-full transition ${i <= step ? "bg-rose" : "bg-sand"}`} />
            ))}
          </div>
        </div>

        {/* הקדמה - רק בשלב הראשון */}
        {step === 0 && intro && (
          <div className="mb-5 rounded-3xl bg-blush/60 px-5 py-4 text-center text-base font-medium leading-relaxed text-ink">
            {intro}
          </div>
        )}

        {step === 0 && inApp && (
          <div className="mb-4 flex items-start gap-2 rounded-2xl bg-amber-100 px-4 py-3 text-sm font-medium text-amber-800">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} /> <span>פתחתם מתוך אפליקציה (וואטסאפ/אינסטגרם). כדי שהשליחה תעבוד חלק, מומלץ לפתוח את הדף בדפדפן.</span>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-2xl bg-rose/10 px-4 py-3 text-sm font-medium text-roseDark">{error}</div>
        )}

        {/* ----- תוכן השלב ----- */}
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
        </div>

        {/* ----- ניווט בין שלבים ----- */}
        <div className="mt-5 flex items-center gap-3">
          {step > 0 && (
            <button type="button" onClick={goPrev} className="btn-soft flex-1"><ChevronRight className="h-4 w-4" strokeWidth={2} /> הקודם</button>
          )}
          {step < lastStep ? (
            <button type="button" onClick={goNext} className="btn-primary flex-1">הבא <ChevronLeft className="h-4 w-4" strokeWidth={2} /></button>
          ) : (
            <button type="button" onClick={onSubmit} disabled={submitting} className="btn-primary flex-1">{submitting ? "שולח…" : "שליחה"}</button>
          )}
        </div>
        {step === lastStep && (
          <p className="mt-3 text-center text-xs text-ink/50">לאחר השליחה תתבקשו לבחור מסלול.</p>
        )}
      </main>
    </div>
  );
}
