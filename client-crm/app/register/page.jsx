"use client";

// טופס ההרשמה החיצוני של המאגר.
//
// אשף בארבעה שלבים, פתוח לכל אחד בלי התחברות. הפניות אינן נכנסות
// ישירות למאגר המועמדים אלא לאוסף נפרד (intakeSubmissions), והמנהלת
// היא שמאשרת ויוצרת מהן כרטיס. כך המאגר נשאר סגור לכתיבה מבחוץ.
//
// העמוד אינו מחזיק רשימת שאלות משלו: הוא מצייר את מה שכתוב במפת
// השאלות (lib/crm/formSchema.js) אחרי שהוחלו עליה ההגדרות שהמנהלת
// קבעה בלוח הבקרה. לכן כיבוי שאלה, שינוי נוסח או שינוי סדר משתקפים
// כאן מיד, בלי לגעת בקוד.
//
// חלוקת השדות: פרטי הליבה נשמרים כל אחד בשדה נפרד, ותשובות העומק
// מתמזגות לפסקה אחת שנכנסת ל"תיאור אישי". ראו lib/crm/bioNarrative.js.

import { useMemo, useState } from "react";
import { addDoc, collection, doc, updateDoc } from "firebase/firestore";
import { Check, AlertCircle, Camera, X, Loader2, ChevronLeft, ChevronRight, HandHeart } from "lucide-react";
import { crmDb } from "@/lib/crm/firebaseClient";
import { uploadToCloudinary } from "@/lib/crm/cloudinary";
import { compressImage } from "@/lib/crm/compressImage";
import { APP_NAME, APP_SUBTITLE, LOGO_SRC } from "@/lib/appConfig";
import { ELEMENTS, describeScale, ageFromBirthDate } from "@/lib/crm/registerForm";
import { visibleItems, optionsOf, scaleOf, missingItems, customAnswersText } from "@/lib/crm/formSchema";
import {
  StepIndicator, Field, TextInput, TextArea, Select, ChipGroup, ScaleSlider,
} from "@/components/crm/register/FormBits";
import PersonalTrackOffer from "@/components/crm/register/PersonalTrackOffer";
import { cleanTrackMessage } from "@/lib/crm/personalTrack";
import { narrativeFromForm } from "@/lib/crm/bioNarrative";
import { usePublicContent } from "@/lib/crm/usePublicContent";

const MAX_PHOTOS = 4;
const LAST_STEP = 3;

const EMPTY = {
  gender: "female",
  name: "",
  phone: "",
  birthDate: "",
  age: "",
  maritalStatus: "",
  height: "",
  eda: "",
  region: "",
  city: "",
  lifestyle: "",
  breslov: "",
  currentOccupation: "",
  occupations: [],
  pathStory: "",
  introExtro: 5,
  heartMind: 5,
  planFlow: 5,
  element: "",
  elementWhy: "",
  familyBackground: "",
  hobbies: "",
  importantToKnow: "",
  selfDescription: "",
  lookingFor: "",
  preferredAges: "",
  mainRequirements: "",
  breslovInPartner: "",
  smokingSelf: "",
  referenceContacts: "",
};

export default function RegisterPage() {
  const { content, loaded: contentLoaded } = usePublicContent();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(EMPTY);
  // תשובות לשאלות שהמנהלת הוסיפה בעצמה
  const [custom, setCustom] = useState({});
  const [photos, setPhotos] = useState([]);
  const [photoBusy, setPhotoBusy] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [done, setDone] = useState(false);
  // מזהה הפנייה שנוצרה, כדי שמסך הסיום יוכל לצרף אליה את בחירת המסלול
  const [intakeId, setIntakeId] = useState("");

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const items = useMemo(() => visibleItems(content, step), [content, step]);
  const missing = useMemo(
    () => missingItems(content, form, { photos, custom, agreeTerms, agreePrivacy }),
    [content, form, photos, custom, agreeTerms, agreePrivacy]
  );

  const handlePhotos = async (fileList) => {
    setPhotoError("");
    const files = Array.from(fileList || []).slice(0, MAX_PHOTOS - photos.length);
    if (files.length === 0) return;
    for (const file of files) {
      try {
        setPhotoBusy(`מעלה את ${file.name || "התמונה"}...`);
        // כיווץ לפני ההעלאה: תמונה מהטלפון שוקלת מגה-בייטים, וזה גם
        // מאט את ההעלאה ברשת סלולרית וגם מייקר אחסון בלי שום תועלת.
        const blob = await compressImage(file, { maxDimension: 1400, quality: 0.82 });
        const url = await uploadToCloudinary(new File([blob], file.name || "photo.jpg", { type: "image/jpeg" }));
        setPhotos((prev) => (prev.length >= MAX_PHOTOS ? prev : [...prev, url]));
      } catch (err) {
        setPhotoError(err?.message || "העלאת התמונה נכשלה. אפשר לנסות שוב.");
      }
    }
    setPhotoBusy("");
  };

  const handleSubmit = async () => {
    if (missing.length > 0) {
      setSubmitError(`עוד רגע ואנחנו שם. חסר: ${missing.map((m) => m.label).join(" · ")}`);
      setStep(missing[0].step);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    try {
      const age = ageFromBirthDate(form.birthDate) ?? (form.age ? Number(form.age) : null);
      // status:"pending" הוא תנאי בכללי האבטחה בשרת, ולכן חייב להישלח כך
      const ref = await addDoc(collection(crmDb, "intakeSubmissions"), {
        status: "pending",
        source: "register-form",
        createdAt: new Date().toISOString(),

        // --- שדות ליבה: כל אחד בשדה משלו, ניתנים לסינון ולחיפוש ---
        gender: form.gender === "male" ? "male" : "female",
        name: form.name.trim(),
        phone: form.phone.trim(),
        birthDate: form.birthDate || "",
        age: Number.isFinite(age) ? age : null,
        maritalStatus: form.maritalStatus || "",
        height: form.height ? Number(form.height) : null,
        eda: form.eda.trim(),
        region: form.region,
        city: form.city.trim(),
        religiousLevel: form.lifestyle || null,
        currentOccupation: form.currentOccupation.trim(),
        occupations: form.occupations,
        referenceContacts: form.referenceContacts.trim(),

        // התמונה הראשונה היא הראשית של הכרטיס
        photo: photos[0] || "",
        photoUrls: photos,

        // --- תשובות העומק, ממוזגות לפסקה אחת ---
        // המנגנון קבוע: תשובות העומק מתמזגות לפסקה אחת. מה שדינמי הוא
        // רק אילו שאלות נשאלו, ולכן מבנה הכרטיס אינו משתנה.
        bio: [narrativeFromForm(form), customAnswersText(content, custom)].filter(Boolean).join("\n\n"),
        customAnswers: custom,

        consentAccepted: true,
        termsAcceptedAt: new Date().toISOString(),
        privacyAcceptedAt: new Date().toISOString(),
      });
      setIntakeId(ref.id);
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setSubmitError("השליחה לא הצליחה כרגע. אפשר לנסות שוב בעוד רגע.");
    } finally {
      setSubmitting(false);
    }
  };

  // קישור חיצוני פעיל: כל ההרשמה עוברת לשם, והטופס הפנימי אינו מוצג
  if (contentLoaded && content.externalFormUrl) {
    return <ExternalRedirect url={content.externalFormUrl} />;
  }

  if (done) return <ThankYou intakeId={intakeId} content={content} />;

  const note = content.stepNotes?.[step] || "";

  return (
    <main className="min-h-screen bg-[#F2F8FB] px-4 py-8" dir="rtl">
      <div className="mx-auto w-full max-w-lg">
        <header className="mb-6 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO_SRC} alt={APP_NAME} className="mx-auto mb-3 w-48 max-w-[65%] object-contain" />
          <p className="text-[14px] font-semibold text-[#1F6E88]">{APP_SUBTITLE}</p>
        </header>

        {step === 0 && <Welcome content={content} />}

        <div className="rounded-3xl border border-[#CFE3EC] bg-white p-5 shadow-[0_4px_18px_rgba(31,110,136,0.06)]">
          <StepIndicator steps={content.stepTitles} current={step} onJump={setStep} />

          {note && (
            <p className="mb-4 whitespace-pre-line rounded-2xl bg-[#EAF5FA] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[#1F6E88]">
              {note}
            </p>
          )}

          <StepBody
            items={items}
            form={form}
            set={set}
            custom={custom}
            setCustom={setCustom}
            photos={photos}
            setPhotos={setPhotos}
            photoBusy={photoBusy}
            photoError={photoError}
            onPhotos={handlePhotos}
            agreeTerms={agreeTerms}
            setAgreeTerms={setAgreeTerms}
            agreePrivacy={agreePrivacy}
            setAgreePrivacy={setAgreePrivacy}
            content={content}
          />

          {items.length === 0 && (
            <p className="rounded-2xl bg-[#F2F8FB] px-3.5 py-4 text-center text-[13px] text-[#5E7A87]">
              אין שאלות בשלב הזה. אפשר להמשיך הלאה.
            </p>
          )}

          {submitError && (
            <p className="mt-4 flex items-start gap-1.5 rounded-2xl bg-[#FDECEA] px-3.5 py-3 text-[13px] leading-relaxed text-[#C4584C]">
              <AlertCircle size={16} className="mt-0.5 shrink-0" /> {submitError}
            </p>
          )}

          <div className="mt-6 flex gap-2">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="flex items-center justify-center gap-1 rounded-2xl border border-[#CFE3EC] bg-white px-4 py-3 text-[14px] font-semibold text-[#23414E] transition active:scale-95"
              >
                <ChevronRight size={16} /> חזרה
              </button>
            )}
            {step < LAST_STEP ? (
              <button
                type="button"
                onClick={() => {
                  setStep((s) => s + 1);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="flex flex-1 items-center justify-center gap-1 rounded-2xl bg-[#2E8BA8] px-4 py-3 text-[15px] font-bold text-white shadow transition active:scale-95 hover:bg-[#1F6E88]"
              >
                לשלב הבא <ChevronLeft size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-[#2E8BA8] px-4 py-3 text-[15px] font-bold text-white shadow transition active:scale-95 hover:bg-[#1F6E88] disabled:opacity-60"
              >
                {submitting ? <Loader2 size={17} className="animate-spin" /> : <HandHeart size={17} />}
                {submitting ? "שולחת..." : "שליחה ונשמח להכיר"}
              </button>
            )}
          </div>

          {step === LAST_STEP && missing.length > 0 && (
            <p className="mt-3 rounded-2xl bg-[#EAF5FA] px-3.5 py-2.5 text-[12px] leading-relaxed text-[#1F6E88]">
              כדי לשלוח חסר: {missing.map((m) => m.label).join(" · ")}
            </p>
          )}
        </div>

        <Costs content={content} />

        <p className="mt-6 text-center text-[11px] text-[#5E7A87]">
          {APP_NAME} · {APP_SUBTITLE}
        </p>
      </div>
    </main>
  );
}

// ===================================================================
//  גוף השלב
// ===================================================================
// שתי שאלות קצרות שמסומנות half מוצגות זו לצד זו, כפי שהיו תמיד.
// הזיווג נעשה כאן ולא ברשימה, כדי שכיבוי שאלה או שינוי סדר לא יותירו
// חצי שורה ריקה או פריסה שבורה.
function StepBody({ items, ...rest }) {
  const rows = [];
  for (let i = 0; i < items.length; i += 1) {
    const cur = items[i];
    const next = items[i + 1];
    if (cur.half && next?.half) {
      rows.push(
        <div key={cur.id} className="grid grid-cols-2 gap-3">
          <ItemField item={cur} {...rest} />
          <ItemField item={next} {...rest} />
        </div>
      );
      i += 1;
    } else {
      rows.push(<ItemField key={cur.id} item={cur} {...rest} />);
    }
  }
  return <div className="space-y-4">{rows}</div>;
}

function ItemField({ item, form, set, custom, setCustom, content, ...rest }) {
  const value = item.kind === "custom" ? custom[item.id] : form[item.id];
  const onChange = (v) =>
    item.kind === "custom" ? setCustom({ ...custom, [item.id]: v }) : set({ [item.id]: v });

  // שאלות שמביאות איתן מבנה משלהן ואינן עטופות ב-Field רגיל
  if (item.widget === "photos") {
    return <PhotoUploader item={item} {...rest} />;
  }
  if (item.widget === "consents") {
    return <Consents item={item} content={content} {...rest} />;
  }
  if (item.widget === "scale") {
    const base = scaleOf(item.id);
    if (!base) return null;
    const scale = { ...base, label: item.label };
    return (
      <ScaleSlider
        scale={scale}
        value={form[item.id]}
        onChange={(v) => set({ [item.id]: v })}
        description={describeScale(scale, form[item.id])}
      />
    );
  }

  return (
    <Field label={item.label} hint={item.hint} required={item.required}>
      <ItemInput item={item} value={value} onChange={onChange} form={form} set={set} />
    </Field>
  );
}

function ItemInput({ item, value, onChange, form, set }) {
  switch (item.widget) {
    case "genderChips":
      return (
        <ChipGroup
          options={["בחורה", "בחור"]}
          value={form.gender === "male" ? "בחור" : "בחורה"}
          onChange={(v) => set({ gender: v === "בחור" ? "male" : "female" })}
        />
      );

    case "birthDate": {
      const age = ageFromBirthDate(form.birthDate);
      return (
        <>
          <TextInput type="date" value={form.birthDate} onChange={(e) => set({ birthDate: e.target.value })} />
          <p className="mt-1 text-[11.5px] text-[#5E7A87]">
            {age ? `הגיל שיחושב: ${age}` : "אם נוח יותר, אפשר להזין גיל בשדה שמתחת."}
          </p>
          {!form.birthDate && (
            <div className="mt-2">
              <span className="mb-1 block text-[12.5px] font-semibold text-[#23414E]">או גיל</span>
              <TextInput
                type="number"
                inputMode="numeric"
                value={form.age}
                onChange={(e) => set({ age: e.target.value })}
                placeholder="למשל 24"
              />
            </div>
          )}
        </>
      );
    }

    case "element":
      return (
        <>
          <ChipGroup options={ELEMENTS.map((e) => e.key)} value={form.element} onChange={(v) => set({ element: v })} />
          {form.element && (
            <p className="mt-1.5 text-[11.5px] text-[#5E7A87]">
              {ELEMENTS.find((e) => e.key === form.element)?.hint}
            </p>
          )}
          {form.element && (
            <div className="mt-2.5">
              <span className="mb-1 block text-[12.5px] font-semibold text-[#23414E]">
                התכונה הבולטת שלי מתוך היסוד הזה
              </span>
              <TextInput
                value={form.elementWhy}
                onChange={(e) => set({ elementWhy: e.target.value })}
                placeholder="במשפט קצר"
              />
            </div>
          )}
        </>
      );

    case "chips":
      return <ChipGroup options={optionsOf(item)} value={value ?? ""} onChange={onChange} />;

    case "multiChips":
      return <ChipGroup options={optionsOf(item)} value={Array.isArray(value) ? value : []} onChange={onChange} multi />;

    case "select": {
      const options = optionsOf(item);
      return (
        <Select value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
          {(item.allowEmpty || !value) && <option value="">בחירה...</option>}
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </Select>
      );
    }

    case "number":
      return (
        <TextInput
          type="number"
          inputMode="numeric"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={item.placeholder}
        />
      );

    case "tel":
      return (
        <TextInput
          type="tel"
          inputMode="tel"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={item.placeholder}
        />
      );

    case "textarea":
      return (
        <TextArea
          rows={item.rows || 4}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={item.placeholder}
        />
      );

    case "simpleScale": {
      const n = Number(value) || 5;
      return (
        <div className="rounded-2xl border border-[#CFE3EC] bg-white p-3.5">
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={n}
            onChange={(e) => onChange(Number(e.target.value))}
            aria-label={item.label}
            className="w-full accent-[#2E8BA8]"
          />
          <p className="mt-1 text-center text-[12px] font-semibold text-[#1F6E88]">{n} מתוך 10</p>
        </div>
      );
    }

    default:
      return (
        <TextInput value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={item.placeholder} />
      );
  }
}

function Welcome({ content }) {
  return (
    <div className="mb-4 rounded-3xl border border-[#CFE3EC] bg-white p-5 shadow-[0_4px_18px_rgba(31,110,136,0.06)]">
      <h1 className="text-[17px] font-bold text-[#1F6E88]">
        {content.intro.title} ל{APP_NAME}
      </h1>
      <p className="mt-2 whitespace-pre-line text-[14px] leading-relaxed text-[#23414E]">{content.intro.body}</p>
      {content.intro.note && (
        <p className="mt-2 rounded-2xl bg-[#EAF5FA] px-3.5 py-2.5 text-[13px] leading-relaxed text-[#1F6E88]">
          {content.intro.note}
        </p>
      )}
    </div>
  );
}

// מסך הפניה לטופס חיצוני שהמנהלת הגדירה
function ExternalRedirect({ url }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F2F8FB] px-5" dir="rtl">
      <div className="w-full max-w-sm text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={LOGO_SRC} alt={APP_NAME} className="mx-auto mb-5 w-48 max-w-[70%] object-contain" />
        <p className="text-[15px] font-semibold text-[#1F6E88]">{APP_SUBTITLE}</p>
        <p className="mt-3 text-[14px] leading-relaxed text-[#23414E]">
          ההרשמה מתבצעת בטופס שלנו. לחיצה אחת ואתם שם.
        </p>
        <a
          href={url}
          className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-2xl bg-[#2E8BA8] py-3.5 text-[15px] font-bold text-white shadow transition active:scale-95"
        >
          למעבר לטופס ההרשמה
        </a>
      </div>
    </main>
  );
}

function Consents({ item, content, agreeTerms, setAgreeTerms, agreePrivacy, setAgreePrivacy }) {
  return (
    <div className="space-y-2.5 rounded-2xl border border-[#CFE3EC] bg-[#F2F8FB] p-3.5">
      {item.hint && <p className="text-[12px] leading-relaxed text-[#5E7A87]">{item.hint}</p>}
      <Consent checked={agreeTerms} onChange={setAgreeTerms} href="/terms/">
        קראתי ואני מאשר/ת את <strong>נספח 1 — הסכם ההתקשרות</strong>, הכולל דמי הצלחה בסך{" "}
        {Number(content.payment.successFee || 0).toLocaleString("he-IL")} ₪ במקרה של נישואין.
      </Consent>
      <Consent checked={agreePrivacy} onChange={setAgreePrivacy} href="/privacy/">
        קראתי ואני מאשר/ת את <strong>נספח 2 — מדיניות הפרטיות</strong>.
      </Consent>
    </div>
  );
}

function Consent({ checked, onChange, href, children }) {
  return (
    <div className="flex items-start gap-2.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-5 w-5 shrink-0 accent-[#2E8BA8]"
      />
      <p className="text-[12.5px] leading-relaxed text-[#23414E]">
        {children}{" "}
        <a href={href} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#2E8BA8] underline">
          לקריאה מלאה
        </a>
        <span className="text-[#C4584C]"> *</span>
      </p>
    </div>
  );
}

function PhotoUploader({ item, photos, setPhotos, photoBusy, photoError, onPhotos }) {
  return (
    <Field label={`${item.label} (עד ${MAX_PHOTOS})`} required hint={item.hint}>
      <div className="grid grid-cols-4 gap-2">
        {photos.map((url, i) => (
          <div key={url} className="relative aspect-square overflow-hidden rounded-xl border border-[#CFE3EC] bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`תמונה ${i + 1}`} className="h-full w-full object-cover" />
            {i === 0 && (
              <span className="absolute inset-x-0 bottom-0 bg-[#2E8BA8]/85 py-0.5 text-center text-[9px] font-bold text-white">
                ראשית
              </span>
            )}
            <button
              type="button"
              onClick={() => setPhotos(photos.filter((p) => p !== url))}
              aria-label="הסרת התמונה"
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/90 text-[#C4584C] shadow"
            >
              <X size={12} />
            </button>
          </div>
        ))}

        {photos.length < MAX_PHOTOS && (
          <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-[#CFE3EC] bg-white text-[#2E8BA8] transition hover:bg-[#F2F8FB]">
            <Camera size={20} />
            <span className="text-[10px] font-semibold">הוספה</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                onPhotos(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        )}
      </div>

      {photoBusy && (
        <p className="mt-2 flex items-center gap-1.5 text-[12px] text-[#1F6E88]">
          <Loader2 size={13} className="animate-spin" /> {photoBusy}
        </p>
      )}
      {photoError && <p className="mt-2 text-[12px] text-[#C4584C]">{photoError}</p>}
    </Field>
  );
}

function ThankYou({ intakeId, content }) {
  // בחירת המסלול נצמדת לפנייה שזה עתה נשלחה. כללי האבטחה מתירים כאן
  // עדכון של שלושת השדות האלה בלבד, ורק כל עוד הפנייה טרם טופלה.
  const handleChoose = async (value, message) => {
    if (!intakeId) return;
    await updateDoc(doc(crmDb, "intakeSubmissions", intakeId), {
      personalTrack: value,
      trackMessage: cleanTrackMessage(message),
      trackUpdatedAt: new Date().toISOString(),
    });
  };

  return (
    <main className="min-h-screen bg-[#F2F8FB] px-4 py-10" dir="rtl">
      <div className="mx-auto w-full max-w-lg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={LOGO_SRC} alt={APP_NAME} className="mx-auto mb-4 w-48 max-w-[65%] object-contain" />

        <div className="rounded-3xl border border-[#CFE3EC] bg-white p-6 text-center shadow-[0_4px_18px_rgba(31,110,136,0.06)]">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#DCEEF5]">
            <Check size={26} className="text-[#2E8BA8]" />
          </div>
          <h1 className="text-[18px] font-bold text-[#1F6E88]">{content?.thankYou?.title || "קיבלנו, תודה רבה!"}</h1>
          <p className="mt-2 whitespace-pre-line text-[14px] leading-relaxed text-[#23414E]">
            {content?.thankYou?.body || "הפרטים שלכם הגיעו אלינו. נעבור עליהם בעיון וניצור איתכם קשר."}
          </p>
        </div>

        <PersonalTrackOffer onChoose={handleChoose} payment={content?.payment} />

        <p className="mt-6 text-center text-[11px] text-[#5E7A87]">
          {APP_NAME} · {APP_SUBTITLE}
        </p>
      </div>
    </main>
  );
}

function Costs({ content }) {
  return (
    <div className="mt-5 rounded-3xl border border-[#CFE3EC] bg-white p-5">
      <p className="text-[14px] font-bold text-[#1F6E88]">עלויות והצטרפות</p>
      <ul className="mt-2 space-y-2 text-[13px] leading-relaxed text-[#23414E]">
        <li>
          <strong>ההצטרפות למאגר — ללא עלות</strong> ובלי התחייבות.
        </li>
        <li>
          <strong>דמי הצלחה — {Number(content.payment.successFee || 0).toLocaleString("he-IL")} ₪</strong>, משולמים אך ורק אם
          וכאשר נישאים. הפירוט המלא ב
          <a href="/terms/" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#2E8BA8] underline">
            הסכם ההתקשרות
          </a>
          .
        </li>
      </ul>
    </div>
  );
}
