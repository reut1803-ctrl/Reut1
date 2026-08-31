"use client";

// תיבת הפניות מהטופס החיצוני.
//
// מועמד/ת שממלא/ת את הטופס הציבורי אינו/ה נכנס/ת ישירות למאגר: הפנייה
// מופקדת באוסף נפרד, והמנהלת היא שמחליטה אם לפתוח ממנה כרטיס. כך המאגר
// נשאר סגור לכתיבה מבחוץ, ושום דבר לא נכנס אליו בלי עין אנושית.

import { useState } from "react";
import { Mail, Phone, MessageCircle, Check, X, AlertTriangle, Inbox } from "lucide-react";
import { useCrmStore } from "@/lib/crm/store";
import { waDigits } from "@/components/crm/profiles/ProfileCard";
import { prettyPhone } from "@/components/crm/ui/CopyStaffButton";
import ConfirmDialog from "@/components/crm/ui/ConfirmDialog";

export default function IntakeInbox() {
  const pendingIntake = useCrmStore((s) => s.pendingIntake);
  const intakeError = useCrmStore((s) => s.intakeError);
  const intakeLoaded = useCrmStore((s) => s.intakeLoaded);
  const approveIntake = useCrmStore((s) => s.approveIntake);
  const rejectIntake = useCrmStore((s) => s.rejectIntake);
  const showToast = useCrmStore((s) => s.showToast);

  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [confirmReject, setConfirmReject] = useState(null);

  const items = pendingIntake();

  const handleApprove = async (item) => {
    setBusyId(item.id);
    setError("");
    try {
      await approveIntake(item);
      showToast(`נוצר כרטיס עבור ${item.name}`);
    } catch (err) {
      setError(`יצירת הכרטיס נכשלה: ${err?.code || ""} ${err?.message || String(err)}`);
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (item) => {
    setBusyId(item.id);
    setError("");
    try {
      await rejectIntake(item.id);
    } catch (err) {
      setError(`הפעולה נכשלה: ${err?.code || ""} ${err?.message || String(err)}`);
    } finally {
      setBusyId(null);
      setConfirmReject(null);
    }
  };

  return (
    <>
      <h2 className="mt-8 mb-3 flex items-center gap-1.5 text-[15px] font-bold text-[#3A2E26]">
        <Inbox size={17} /> פניות מטופס ההרשמה
        {items.length > 0 && (
          <span className="rounded-full bg-[#844442] px-2 py-0.5 text-[11px] font-bold text-white">
            {items.length}
          </span>
        )}
      </h2>

      {/* כישלון גלוי: אם כללי האבטחה החדשים טרם פורסמו, הקריאה נחסמת -
          וזה חייב להיראות על המסך ולא להיעלם בשקט. */}
      {intakeError && (
        <div className="mb-3 flex items-start gap-2 rounded-2xl border-2 border-[#C24545] bg-red-50 px-3.5 py-3">
          <AlertTriangle size={17} className="mt-0.5 shrink-0 text-[#C24545]" />
          <div className="text-[12px] leading-relaxed text-[#C24545]">
            <p className="font-bold">תיבת הפניות חסומה</p>
            <p className="mt-0.5">
              כללי האבטחה של טופס ההרשמה עדיין לא פורסמו ב-Firebase. עד שזה ייעשה, פניות שיגיעו
              מהטופס לא יוצגו כאן. יש להדביק את הכללים שקיבלת בקונסולה של Firebase וללחוץ "פרסם".
            </p>
          </div>
        </div>
      )}

      {error && (
        <p className="mb-3 rounded-2xl bg-red-50 px-3 py-2 text-[12px] font-semibold text-[#C24545]">{error}</p>
      )}

      {!intakeError && intakeLoaded && items.length === 0 ? (
        <p className="rounded-3xl border border-[#CCBDAB] bg-white px-4 py-6 text-center text-[13px] text-[#7C6E60]">
          אין פניות חדשות כרגע. פנייה שתגיע מהטופס תופיע כאן.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-3xl border-2 border-[#D9A441] bg-white p-4 shadow-[0_4px_18px_rgba(58,51,53,0.06)]"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-[#FDF6E7] px-2.5 py-1 text-[10px] font-bold text-[#7A5A18]">
                  <Mail size={11} /> הגיע/ה מהטופס החיצוני
                </span>
                <div className="min-w-0 text-right">
                  <p className="truncate text-[15px] font-bold text-[#3A2E26]">{item.name}</p>
                  <p className="mt-0.5 text-[12px] text-[#7C6E60]">
                    {[
                      item.gender === "male" ? "בחור" : "בחורה",
                      item.age ? `גיל ${item.age}` : null,
                      item.height ? `${item.height} ס״מ` : null,
                      item.eda,
                      item.city,
                      item.religiousLevel,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  {item.currentOccupation && (
                    <p className="text-[12px] text-[#7C6E60]">עיסוק כיום: {item.currentOccupation}</p>
                  )}
                </div>
              </div>

              {/* יצירת קשר ישירה, בלי לצאת מהמסך */}
              {item.phone && (
                <div className="mt-3 border-t border-[#E8DCCB] pt-3">
                  <p dir="ltr" className="mb-2 text-right text-[13px] font-bold text-[#3A2E26]">
                    {prettyPhone(item.phone)}
                  </p>
                  <div className="flex gap-2">
                    <a
                      href={`tel:${item.phone}`}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-[#844442] px-3 py-2.5 text-[13px] font-semibold text-white transition active:scale-95"
                    >
                      <Phone size={15} /> חיוג
                    </a>
                    <a
                      href={`https://wa.me/${waDigits(item.phone)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-[#62826B] px-3 py-2.5 text-[13px] font-semibold text-white transition active:scale-95"
                    >
                      <MessageCircle size={15} /> וואטסאפ
                    </a>
                  </div>
                </div>
              )}

              {Array.isArray(item.occupations) && item.occupations.length > 0 && (
                <div className="mt-3">
                  <p className="mb-1.5 text-[11px] font-semibold text-[#3A2E26]">המסלול שלי</p>
                  <div className="flex flex-wrap gap-1.5">
                    {item.occupations.map((t) => (
                      <span key={t} className="rounded-full bg-[#E8DCCB] px-2.5 py-1 text-[11px] font-semibold text-[#3A2E26]">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {item.bio && (
                <div className="mt-3">
                  <p className="mb-1 text-[11px] font-semibold text-[#3A2E26]">תיאור אישי</p>
                  <p className="whitespace-pre-line rounded-2xl bg-[#F5EFE6] px-3 py-2 text-[12px] leading-relaxed text-[#3A2E26]">
                    {item.bio}
                  </p>
                </div>
              )}

              {item.referenceContacts && (
                <div className="mt-3">
                  <p className="mb-1 text-[11px] font-semibold text-[#3A2E26]">מספרים לבירורים</p>
                  <p className="whitespace-pre-line rounded-2xl bg-[#F5EFE6] px-3 py-2 text-[12px] leading-relaxed text-[#3A2E26]">
                    {item.referenceContacts}
                  </p>
                </div>
              )}

              <div className="mt-3 flex gap-2 border-t border-[#E8DCCB] pt-3">
                <button
                  onClick={() => handleApprove(item)}
                  disabled={busyId === item.id}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-[#62826B] px-3 py-3 text-[14px] font-semibold text-white transition active:scale-95 disabled:opacity-60"
                >
                  <Check size={16} /> {busyId === item.id ? "יוצרת..." : "אישור ויצירת כרטיס"}
                </button>
                <button
                  onClick={() => setConfirmReject(item)}
                  disabled={busyId === item.id}
                  className="flex items-center justify-center gap-1.5 rounded-2xl border border-[#CCBDAB] bg-white px-4 py-3 text-[13px] font-semibold text-[#7C6E60] transition active:scale-95 disabled:opacity-60"
                >
                  <X size={15} /> לא רלוונטי
                </button>
              </div>

              {item.createdAt && (
                <p className="mt-2 text-left text-[10px] text-[#A2937F]">
                  התקבל ב-{new Date(item.createdAt).toLocaleString("he-IL")}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {confirmReject && (
        <ConfirmDialog
          message={`הפנייה של ${confirmReject.name} תרד מהתיבה ולא ייווצר ממנה כרטיס. הפנייה נשמרת במערכת.`}
          onConfirm={() => handleReject(confirmReject)}
          onCancel={() => setConfirmReject(null)}
        />
      )}
    </>
  );
}
