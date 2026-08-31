"use client";

import MediaImage from "@/components/crm/ui/MediaImage";
import { X, MapPin, Briefcase, Sparkles, Route, Mail } from "lucide-react";
import { getGradientClass } from "@/components/crm/ui/gradients";
import { useBackToClose } from "@/lib/crm/useBackToClose";
import { occupationsOf, locationOf } from "@/lib/crm/mockData";

export default function ProfileDetailModal({ candidate, onClose }) {
  useBackToClose(true, onClose);
  const routeTags = occupationsOf(candidate);
  const photos = candidate.photoUrls?.length > 0 ? candidate.photoUrls : candidate.photoUrl ? [candidate.photoUrl] : [];

  return (
    <div className="fixed inset-0 z-[150] flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className={`relative aspect-[4/3] w-full bg-gradient-to-br ${getGradientClass(candidate.gradient)}`}>
          {photos.length > 0 ? (
            <div className="flex h-full w-full snap-x snap-mandatory overflow-x-auto [&::-webkit-scrollbar]:hidden">
              {photos.map((url, i) => (
                <MediaImage
                  key={i}
                  src={url}
                  alt={candidate.name}
                  className="h-full w-full shrink-0 snap-center object-cover"
                />
              ))}
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-6xl font-bold text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.25)]">
                {candidate.initials}
              </span>
            </div>
          )}
          {photos.length > 1 && (
            <span className="absolute bottom-2.5 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-semibold text-white">
              החליקו לצדדים · {photos.length} תמונות
            </span>
          )}
          <button
            onClick={onClose}
            aria-label="סגירה"
            className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          <div className="flex items-center gap-2">
            <h2 className="min-w-0 text-xl font-bold text-[#3A2E26]">{candidate.name}</h2>
            {candidate.source === "register-form" && (
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-[#FDF6E7] px-2 py-0.5 text-[10px] font-bold text-[#7A5A18]">
                <Mail size={10} /> נרשם/ה דרך הטופס
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <span className="tag-chip-detail">{candidate.age}</span>
            <span className="tag-chip-detail">{candidate.height} ס״מ</span>
            {locationOf(candidate) && (
              <span className="tag-chip-detail flex items-center gap-1">
                <MapPin size={11} /> {locationOf(candidate)}
              </span>
            )}
            {candidate.eda && <span className="tag-chip-detail">{candidate.eda}</span>}
          </div>

          <div className="mt-4 space-y-2.5">
            {/* שתי שורות בלבד ובסדר קבוע: קודם הרמה התורנית, אחריה מה שהוא/היא
                עושים כיום. העדה עלתה לשורת העיגולים, והמסלול ירד לתחתית הכרטיס. */}
            <DetailRow icon={Sparkles} label="רמת תורניות" value={candidate.religiousLevel} />
            <DetailRow icon={Briefcase} label="עיסוק כיום" value={candidate.currentOccupation} />
          </div>

          {candidate.bio && (
            <div className="mt-4">
              <p className="mb-1 text-[12px] font-semibold text-[#3A2E26]">קצת עליי</p>
              <p className="whitespace-pre-line text-[13px] leading-relaxed text-[#7C6E60]">{candidate.bio}</p>
            </div>
          )}

          {/* "המסלול שלי" - כל הדרכים שהאדם עבר. יושב למטה ליד התכונות, ולא
              בין הנתונים הקצרים למעלה, כי זה סיפור רקע ולא פרט זיהוי. */}
          {routeTags.length > 0 && (
            <div className="mt-4">
              <p className="mb-1.5 flex items-center gap-1.5 text-[12px] font-semibold text-[#3A2E26]">
                <Route size={13} /> המסלול שלי
              </p>
              <div className="flex flex-wrap gap-1.5">
                {routeTags.map((t) => (
                  <span key={t} className="rounded-full bg-[#E8DCCB] px-2.5 py-1 text-[11px] font-semibold text-[#3A2E26]">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {candidate.traits?.length > 0 && (
            <div className="mt-4">
              <p className="mb-1.5 text-[12px] font-semibold text-[#3A2E26]">תכונות</p>
              <div className="flex flex-wrap gap-1.5">
                {candidate.traits.map((t) => (
                  <span key={t} className="rounded-full bg-[#F0E2DE] px-2.5 py-1 text-[11px] font-semibold text-[#5E2F2D]">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* עישון כהערת שוליים עדינה בתחתית, ולא כשורת נתון בולטת.
              הנתון עצמו נשמר ומשמש את מבחן ההתאמות כרגיל. */}
          {candidate.smoking && (
            <p className="mt-5 text-[11px] leading-relaxed text-[#A2937F]">* {candidate.smoking}</p>
          )}
        </div>
      </div>

      <style jsx>{`
        .tag-chip-detail {
          border-radius: 999px;
          background: #E8DCCB;
          padding: 4px 10px;
          font-size: 11px;
          font-weight: 700;
          color: #3A2E26;
        }
      `}</style>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2.5 rounded-xl bg-[#E8DCCB] px-3 py-2.5">
      <Icon size={16} className="shrink-0 text-[#844442]" />
      <span className="w-24 shrink-0 text-[12px] text-[#7C6E60]">{label}</span>
      <span className="text-sm font-medium text-[#3A2E26]">{value}</span>
    </div>
  );
}
