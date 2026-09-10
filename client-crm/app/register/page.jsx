"use client";

// טופס ההרשמה החיצוני של המאגר.
//
// אשף בארבעה שלבים, פתוח לכל אחד בלי התחברות. הפניות אינן נכנסות
// ישירות למאגר המועמדים אלא לאוסף נפרד (intakeSubmissions), והמנהלת
// היא שמאשרת ויוצרת מהן כרטיס. כך המאגר נשאר סגור לכתיבה מבחוץ.
//
// חלוקת השדות: פרטי הליבה נשמרים כל אחד בשדה נפרד, ותשובות העומק
// מתמזגות לפסקה אחת שנכנסת ל"תיאור אישי". ראו lib/crm/registerForm.js.

import { useMemo, useState } from "react";
import { addDoc, collection, doc, updateDoc } from "firebase/firestore";
import { Check, AlertCircle, Camera, X, Loader2, ChevronLeft, ChevronRight, HandHeart, Phone, Sparkles } from "lucide-react";
import { crmDb } from "@/lib/crm/firebaseClient";
import { REGIONS, OCCUPATION_OPTIONS } from "@/lib/crm/mockData";
import { uploadToCloudinary } from "@/lib/crm/cloudinary";
import { compressImage } from "@/lib/crm/compressImage";
import {
  APP_NAME,
  APP_SUBTITLE,
  LOGO_SRC,
  SUCCESS_FEE,
} from "@/lib/appConfig";
import {
  MARITAL_STATUSES,
  LIFESTYLE_DEFINITIONS,
  BRESLOV_IN_PARTNER,
  SMOKING_SELF,
  ELEMENTS,
  CHARACTER_SCALES,
  describeScale,
  ageFromBirthDate,
  buildBio,
  missingFields,
  STEP_OF_FIELD,
} from "@/lib/crm/registerForm";
import { StepIndicator, Field, TextInput, TextArea, Select, ChipGroup, ScaleSlider } from "@/components/crm/register/FormBits";
import PersonalTrackOffer from "@/components/crm/register/PersonalTrackOffer";
import { cleanTrackMessage } from "@/lib/crm/personalTrack";

const STEPS = ["פרטים אישיים", "עולם דתי ולימודים", "אופי ותחומי עניין", "מה מחפשים ואישורים"];
const MAX_PHOTOS = 4;

const EMPTY = {
  gender: "female",
  name: "",
  phone: "",
  birthDate: "",
  age: "",
  maritalStatus: "",
  height: "",
  eda: "",
  region: REGIONS[0],
  city: "",
  lifestyle: "",
  breslov: "",
  currentOccupation: "",
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
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(EMPTY);
  const [occupations, setOccupations] = useState([]);
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
  const missing = useMemo(
    () => missingFields(form, { photos, agreeTerms, agreePrivacy }),
    [form, photos, agreeTerms, agreePrivacy]
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

  const goToMissing = () => {
    const first = missing[0];
    const target = STEP_OF_FIELD[first];
    if (typeof target === "number") setStep(target);
  };

  const handleSubmit = async () => {
    if (missing.length > 0) {
      setSubmitError(`עוד רגע ואנחנו שם. חסר: ${missing.join(" · ")}`);
      goToMissing();
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
        occupations,
        referenceContacts: form.referenceContacts.trim(),

        // התמונה הראשונה היא הראשית של הכרטיס
        photo: photos[0] || "",
        photoUrls: photos,

        // --- תשובות העומק, ממוזגות לפסקה אחת ---
        bio: buildBio(form),

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

  if (done) return <ThankYou intakeId={intakeId} />;

  return (
    <main className="min-h-screen bg-[#F2F8FB] px-4 py-8" dir="rtl">
      <div className="mx-auto w-full max-w-lg">
        <header className="mb-6 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO_SRC} alt={APP_NAME} className="mx-auto mb-3 w-48 max-w-[65%] object-contain" />
          <p className="text-[14px] font-semibold text-[#1F6E88]">{APP_SUBTITLE}</p>
        </header>

        {step === 0 && <Welcome />}

        <div className="rounded-3xl border border-[#CFE3EC] bg-white p-5 shadow-[0_4px_18px_rgba(31,110,136,0.06)]">
          <StepIndicator steps={STEPS} current={step} onJump={setStep} />

          {step === 0 && <StepPersonal form={form} set={set} />}
          {step === 1 && <StepReligious form={form} set={set} occupations={occupations} setOccupations={setOccupations} />}
          {step === 2 && <StepCharacter form={form} set={set} />}
          {step === 3 && (
            <StepClosing
              form={form}
              set={set}
              photos={photos}
              setPhotos={setPhotos}
              photoBusy={photoBusy}
              photoError={photoError}
              onPhotos={handlePhotos}
              agreeTerms={agreeTerms}
              setAgreeTerms={setAgreeTerms}
              agreePrivacy={agreePrivacy}
              setAgreePrivacy={setAgreePrivacy}
            />
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
            {step < STEPS.length - 1 ? (
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

          {step === STEPS.length - 1 && missing.length > 0 && (
            <p className="mt-3 rounded-2xl bg-[#EAF5FA] px-3.5 py-2.5 text-[12px] leading-relaxed text-[#1F6E88]">
              כדי לשלוח חסר: {missing.join(" · ")}
            </p>
          )}
        </div>

        <Costs />

        <p className="mt-6 text-center text-[11px] text-[#5E7A87]">
          {APP_NAME} · {APP_SUBTITLE}
        </p>
      </div>
    </main>
  );
}

function Welcome() {
  return (
    <div className="mb-4 rounded-3xl border border-[#CFE3EC] bg-white p-5 shadow-[0_4px_18px_rgba(31,110,136,0.06)]">
      <h1 className="text-[17px] font-bold text-[#1F6E88]">שלום וברוכים הבאים ל{APP_NAME}</h1>
      <p className="mt-2 text-[14px] leading-relaxed text-[#23414E]">
        מיזם להקמת בתים בישראל. אנחנו כאן כדי להכיר אתכם באמת — לא רק שורה בטבלה.
      </p>
      <p className="mt-2 rounded-2xl bg-[#EAF5FA] px-3.5 py-2.5 text-[13px] leading-relaxed text-[#1F6E88]">
        ההצטרפות למאגר <strong>ללא עלות</strong> ואינה כוללת התחייבות.
      </p>
    </div>
  );
}

function StepPersonal({ form, set }) {
  const age = ageFromBirthDate(form.birthDate);
  return (
    <div className="space-y-4">
      <Field label="אני" required>
        <ChipGroup
          options={["בחורה", "בחור"]}
          value={form.gender === "male" ? "בחור" : "בחורה"}
          onChange={(v) => set({ gender: v === "בחור" ? "male" : "female" })}
        />
      </Field>

      <Field label="שם מלא" required>
        <TextInput value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="שם פרטי ומשפחה" />
      </Field>

      <Field label="מספר טלפון" required hint="נשמר בנפרד ומשמש אותנו ליצירת קשר בלבד.">
        <TextInput
          type="tel"
          inputMode="tel"
          value={form.phone}
          onChange={(e) => set({ phone: e.target.value })}
          placeholder="050-1234567"
        />
      </Field>

      <Field label="תאריך לידה" required hint={age ? `הגיל שיחושב: ${age}` : "אם נוח יותר, אפשר להזין גיל בשדה שמתחת."}>
        <TextInput type="date" value={form.birthDate} onChange={(e) => set({ birthDate: e.target.value })} />
      </Field>

      {!form.birthDate && (
        <Field label="או גיל">
          <TextInput type="number" inputMode="numeric" value={form.age} onChange={(e) => set({ age: e.target.value })} placeholder="למשל 24" />
        </Field>
      )}

      <Field label="מצב משפחתי">
        <ChipGroup options={MARITAL_STATUSES} value={form.maritalStatus} onChange={(v) => set({ maritalStatus: v })} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label='גובה (ס"מ)'>
          <TextInput type="number" inputMode="numeric" value={form.height} onChange={(e) => set({ height: e.target.value })} placeholder="170" />
        </Field>
        <Field label="עדה">
          <TextInput value={form.eda} onChange={(e) => set({ eda: e.target.value })} placeholder="אשכנזי / ספרדי / מעורב" />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="אזור מגורים">
          <Select value={form.region} onChange={(e) => set({ region: e.target.value })}>
            {REGIONS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </Select>
        </Field>
        <Field label="עיר / יישוב">
          <TextInput value={form.city} onChange={(e) => set({ city: e.target.value })} placeholder="שם היישוב" />
        </Field>
      </div>
    </div>
  );
}

function StepReligious({ form, set, occupations, setOccupations }) {
  return (
    <div className="space-y-4">
      <Field label="הגדרה דתית ואורח חיים">
        <ChipGroup options={LIFESTYLE_DEFINITIONS} value={form.lifestyle} onChange={(v) => set({ lifestyle: v })} />
      </Field>

      <Field label="הקשר שלי לברסלב" hint="רשות. אם יש זיקה או קשר — נשמח לשמוע.">
        <TextArea rows={3} value={form.breslov} onChange={(e) => set({ breslov: e.target.value })} placeholder="למשל: נוסע לאומן, לומד ליקוטי מוהר״ן, גדלתי בבית ברסלבי..." />
      </Field>

      <Field label="מה אני עושה היום" hint="ישיבה, כולל, עבודה, לימודים אקדמיים, מדרשה וכדומה.">
        <TextInput value={form.currentOccupation} onChange={(e) => set({ currentOccupation: e.target.value })} placeholder="לדוגמה: לומדת בסמינר ועובדת בהוראה" />
      </Field>

      <Field label="מסגרות שעברתי" hint="אפשר לסמן כמה שרוצים.">
        <ChipGroup options={OCCUPATION_OPTIONS} value={occupations} onChange={setOccupations} multi />
      </Field>

      <Field label="המסלול שלי" hint="תחנות חיים מרכזיות, בקצרה.">
        <TextArea value={form.pathStory} onChange={(e) => set({ pathStory: e.target.value })} placeholder="למשל: אולפנה, שירות לאומי, מדרשה, ועכשיו לימודים..." />
      </Field>
    </div>
  );
}

function StepCharacter({ form, set }) {
  return (
    <div className="space-y-4">
      <p className="rounded-2xl bg-[#EAF5FA] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[#1F6E88]">
        החלק הזה עוזר לנו להכיר אתכם לעומק. התשובות נכנסות לתיאור האישי בכרטיס, ונקראות רק בידי צוות
        השדכניות.
      </p>

      <div className="space-y-3">
        {CHARACTER_SCALES.map((scale) => (
          <ScaleSlider
            key={scale.id}
            scale={scale}
            value={form[scale.id]}
            onChange={(v) => set({ [scale.id]: v })}
            description={describeScale(scale, form[scale.id])}
          />
        ))}
      </div>

      <Field label="היסוד המרכזי שלי">
        <ChipGroup options={ELEMENTS.map((e) => e.key)} value={form.element} onChange={(v) => set({ element: v })} />
        {form.element && (
          <p className="mt-1.5 text-[11.5px] text-[#5E7A87]">
            {ELEMENTS.find((e) => e.key === form.element)?.hint}
          </p>
        )}
      </Field>

      {form.element && (
        <Field label="התכונה הבולטת שלי מתוך היסוד הזה">
          <TextInput value={form.elementWhy} onChange={(e) => set({ elementWhy: e.target.value })} placeholder="במשפט קצר" />
        </Field>
      )}

      <Field label="רקע משפחתי" hint="בקצרה — מאיפה הבית שלי.">
        <TextArea rows={3} value={form.familyBackground} onChange={(e) => set({ familyBackground: e.target.value })} />
      </Field>

      <Field label="תחביבים וכישרונות">
        <TextArea rows={3} value={form.hobbies} onChange={(e) => set({ hobbies: e.target.value })} placeholder="למשל: נגינה, טבע, בישול, כתיבה..." />
      </Field>

      <Field label="דברים שחשוב להכיר עליי">
        <TextArea rows={3} value={form.importantToKnow} onChange={(e) => set({ importantToKnow: e.target.value })} />
      </Field>

      <Field label="קצת עליי, במילים שלי" hint="שאיפות, דרך חיים, מה מניע אותי.">
        <TextArea rows={5} value={form.selfDescription} onChange={(e) => set({ selfDescription: e.target.value })} />
      </Field>
    </div>
  );
}

function StepClosing({
  form, set, photos, setPhotos, photoBusy, photoError, onPhotos,
  agreeTerms, setAgreeTerms, agreePrivacy, setAgreePrivacy,
}) {
  return (
    <div className="space-y-4">
      <Field label="מה אני מחפש/ת" hint="קווים לדמותו/ה של בן/בת הזוג.">
        <TextArea rows={4} value={form.lookingFor} onChange={(e) => set({ lookingFor: e.target.value })} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="גילאים מועדפים">
          <TextInput value={form.preferredAges} onChange={(e) => set({ preferredAges: e.target.value })} placeholder="למשל 22-27" />
        </Field>
        <Field label="עישון">
          <Select value={form.smokingSelf} onChange={(e) => set({ smokingSelf: e.target.value })}>
            <option value="">בחירה...</option>
            {SMOKING_SELF.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="דרישות מרכזיות">
        <TextArea rows={3} value={form.mainRequirements} onChange={(e) => set({ mainRequirements: e.target.value })} />
      </Field>

      <Field label="הקשר לברסלב אצל בן/בת הזוג">
        <ChipGroup options={BRESLOV_IN_PARTNER} value={form.breslovInPartner} onChange={(v) => set({ breslovInPartner: v })} />
      </Field>

      <Field label="אנשי קשר לבירורים" hint="שמות וטלפונים של רבנים, מחנכים או מכרים שאפשר לפנות אליהם.">
        <TextArea rows={3} value={form.referenceContacts} onChange={(e) => set({ referenceContacts: e.target.value })} />
      </Field>

      <PhotoUploader photos={photos} setPhotos={setPhotos} busy={photoBusy} error={photoError} onPick={onPhotos} />

      <div className="space-y-2.5 rounded-2xl border border-[#CFE3EC] bg-[#F2F8FB] p-3.5">
        <Consent checked={agreeTerms} onChange={setAgreeTerms} href="/terms/">
          קראתי ואני מאשר/ת את <strong>נספח 1 — הסכם ההתקשרות</strong>, הכולל דמי הצלחה בסך{" "}
          {SUCCESS_FEE.toLocaleString("he-IL")} ₪ במקרה של נישואין.
        </Consent>
        <Consent checked={agreePrivacy} onChange={setAgreePrivacy} href="/privacy/">
          קראתי ואני מאשר/ת את <strong>נספח 2 — מדיניות הפרטיות</strong>.
        </Consent>
      </div>
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

function PhotoUploader({ photos, setPhotos, busy, error, onPick }) {
  return (
    <Field label={`תמונות (עד ${MAX_PHOTOS})`} required hint="הראשונה תשמש כתמונה הראשית בכרטיס. התמונות מוצגות לצוות המאגר בלבד.">
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
                onPick(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        )}
      </div>

      {busy && (
        <p className="mt-2 flex items-center gap-1.5 text-[12px] text-[#1F6E88]">
          <Loader2 size={13} className="animate-spin" /> {busy}
        </p>
      )}
      {error && <p className="mt-2 text-[12px] text-[#C4584C]">{error}</p>}
    </Field>
  );
}

function ThankYou({ intakeId }) {
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
          <h1 className="text-[18px] font-bold text-[#1F6E88]">קיבלנו, תודה רבה!</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-[#23414E]">
            הפרטים שלכם הגיעו אלינו. נעבור עליהם בעיון וניצור איתכם קשר.
          </p>
        </div>

        <PersonalTrackOffer onChoose={handleChoose} />

        <p className="mt-6 text-center text-[11px] text-[#5E7A87]">
          {APP_NAME} · {APP_SUBTITLE}
        </p>
      </div>
    </main>
  );
}

function Costs() {
  return (
    <div className="mt-5 rounded-3xl border border-[#CFE3EC] bg-white p-5">
      <p className="text-[14px] font-bold text-[#1F6E88]">עלויות והצטרפות</p>
      <ul className="mt-2 space-y-2 text-[13px] leading-relaxed text-[#23414E]">
        <li>
          <strong>ההצטרפות למאגר — ללא עלות</strong> ובלי התחייבות.
        </li>
        <li>
          <strong>דמי הצלחה — {SUCCESS_FEE.toLocaleString("he-IL")} ₪</strong>, משולמים אך ורק אם
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
