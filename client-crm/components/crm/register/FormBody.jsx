"use client";

// מנוע הציור של טופס ההרשמה.
//
// אותו רכיב בדיוק משרת שני מקומות: הטופס הציבורי ב-/register, ותצוגה
// מקדימה חיה בתוך לוח הבקרה. זו הנקודה: אין שתי גרסאות שיכולות
// להיפרד זו מזו, ולכן מה שהמנהלת רואה בתצוגה המקדימה הוא בדיוק מה
// שהמועמד/ת יראו - כולל שאלות שכובו, נוסח שהשתנה וסדר שהוזז.
//
// הרכיב מחזיק את התשובות בעצמו ואינו יודע דבר על שמירה. כשהטופס תקין
// הוא קורא ל-onSubmit ומעביר את מה שנאסף. בתצוגה מקדימה אין onSubmit
// כלל, ולכן שום דבר אינו נשלח לשום מקום.

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check, AlertCircle, Camera, X, Loader2, ChevronLeft, ChevronRight, HandHeart, RotateCcw, Eye,
} from "lucide-react";
import { uploadPhoto } from "@/lib/crm/photoUpload";
import { APP_NAME, LOGO_SRC } from "@/lib/appConfig";
import { ELEMENTS, describeScale, ageFromBirthDate } from "@/lib/crm/registerForm";
import { visibleItems, optionsOf, missingItems } from "@/lib/crm/formSchema";
import {
  StepIndicator, Field, TextInput, TextArea, Select, ChipGroup, ScaleSlider,
} from "@/components/crm/register/FormBits";

const MAX_PHOTOS = 4;

// שדות שמכילים כפתורים או תווית משלהם. הם מצוירים כקבוצה ולא כתווית,
// כדי שלא ייווצר label בתוך label ושקורא מסך לא יקריא את שם השדה לפני
// כל כפתור. ראו ההערה ב-Field.
const GROUP_WIDGETS = new Set([
  "photos", "consents", "genderChips", "chips", "multiChips", "element", "birthDate",
]);
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

export default function FormBody({
  content,
  onSubmit,
  submitting = false,
  externalError = "",
  preview = false,
}) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(EMPTY);
  // תשובות לשאלות שהמנהלת הוסיפה בעצמה
  const [custom, setCustom] = useState({});
  // כל תמונה מנוהלת כרשומה עם מצב משלה, ולא כרשימת כתובות. כך תמונה
  // שנכשלה אינה נעלמת בשקט: היא נשארת על המסך עם סיבת הכישלון וכפתור
  // "לנסות שוב", ואי אפשר להגיע למסך השליחה בלי לשים לב שהיא חסרה.
  const [photoItems, setPhotoItems] = useState([]);
  const photoItemsRef = useRef([]);
  useEffect(() => {
    photoItemsRef.current = photoItems;
  }, [photoItems]);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [localError, setLocalError] = useState("");
  // מה סומן כחסר בניסיון השליחה האחרון, ולאן לגלול
  const [flagged, setFlagged] = useState([]);
  const [scrollTo, setScrollTo] = useState("");

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const items = useMemo(() => visibleItems(content, step), [content, step]);
  const photos = useMemo(
    () => photoItems.filter((p) => p.status === "done").map((p) => p.url),
    [photoItems]
  );
  const uploading = photoItems.some((p) => p.status === "uploading");

  const missing = useMemo(
    () => missingItems(content, form, { photos, custom, agreeTerms, agreePrivacy }),
    [content, form, photos, custom, agreeTerms, agreePrivacy]
  );

  // הסימון האדום נגזר ממה שבאמת חסר ברגע זה, ולא נשמר בנפרד. לכן הוא
  // נעלם מאליו ברגע שממלאים את השדה, ואי אפשר להיתקע עם שדה מסומן
  // באדום שכבר מולא.
  const invalidIds = useMemo(
    () => flagged.filter((id) => missing.some((m) => m.id === id)),
    [flagged, missing]
  );

  // גלילה אל השדה החסר. רצה אחרי שהשלב כבר הוחלף והשדה קיים במסך.
  useEffect(() => {
    if (!scrollTo) return;
    const el = document.getElementById(`field-${scrollTo}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    else window.scrollTo({ top: 0, behavior: "smooth" });
    setScrollTo("");
  }, [scrollTo, step]);

  // שינוי בתוכן בזמן עריכה יכול להשאיר את התצוגה המקדימה על שלב שכבר
  // אינו קיים. כאן חוזרים לשלב תקין במקום להציג מסך ריק.
  useEffect(() => {
    if (step > LAST_STEP) setStep(LAST_STEP);
  }, [step]);

  const patchPhoto = (id, patch) =>
    setPhotoItems((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const runUpload = async (entry) => {
    patchPhoto(entry.id, { status: "uploading", note: "מעלה...", error: "" });
    try {
      // כיווץ והעלאה יחד, כולל נפילה חזרה לקובץ המקורי כשהדפדפן אינו
      // יודע לפענח את הפורמט. ראו lib/crm/photoUpload.js.
      const url = await uploadPhoto(entry.file, (note) => patchPhoto(entry.id, { note }));
      patchPhoto(entry.id, { status: "done", url, note: "", error: "" });
    } catch (err) {
      patchPhoto(entry.id, {
        status: "error",
        note: "",
        error: err?.message || "ההעלאה נכשלה. אפשר לנסות שוב.",
      });
    }
  };

  const handlePhotos = async (fileList) => {
    // בתצוגה מקדימה אין העלאות: אין טעם למלא את האחסון בתמונות בדיקה.
    if (preview) return;
    const picked = Array.from(fileList || []);
    if (picked.length === 0) return;
    const room = Math.max(0, MAX_PHOTOS - photoItemsRef.current.length);
    const entries = picked.slice(0, room).map((file, i) => ({
      id: `${Date.now().toString(36)}-${i}-${Math.random().toString(36).slice(2, 6)}`,
      file,
      status: "uploading",
      note: "מעלה...",
      url: "",
      error: "",
    }));
    if (entries.length === 0) return;
    setPhotoItems((prev) => [...prev, ...entries]);
    // אחת אחרי השנייה: ברשת סלולרית חלשה, ארבע העלאות במקביל נוטות
    // להיכשל כולן יחד.
    for (const entry of entries) await runUpload(entry);
  };

  const handleSubmit = () => {
    if (preview || !onSubmit) return;
    if (uploading) {
      setLocalError("רגע אחד — תמונה עדיין עולה. נשלח ברגע שהיא תסיים.");
      return;
    }
    if (missing.length > 0) {
      const first = missing[0];
      setLocalError(
        missing.length === 1
          ? `עוד רגע ואנחנו שם. חסר: ${first.label}`
          : `עוד רגע ואנחנו שם. חסרים ${missing.length} פרטים: ${missing.map((m) => m.label).join(" · ")}`
      );
      // סימון כל מה שחסר, ומעבר אל הראשון שבהם - לשלב שלו ואל השדה
      // עצמו, ולא לראש המסך.
      setFlagged(missing.map((m) => m.id));
      setStep(first.step);
      setScrollTo(first.id);
      return;
    }
    setLocalError("");
    setFlagged([]);
    onSubmit({ form, custom, photos });
  };

  const note = content.stepNotes?.[step] || "";
  // ההודעה האדומה נעלמת מאליה ברגע שכבר לא חסר דבר. קודם היא נשארה
  // על המסך גם אחרי שהכל מולא, ואז נראה כאילו הטופס עדיין חוסם - וזה
  // בדיוק מה שגרם לתחושת הלולאה.
  const error = externalError || (missing.length > 0 ? localError : "");

  return (
    <div className="mx-auto w-full max-w-lg">
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
          photoItems={photoItems}
          setPhotoItems={setPhotoItems}
          onPhotos={handlePhotos}
          onRetryPhoto={runUpload}
          agreeTerms={agreeTerms}
          setAgreeTerms={setAgreeTerms}
          agreePrivacy={agreePrivacy}
          setAgreePrivacy={setAgreePrivacy}
          invalidIds={invalidIds}
          preview={preview}
          content={content}
        />

        {items.length === 0 && (
          <p className="rounded-2xl bg-[#F2F8FB] px-3.5 py-4 text-center text-[13px] text-[#5E7A87]">
            אין שאלות בשלב הזה. אפשר להמשיך הלאה.
          </p>
        )}

        {error && (
          <p className="mt-4 flex items-start gap-1.5 rounded-2xl bg-[#FDECEA] px-3.5 py-3 text-[13px] leading-relaxed text-[#C4584C]">
            <AlertCircle size={16} className="mt-0.5 shrink-0" /> {error}
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
                if (!preview) window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="flex flex-1 items-center justify-center gap-1 rounded-2xl bg-[#2E8BA8] px-4 py-3 text-[15px] font-bold text-white shadow transition active:scale-95 hover:bg-[#1F6E88]"
            >
              לשלב הבא <ChevronLeft size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || preview}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-[#2E8BA8] px-4 py-3 text-[15px] font-bold text-white shadow transition active:scale-95 hover:bg-[#1F6E88] disabled:opacity-60"
            >
              {submitting ? <Loader2 size={17} className="animate-spin" /> : <HandHeart size={17} />}
              {submitting ? "שולחת..." : "שליחה ונשמח להכיר"}
            </button>
          )}
        </div>

        {preview && step === LAST_STEP && (
          <p className="mt-3 flex items-center justify-center gap-1.5 rounded-2xl bg-[#EAF5FA] px-3.5 py-2.5 text-[12px] text-[#1F6E88]">
            <Eye size={13} /> זו תצוגה מקדימה. כפתור השליחה אינו פעיל כאן.
          </p>
        )}

        {!preview && step === LAST_STEP && missing.length > 0 && (
          <p className="mt-3 rounded-2xl bg-[#EAF5FA] px-3.5 py-2.5 text-[12px] leading-relaxed text-[#1F6E88]">
            כדי לשלוח חסר: {missing.map((m) => m.label).join(" · ")}
          </p>
        )}
      </div>

      <Costs content={content} />
    </div>
  );
}


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

function ItemField({ item, form, set, custom, setCustom, content, invalidIds = [], ...rest }) {
  const invalid = invalidIds.includes(item.id);
  const value = item.kind === "custom" ? custom[item.id] : form[item.id];
  const onChange = (v) =>
    item.kind === "custom" ? setCustom({ ...custom, [item.id]: v }) : set({ [item.id]: v });

  // שאלות שמביאות איתן מבנה משלהן ואינן עטופות ב-Field רגיל
  if (item.widget === "photos") {
    return <PhotoUploader item={item} invalid={invalid} {...rest} />;
  }
  if (item.widget === "consents") {
    return <Consents item={item} content={content} invalid={invalid} {...rest} />;
  }
  // סולם - מובנה או כזה שהמנהלת הוסיפה. שניהם מצוירים מאותו רכיב
  // ומתורגמים למילים מאותה פונקציה, ולכן סולם חדש מתנהג מיד כמו
  // הוותיקים בלי נגיעה בקוד.
  if (item.widget === "scale") {
    const scale = { label: item.label, low: item.low, high: item.high };
    const current = Number(value) || 5;
    return (
      <div id={`field-${item.id}`} className="scroll-mt-24">
        <ScaleSlider
          scale={scale}
          hint={item.hint}
          required={item.required}
          value={current}
          onChange={(v) => onChange(Number(v))}
          description={scale.low && scale.high ? describeScale(scale, current) : `${current} מתוך 10`}
        />
      </div>
    );
  }

  return (
    <Field
      id={`field-${item.id}`}
      invalid={invalid}
      label={item.label}
      hint={item.hint}
      required={item.required}
      group={GROUP_WIDGETS.has(item.widget)}
    >
      <ItemInput item={item} value={value} onChange={onChange} form={form} set={set} texts={content.texts} />
    </Field>
  );
}

function ItemInput({ item, value, onChange, form, set, texts }) {
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
      const ageLabel = texts.ageFallbackLabel;
      return (
        <>
          <TextInput type="date" value={form.birthDate} onChange={(e) => set({ birthDate: e.target.value })} />
          {age ? <p className="mt-1 text-[11.5px] text-[#5E7A87]">{`הגיל שיחושב: ${age}`}</p> : null}
          {!form.birthDate && ageLabel && (
            <div className="mt-2">
              <span className="mb-1 block text-[12.5px] font-semibold text-[#23414E]">{ageLabel}</span>
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
          {form.element && texts.elementWhyLabel && (
            <div className="mt-2.5">
              <span className="mb-1 block text-[12.5px] font-semibold text-[#23414E]">
                {texts.elementWhyLabel}
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

    default:
      return (
        <TextInput value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={item.placeholder} />
      );
  }
}

// הכותרת, ההודעה וההערה מוצגות בדיוק כפי שנכתבו בלוח הבקרה. הקוד
// אינו מוסיף להן מילה, ולכן אין כאן שם מיזם כפול שאי אפשר למחוק.
// שלושתן ריקות - הקופסה כולה נעלמת.
function Welcome({ content }) {
  const { title, body, note } = content.intro;
  if (!title && !body && !note) return null;
  return (
    <div className="mb-4 rounded-3xl border border-[#CFE3EC] bg-white p-5 shadow-[0_4px_18px_rgba(31,110,136,0.06)]">
      {title && <h1 className="whitespace-pre-line text-[17px] font-bold text-[#1F6E88]">{title}</h1>}
      {body && <p className="mt-2 whitespace-pre-line text-[14px] leading-relaxed text-[#23414E]">{body}</p>}
      {note && (
        <p className="mt-2 whitespace-pre-line rounded-2xl bg-[#EAF5FA] px-3.5 py-2.5 text-[13px] leading-relaxed text-[#1F6E88]">
          {note}
        </p>
      )}
    </div>
  );
}

// מסך הפניה לטופס חיצוני שהמנהלת הגדירה
function Consents({
  item, content, agreeTerms, setAgreeTerms, agreePrivacy, setAgreePrivacy, invalid,
}) {
  const terms = withFee(content.texts.consentTerms, content);
  const privacy = withFee(content.texts.consentPrivacy, content);
  return (
    <div
      id={`field-${item.id}`}
      className={`scroll-mt-24 space-y-2.5 rounded-2xl border p-3.5 ${
        invalid ? "border-[#E9B4AD] bg-[#FDECEA]" : "border-[#CFE3EC] bg-[#F2F8FB]"
      }`}
    >
      {invalid && (
        <p className="text-[12px] font-bold text-[#C4584C]">
          צריך לסמן את שני האישורים כדי לשלוח
        </p>
      )}
      {item.hint && <p className="text-[12px] leading-relaxed text-[#5E7A87]">{item.hint}</p>}
      <Consent checked={agreeTerms} onChange={setAgreeTerms} href="/terms/" invalid={invalid && !agreeTerms}>
        {terms}
      </Consent>
      <Consent checked={agreePrivacy} onChange={setAgreePrivacy} href="/privacy/" invalid={invalid && !agreePrivacy}>
        {privacy}
      </Consent>
    </div>
  );
}

// {{fee}} מוחלף בדמי ההצלחה שהוגדרו בלוח הבקרה, כדי שסכום לא יופיע
// פעמיים בקוד וייווצר מצב שבו שני מקומות אומרים דברים שונים.
function withFee(text, content) {
  const fee = Number(content?.payment?.successFee || 0).toLocaleString("he-IL");
  return String(text ?? "").split("{{fee}}").join(fee);
}

// שורת אישור.
//
// שתי הקפדות שנובעות מתקלה אמיתית בשטח:
//
// 1. checked הוא תמיד בוליאני. תיבה שמקבלת undefined הופכת בעיני
//    הדפדפן ל"לא מבוקרת": היא מסמנת את עצמה בלחיצה, אבל המצב במערכת
//    אינו משתנה - כלומר המסך מראה וי, והטופס עדיין חושב שלא אושר.
//    !!checked מבטיח שמה שנראה הוא מה שנשמר.
//
// 2. גם הטקסט לוחץ, ולא רק הריבוע הקטן. באצבע על טלפון קל להחטיא ריבוע
//    של חמישה מילימטרים. הקישור "לקריאה מלאה" עוצר את הלחיצה, כדי
//    שפתיחת הנספח לא תסמן את התיבה בטעות.
function Consent({ checked, onChange, href, children, invalid = false }) {
  const toggle = () => {
    if (typeof onChange === "function") onChange(!checked);
  };
  return (
    <div className="flex items-start gap-2.5">
      <input
        type="checkbox"
        checked={!!checked}
        onChange={(e) => (typeof onChange === "function" ? onChange(e.target.checked) : undefined)}
        aria-invalid={invalid || undefined}
        className={`mt-0.5 h-5 w-5 shrink-0 accent-[#2E8BA8] ${
          invalid ? "outline outline-2 outline-offset-2 outline-[#C4584C]" : ""
        }`}
      />
      <p
        onClick={toggle}
        className={`cursor-pointer text-[12.5px] leading-relaxed ${
          invalid ? "font-semibold text-[#C4584C]" : "text-[#23414E]"
        }`}
      >
        {children}{" "}
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="font-semibold text-[#2E8BA8] underline"
        >
          לקריאה מלאה
        </a>
        <span className="text-[#C4584C]"> *</span>
      </p>
    </div>
  );
}

// גלריית התמונות.
//
// כל תמונה מציגה את מצבה בפני עצמה: עולה, עלתה, או נכשלה. תמונה
// שנכשלה נשארת גלויה עם סיבת הכישלון וכפתור ניסיון חוזר, במקום
// להיעלם בשקט ולהשאיר את הממלא/ת בטוח/ה שהכל נקלט.
function PhotoUploader({ item, photoItems, setPhotoItems, onPhotos, onRetryPhoto, preview, invalid }) {
  const done = photoItems.filter((p) => p.status === "done").length;
  const failed = photoItems.filter((p) => p.status === "error");
  const busy = photoItems.filter((p) => p.status === "uploading");
  const remove = (id) => setPhotoItems((prev) => prev.filter((p) => p.id !== id));

  return (
    <Field id={`field-${item.id}`} invalid={invalid} label={item.label} required hint={item.hint} group>
      <div className="grid grid-cols-4 gap-2">
        {photoItems.map((p, i) => (
          <div
            key={p.id}
            data-photo={p.status}
            className={`relative aspect-square overflow-hidden rounded-xl border bg-white ${
              p.status === "error" ? "border-[#E9B4AD] bg-[#FDECEA]" : "border-[#CFE3EC]"
            }`}
          >
            {p.status === "done" && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={`תמונה ${i + 1}`} className="h-full w-full object-cover" />
                {i === 0 && (
                  <span className="absolute inset-x-0 bottom-0 bg-[#2E8BA8]/85 py-0.5 text-center text-[9px] font-bold text-white">
                    ראשית
                  </span>
                )}
              </>
            )}

            {p.status === "uploading" && (
              <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-[#2E8BA8]">
                <Loader2 size={18} className="animate-spin" />
                <span className="px-1 text-center text-[9px] font-semibold leading-tight">{p.note || "מעלה..."}</span>
              </div>
            )}

            {p.status === "error" && (
              <button
                type="button"
                onClick={() => onRetryPhoto(p)}
                className="flex h-full w-full flex-col items-center justify-center gap-1 text-[#C4584C]"
                aria-label="ניסיון חוזר להעלאת התמונה"
              >
                <RotateCcw size={18} />
                <span className="text-[9px] font-bold">לנסות שוב</span>
              </button>
            )}

            {p.status !== "uploading" && (
              <button
                type="button"
                onClick={() => remove(p.id)}
                aria-label="הסרת התמונה"
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/90 text-[#C4584C] shadow"
              >
                <X size={12} />
              </button>
            )}
          </div>
        ))}

        {photoItems.length < MAX_PHOTOS &&
          (preview ? (
            // בתצוגה מקדימה המשבצת נראית בדיוק כמו באמת, אבל אינה
            // פותחת בורר קבצים - כדי שלא ייווצרו העלאות בדיקה.
            <div className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-[#CFE3EC] bg-white text-[#9FBAC7]">
              <Camera size={20} />
              <span className="text-[10px] font-semibold">הוספה</span>
            </div>
          ) : (
            <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-[#CFE3EC] bg-white text-[#2E8BA8] transition hover:bg-[#F2F8FB]">
              <Camera size={20} />
              <span className="text-[10px] font-semibold">הוספה</span>
              <input
                type="file"
                // HEIC מצוין במפורש: אייפון מסמן כך תמונות, ובחלק
                // מהמכשירים accept="image/*" בלבד אינו מציע אותן כלל.
                accept="image/*,.heic,.heif"
                multiple
                className="hidden"
                onChange={(e) => {
                  onPhotos(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
          ))}
      </div>

      {busy.length > 0 && (
        <p className="mt-2 flex items-center gap-1.5 text-[12px] text-[#1F6E88]">
          <Loader2 size={13} className="animate-spin" />
          {busy.length === 1 ? "מעלה תמונה..." : `מעלה ${busy.length} תמונות...`}
        </p>
      )}

      {failed.length > 0 && (
        <div className="mt-2 rounded-2xl bg-[#FDECEA] px-3 py-2.5 text-[12px] leading-relaxed text-[#C4584C]">
          <p className="font-bold">
            {failed.length === 1 ? "תמונה אחת לא עלתה" : `${failed.length} תמונות לא עלו`}
          </p>
          <p className="mt-0.5">{failed[0].error}</p>
          <button
            type="button"
            onClick={() => failed.forEach(onRetryPhoto)}
            className="mt-1.5 flex items-center gap-1 font-bold underline"
          >
            <RotateCcw size={12} /> לנסות שוב הכל
          </button>
        </div>
      )}

      {done > 0 && failed.length === 0 && busy.length === 0 && (
        <p className="mt-2 flex items-center gap-1 text-[12px] font-semibold text-[#2E8BA8]">
          <Check size={13} /> {done === 1 ? "תמונה אחת נשמרה" : `${done} תמונות נשמרו`}
        </p>
      )}
    </Field>
  );
}

function Costs({ content }) {
  const title = String(content.texts.costsTitle || "").trim();
  const lines = String(content.texts.costsLines || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (!title && lines.length === 0) return null;
  return (
    <div className="mt-5 rounded-3xl border border-[#CFE3EC] bg-white p-5">
      {title && <p className="text-[14px] font-bold text-[#1F6E88]">{title}</p>}
      {lines.length > 0 && (
        <ul className="mt-2 space-y-2 text-[13px] leading-relaxed text-[#23414E]">
          {lines.map((line, i) => (
            <li key={i}>{withFee(line, content)}</li>
          ))}
        </ul>
      )}
      <a
        href="/terms/"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-block text-[12.5px] font-semibold text-[#2E8BA8] underline"
      >
        לקריאת הסכם ההתקשרות
      </a>
    </div>
  );
}
