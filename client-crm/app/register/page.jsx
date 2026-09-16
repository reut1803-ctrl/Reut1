"use client";

// טופס ההרשמה החיצוני של המאגר.
//
// אשף בארבעה שלבים, פתוח לכל אחד בלי התחברות. הפניות אינן נכנסות
// ישירות למאגר המועמדים אלא לאוסף נפרד (intakeSubmissions), והמנהלת
// היא שמאשרת ויוצרת מהן כרטיס. כך המאגר נשאר סגור לכתיבה מבחוץ.
//
// העמוד עצמו אינו מצייר את הטופס. הציור כולו יושב ב-FormBody, ואותו
// רכיב בדיוק משמש גם לתצוגה המקדימה בלוח הבקרה - ולכן אין שתי גרסאות
// שיכולות להיפרד זו מזו. כאן נשאר רק מה שייחודי לעמוד הציבורי:
// טעינת התוכן, השליחה בפועל, ומסך התודה.
//
// חלוקת השדות: פרטי הליבה נשמרים כל אחד בשדה נפרד, ותשובות העומק
// מתמזגות לפסקה אחת שנכנסת ל"תיאור אישי". ראו lib/crm/bioNarrative.js.

import { useState } from "react";
import { addDoc, collection, doc, updateDoc } from "firebase/firestore";
import { Check } from "lucide-react";
import { crmDb } from "@/lib/crm/firebaseClient";
import { APP_NAME, APP_SUBTITLE, LOGO_SRC } from "@/lib/appConfig";
import { ageFromBirthDate } from "@/lib/crm/registerForm";
import { narrativeItems } from "@/lib/crm/formSchema";
import FormBody from "@/components/crm/register/FormBody";
import PersonalTrackOffer from "@/components/crm/register/PersonalTrackOffer";
import { cleanTrackMessage } from "@/lib/crm/personalTrack";
import { narrativeFromForm } from "@/lib/crm/bioNarrative";
import { usePublicContent } from "@/lib/crm/usePublicContent";

export default function RegisterPage() {
  const { content, loaded: contentLoaded } = usePublicContent();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [done, setDone] = useState(false);
  // מזהה הפנייה שנוצרה, כדי שמסך הסיום יוכל לצרף אליה את בחירת המסלול
  const [intakeId, setIntakeId] = useState("");

  const handleSubmit = async ({ form, custom, photos }) => {
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
        // מבנה הכרטיס קבוע. מה שדינמי הוא רק אילו שאלות נשאלו, ולכן
        // שאלה שכובתה בלוח הבקרה אינה מופיעה כאן כלל.
        // התיאור נבנה מהשאלון עצמו: אותן שאלות, באותו סדר ועם אותן
        // כותרות. שאלה שכובתה אינה מופיעה, שאלה שנוספה נכנסת במקומה,
        // ושאלה שנוסחה מחדש נושאת את הנוסח החדש.
        bio: narrativeFromForm(form, narrativeItems(content, form, custom)),
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

  return (
    <main className="min-h-screen bg-[#F2F8FB] px-4 py-8" dir="rtl">
      <div className="mx-auto w-full max-w-lg">
        <header className="mb-6 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO_SRC} alt={APP_NAME} className="mx-auto mb-3 w-48 max-w-[65%] object-contain" />
          <p className="text-[14px] font-semibold text-[#1F6E88]">{APP_SUBTITLE}</p>
        </header>

        <FormBody
          content={content}
          onSubmit={handleSubmit}
          submitting={submitting}
          externalError={submitError}
        />

        <p className="mt-6 text-center text-[11px] text-[#5E7A87]">
          {APP_NAME} · {APP_SUBTITLE}
        </p>
      </div>
    </main>
  );
}

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

// קופסת העלויות. כל שורה נכתבת בלוח הבקרה, ושורה ריקה אינה מוצגת.
// ריקון הכותרת והשורות מסתיר את הקופסה כולה.
