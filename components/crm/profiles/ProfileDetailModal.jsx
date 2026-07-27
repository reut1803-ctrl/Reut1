"use client";

import { X, MapPin, GraduationCap, Cigarette, Sparkles } from "lucide-react";
import { getGradientClass } from "@/components/crm/ui/gradients";

export default function ProfileDetailModal({ candidate, onClose }) {
  const educationLabel = candidate.gender === "male" ? candidate.yeshivaLevel : candidate.education;

  return (
    <div className="fixed inset-0 z-[150] flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className={`relative aspect-[4/3] w-full bg-gradient-to-br ${getGradientClass(candidate.gradient)}`}>
          {candidate.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={candidate.photoUrl} alt={candidate.name} className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-6xl font-bold text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.25)]">
                {candidate.initials}
              </span>
            </div>
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
          <h2 className="text-xl font-bold text-[#3A3335]">{candidate.name}</h2>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <span className="tag-chip-detail">{candidate.age}</span>
            <span className="tag-chip-detail">{candidate.height} ס״מ</span>
            <span className="tag-chip-detail flex items-center gap-1">
              <MapPin size={11} /> {candidate.region}
            </span>
          </div>

          <div className="mt-4 space-y-2.5">
            <DetailRow icon={Sparkles} label="רמת תורניות" value={candidate.religiousLevel} />
            <DetailRow icon={GraduationCap} label={candidate.gender === "male" ? "רמת לימוד" : "השכלה / עיסוק"} value={educationLabel} />
            <DetailRow icon={Cigarette} label="עישון" value={candidate.smoking} />
          </div>

          {candidate.bio && (
            <div className="mt-4">
              <p className="mb-1 text-[12px] font-semibold text-[#3A3335]">קצת עליי</p>
              <p className="whitespace-pre-line text-[13px] leading-relaxed text-[#8A8285]">{candidate.bio}</p>
            </div>
          )}

          {candidate.traits?.length > 0 && (
            <div className="mt-4">
              <p className="mb-1.5 text-[12px] font-semibold text-[#3A3335]">תכונות</p>
              <div className="flex flex-wrap gap-1.5">
                {candidate.traits.map((t) => (
                  <span key={t} className="rounded-full bg-[#F6E4E6] px-2.5 py-1 text-[11px] font-semibold text-[#6E3540]">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .tag-chip-detail {
          border-radius: 999px;
          background: #f6f5f4;
          padding: 4px 10px;
          font-size: 11px;
          font-weight: 700;
          color: #3a3335;
        }
      `}</style>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2.5 rounded-xl bg-[#F6F5F4] px-3 py-2.5">
      <Icon size={16} className="shrink-0 text-[#8C4A55]" />
      <span className="w-24 shrink-0 text-[12px] text-[#8A8285]">{label}</span>
      <span className="text-sm font-medium text-[#3A3335]">{value}</span>
    </div>
  );
}
