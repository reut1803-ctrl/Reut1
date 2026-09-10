"use client";

import { useState } from "react";
import { Sparkles, Phone, Check, Loader2, MessageSquare } from "lucide-react";
import { DEFAULT_CONTENT } from "@/lib/crm/publicContent";
import { TRACK_CHOICES, TRACK_PAID, TRACK_MESSAGE, MAX_TRACK_MESSAGE, shouldOfferTrack } from "@/lib/crm/personalTrack";

// הצעת "המסלול האישי".
//
// מוצגת אך ורק אחרי שההרשמה הושלמה, ולעולם לא בתוך שלבי מילוי הטופס:
// אזכור עלות באמצע המילוי יוצר חיכוך, וההצטרפות למאגר ממילא ללא תשלום.
//
// variant="full"    – מסך הביניים שאחרי השליחה.
// variant="compact" – האזור האישי, דיסקרטי וקבוע.
//
// currentTrack נקבע לפי מה שכבר נבחר: מי שכבר במסלול אינו רואה את
// ההצעה שוב, אלא אישור קצר במקומה.
export default function PersonalTrackOffer({ variant = "full", currentTrack = "", onChoose, payment }) {
  // קישורי התשלום והמחיר מגיעים ממה שהמנהלת הגדירה בלוח הבקרה.
  // אם עדיין לא הוגדר דבר, נופלים לברירות המחדל שבקוד.
  const pay = { ...DEFAULT_CONTENT.payment, ...(payment || {}) };
  const PERSONAL_TRACK_PRICE = pay.personalTrackPrice;
  const PAYBOX_URL = pay.payboxUrl;
  const BIT_PHONE = pay.bitPhone;
  const compact = variant === "compact";
  const [choice, setChoice] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedAs, setSavedAs] = useState("");
  const [error, setError] = useState("");

  const effective = savedAs || currentTrack;

  // כבר במסלול: אישור קצר במקום ההצעה, בלי כפילות ובלי לחץ מיותר
  if (!shouldOfferTrack(effective)) {
    return (
      <div className={`rounded-2xl border border-[#2FA39B] bg-[#2FA39B]/5 p-4 ${compact ? "mt-4" : "mt-5"}`}>
        <p className="flex items-center gap-1.5 text-[13.5px] font-bold text-[#21867F]">
          <Check size={15} /> אתם במסלול האישי
        </p>
        <p className="mt-1 text-[12.5px] leading-relaxed text-[#5E7A87]">
          נחזור אליכם לתיאום השיחה.
        </p>
      </div>
    );
  }

  // ביקשו שנחזור אליהם: מציגים את האישור, ומשאירים אפשרות לעדכן
  const alreadyAsked = effective === TRACK_MESSAGE;

  const submit = async (value) => {
    if (!onChoose || saving) return;
    setSaving(true);
    setError("");
    try {
      await onChoose(value, message);
      setSavedAs(value);
    } catch {
      setError("השמירה לא הצליחה כרגע. אפשר לנסות שוב.");
    } finally {
      setSaving(false);
    }
  };

  const hasPayment = Boolean(PAYBOX_URL || BIT_PHONE);

  return (
    <div
      className={
        compact
          ? "mt-4 w-full rounded-2xl border border-[#CFE3EC] bg-white p-4 text-right"
          : "mt-5 rounded-3xl border-2 border-[#2E8BA8] bg-white p-5 text-right shadow-[0_4px_18px_rgba(31,110,136,0.08)]"
      }
    >
      <p className={`flex items-center gap-1.5 font-bold text-[#1F6E88] ${compact ? "text-[13.5px]" : "text-[15px]"}`}>
        <Sparkles size={compact ? 15 : 17} />
        {compact ? `המסלול האישי · ${PERSONAL_TRACK_PRICE} ₪` : "רוצים שנדייק את החיפוש?"}
      </p>

      <p className={`mt-1.5 leading-relaxed text-[#23414E] ${compact ? "text-[12.5px] text-[#5E7A87]" : "text-[13.5px]"}`}>
        {compact ? (
          "שיחת היכרות מעמיקה שבה נדייק יחד את מה שאתם באמת מחפשים. אופציונלי, ואפשר להצטרף בכל שלב."
        ) : (
          <>
            <strong>המסלול האישי</strong> הוא שיחת היכרות מעמיקה איתנו, שבה נדייק יחד את מה שאתם
            באמת מחפשים. זה מה שהופך את ההצעות מ״מתאים על הנייר״ למתאים באמת.
          </>
        )}
      </p>

      {!compact && (
        <p className="mt-3 rounded-2xl bg-[#EAF5FA] px-3.5 py-2.5 text-[13px] font-semibold text-[#1F6E88]">
          מחיר השקה: {PERSONAL_TRACK_PRICE} ₪ בלבד · אופציונלי לחלוטין
        </p>
      )}

      {hasPayment && (
        <div className="mt-3 space-y-2">
          {PAYBOX_URL && (
            <a
              href={PAYBOX_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex w-full items-center justify-center gap-1.5 rounded-2xl bg-[#2E8BA8] font-bold text-white transition active:scale-95 ${
                compact ? "py-2.5 text-[13px]" : "py-3 text-[14px]"
              }`}
            >
              תשלום מהיר ב-PayBox
            </a>
          )}
          {BIT_PHONE && (
            <p className="flex items-center justify-center gap-1.5 rounded-2xl border border-[#CFE3EC] py-2.5 text-[13px] font-semibold text-[#23414E]">
              <Phone size={14} /> ביט למספר {BIT_PHONE}
            </p>
          )}
        </div>
      )}

      {alreadyAsked && (
        <p className="mt-3 rounded-2xl bg-[#EAF5FA] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[#1F6E88]">
          קיבלנו את הבקשה שלכם ונחזור אליכם. אפשר לעדכן אותה כאן בכל רגע.
        </p>
      )}

      {/* הודעה חופשית: תיאום תשלום בדרך אחרת, שאלה, או בקשה לחזרה טלפונית */}
      <label className="mt-3 block">
        <span className="mb-1 flex items-center gap-1 text-[12px] font-semibold text-[#23414E]">
          <MessageSquare size={13} /> רוצים להוסיף משהו? (לא חובה)
        </span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, MAX_TRACK_MESSAGE))}
          rows={3}
          placeholder="למשל: אשמח לתאם תשלום בדרך אחרת · יש לי שאלה · נוח לי שתחזרו אליי בערב"
          onFocus={(e) => {
            const el = e.currentTarget;
            setTimeout(() => el.scrollIntoView({ block: "center", behavior: "smooth" }), 250);
          }}
          className="w-full resize-y rounded-2xl border border-[#CFE3EC] bg-white px-3.5 py-2.5 text-[13.5px] leading-relaxed text-[#23414E] outline-none transition scroll-mb-64 focus:border-[#2E8BA8] focus:ring-2 focus:ring-[#2E8BA8]/20"
        />
      </label>

      <div className="mt-2.5 space-y-2">
        {TRACK_CHOICES.map((c) => (
          <button
            key={c.value}
            type="button"
            disabled={saving}
            onClick={() => submit(c.value)}
            className={`w-full rounded-2xl border-2 px-3.5 py-2.5 text-right transition active:scale-95 disabled:opacity-60 ${
              c.value === TRACK_PAID
                ? "border-[#2FA39B] bg-[#2FA39B]/5 hover:bg-[#2FA39B]/10"
                : "border-[#CFE3EC] bg-white hover:bg-[#F2F8FB]"
            }`}
          >
            <span className="flex items-center gap-1.5 text-[13px] font-bold text-[#23414E]">
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
              {c.label}
            </span>
            <span className="mt-0.5 block text-[11.5px] text-[#5E7A87]">{c.hint}</span>
          </button>
        ))}
      </div>

      {error && <p className="mt-2 text-[12px] text-[#C4584C]">{error}</p>}

      {!compact && (
        <p className="mt-3 text-[12px] leading-relaxed text-[#5E7A87]">
          אפשר גם לדלג — אתם כבר במאגר, וההצטרפות אליו ללא עלות.
        </p>
      )}
    </div>
  );
}
