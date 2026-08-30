"use client";

import { Inbox, PhoneCall, MessageCircle, Check } from "lucide-react";
import { whatsappNumber } from "@/lib/crm/brainstorm";

// פאנל "פניות ממתינות לאישור" בלוח הבקרה.
//
// הפאנל מוצג תמיד, גם כשאין פניות. פאנל שנעלם כשהרשימה ריקה משאיר את
// המנהלת בלי שום דרך לדעת אם אין פניות או שמשהו נשבר - וזה בדיוק מה שקרה.
//
// כל הנתונים מגיעים כ-props, בלי גישה לחנות, כדי שאפשר יהיה להריץ עליו
// בדיקות עם נתוני דמה ולראות בעיניים שהוא באמת מציג את מה שצריך.
export default function IntakePanel({
  items = [],
  handledCount = 0,
  loaded = true,
  error = "",
  approvingId = null,
  rejectingId = null,
  onApprove,
  onReject,
}) {
  return (
    <>
      <h2 className="mt-6 mb-1 flex items-center gap-1.5 text-[15px] font-bold text-[#3A3335]">
        <Inbox size={17} /> פניות ממתינות לאישור
        {items.length > 0 && (
          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#D9B45F] px-1.5 text-[11px] font-bold text-white">
            {items.length}
          </span>
        )}
      </h2>
      <p className="mb-3 text-[12px] leading-relaxed text-[#8A8285]">
        הפרטים כאן גלויים לך בלבד. אחרי שיחת תיאום ציפיות, אישור יוצר את הכרטיס במאגר
        וחושף אותו לצוות.
      </p>

      {error && (
        <p className="mb-3 rounded-2xl bg-red-50 px-3 py-2 text-[12px] leading-relaxed text-[#C24545]">{error}</p>
      )}

      {!loaded ? (
        <div className="rounded-3xl border border-[#EAE5E3] bg-white p-6 text-center text-[13px] text-[#8A8285]">
          טוען פניות...
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#D8CFCB] bg-white p-6 text-center">
          <Inbox size={22} className="mx-auto mb-2 text-[#C9C2C4]" />
          <p className="text-[13px] font-semibold text-[#8A8285]">אין כרגע פניות שממתינות לאישור</p>
          <p className="mt-1 text-[12px] leading-relaxed text-[#B5AEB0]">
            {handledCount > 0
              ? `${handledCount} פניות כבר טופלו. כל פנייה חדשה מהטופס תופיע כאן מיד.`
              : "כל פנייה שתגיע מהטופס החיצוני תופיע כאן מיד."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const wa = whatsappNumber(item.phone);
            const tel = String(item.phone || "").replace(/[^\d+]/g, "");
            const busy = approvingId === item.id || rejectingId === item.id;
            return (
              <div key={item.id} className="overflow-hidden rounded-3xl border border-[#E7CE93] bg-[#FFFCF5]">
                <div className="h-1 w-full bg-gradient-to-l from-[#E7CE93] via-[#D9B45F] to-[#E7CE93]" />
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    {item.photoUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.photoUrl} alt={item.name} className="h-20 w-16 shrink-0 rounded-xl object-cover" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-bold text-[#3A3335]">{item.name}</p>
                      <p className="mt-0.5 text-[12px] leading-relaxed text-[#8A8285]">
                        {[
                          item.gender === "female" ? "בחורה" : "בחור",
                          item.age && `גיל ${item.age}`,
                          item.height && `${item.height} ס״מ`,
                          item.eda,
                          item.tag,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      {[item.religiousLevel, item.city, item.region, item.currentOccupation].filter(Boolean).length >
                        0 && (
                        <p className="mt-0.5 text-[12px] leading-relaxed text-[#8A8285]">
                          {[item.religiousLevel, item.city, item.region, item.currentOccupation]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      )}
                      <p dir="ltr" className="mt-1 text-right text-[14px] font-bold text-[#3A3335]">
                        {item.phone || "לא הוזן טלפון"}
                      </p>
                    </div>
                  </div>

                  {tel && (
                    <div className="mt-3 flex gap-2">
                      <a
                        href={`tel:${tel}`}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-[#EAE5E3] bg-white py-2.5 text-[12px] font-bold text-[#2A6BB0]"
                      >
                        <PhoneCall size={14} /> חיוג
                      </a>
                      {wa && (
                        <a
                          href={`https://wa.me/${wa}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-[#EAE5E3] bg-white py-2.5 text-[12px] font-bold text-[#178A57]"
                        >
                          <MessageCircle size={14} /> וואטסאפ
                        </a>
                      )}
                    </div>
                  )}

                  {item.bio && (
                    <div className="mt-3 rounded-2xl bg-white/80 p-3">
                      <p className="mb-1 text-[10px] font-bold text-[#946200]">תיאור אישי</p>
                      <p className="whitespace-pre-wrap text-[12px] leading-relaxed text-[#3A3335]">{item.bio}</p>
                    </div>
                  )}
                  {item.complexityNotes && (
                    <div className="mt-2 rounded-2xl bg-white/80 p-3">
                      <p className="mb-1 text-[10px] font-bold text-[#946200]">מורכבויות</p>
                      <p className="whitespace-pre-wrap text-[12px] leading-relaxed text-[#3A3335]">
                        {item.complexityNotes}
                      </p>
                    </div>
                  )}
                  {item.referenceContacts && (
                    <div className="mt-2 rounded-2xl bg-white/80 p-3">
                      <p className="mb-1 text-[10px] font-bold text-[#946200]">מספרים לבירורים</p>
                      <p className="whitespace-pre-wrap text-[12px] leading-relaxed text-[#3A3335]">
                        {item.referenceContacts}
                      </p>
                    </div>
                  )}

                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => onApprove?.(item.id)}
                      disabled={busy}
                      className="flex flex-[2] items-center justify-center gap-1.5 rounded-2xl bg-[#20A66B] py-3 text-[13px] font-bold text-white transition active:scale-[0.98] disabled:opacity-50"
                    >
                      <Check size={15} />
                      {approvingId === item.id ? "יוצר כרטיס..." : "אישור ויצירת כרטיס"}
                    </button>
                    <button
                      onClick={() => onReject?.(item.id)}
                      disabled={busy}
                      className="flex flex-1 items-center justify-center rounded-2xl border border-[#EAE5E3] bg-white py-3 text-[13px] font-bold text-[#8A8285] transition active:scale-[0.98] disabled:opacity-50"
                    >
                      {rejectingId === item.id ? "מסיר..." : "לא רלוונטי"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
