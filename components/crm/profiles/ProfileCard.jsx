"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, Mic, PenLine, ChevronDown, Play, MapPin, Copy, Download, HeartHandshake, Check } from "lucide-react";
import { useCrmStore } from "@/lib/crm/store";
import Button from "@/components/crm/ui/Button";
import { getGradientClass } from "@/components/crm/ui/gradients";
import { viewerActionText } from "@/lib/crm/genderText";
import { buildProfileShareText } from "@/lib/crm/shareText";
import StageFunnel from "@/components/crm/proposals/StageFunnel";

export default function ProfileCard({ candidate, onReadMore }) {
  const role = useCrmStore((s) => s.role);
  const board = useCrmStore((s) => s.board);
  const isFavorite = useCrmStore((s) => s.isFavorite(candidate.id));
  const toggleFavorite = useCrmStore((s) => s.toggleFavorite);
  const expandedId = useCrmStore((s) => s.expandedStaffAreaId);
  const toggleStaffArea = useCrmStore((s) => s.toggleStaffArea);
  const proposals = useCrmStore((s) => s.proposalsForCandidate(candidate.id));
  const [recording, setRecording] = useState(false);
  const [copied, setCopied] = useState(false);

  const canSeeFullProfile = role === "staff" || role === "admin";
  const isExpanded = expandedId === candidate.id;
  const firstName = candidate.name.split(" ")[0];

  const shareText = buildProfileShareText(candidate, { includePhone: canSeeFullProfile });

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([shareText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${candidate.name}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-[#EAE5E3] bg-white shadow-[0_4px_18px_rgba(58,51,53,0.06)]">
      <div className={`relative aspect-[4/5] w-full bg-gradient-to-br ${getGradientClass(candidate.gradient)}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-6xl font-bold text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.25)]">
            {candidate.initials}
          </span>
        </div>

        {candidate.isNew && (
          <span className="absolute right-3 top-3 rounded-full bg-[#8C4A55] px-2.5 py-1 text-[11px] font-bold text-white shadow">
            חדש
          </span>
        )}

        <button
          onClick={() => toggleFavorite(candidate.id)}
          aria-label="הוספה למועדפים"
          className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow transition active:scale-90"
        >
          <Heart size={18} className={isFavorite ? "fill-[#8C4A55] text-[#8C4A55]" : "text-[#8A8285]"} />
        </button>

        <div className="absolute bottom-3 right-3 flex flex-wrap gap-1.5">
          <span className="tag-chip-crm">{candidate.age}</span>
          <span className="tag-chip-crm">{candidate.height} ס״מ</span>
          <span className="tag-chip-crm flex items-center gap-1">
            <MapPin size={11} /> {candidate.region}
          </span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-lg font-bold text-[#3A3335]">{candidate.name}</h3>
        <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-[#8A8285]">{candidate.bio}</p>

        <div className="mt-4 flex flex-col gap-2">
          <Button variant="pink" className="w-full" onClick={() => onReadMore?.(candidate)}>
            {viewerActionText(board, { male: "קרא", female: "קראי" })} עוד על {firstName}
          </Button>

          {canSeeFullProfile && (
            <Link
              href={`/crm/proposals?select=${candidate.id}`}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-2xl bg-[#20A66B] px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(32,166,107,0.25)] transition active:scale-95 hover:bg-[#178A57]"
            >
              <HeartHandshake size={16} /> הצע/י התאמה עבור {firstName}
            </Link>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-2xl border-2 border-[#20A66B] bg-white px-3 py-3 text-sm font-semibold text-[#178A57] transition active:scale-95 hover:bg-[#20A66B]/5"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "הועתק!" : "העתקת טקסט"}
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-2xl border-2 border-[#20A66B] bg-white px-3 py-3 text-sm font-semibold text-[#178A57] transition active:scale-95 hover:bg-[#20A66B]/5"
            >
              <Download size={16} /> הורדה לקובץ
            </button>
          </div>
        </div>

        {proposals.length > 0 && (
          <div className="mt-4 rounded-2xl bg-[#F6F5F4] p-3">
            <p className="mb-2 text-[12px] font-semibold text-[#3A3335]">התקדמות בהתאמות ({proposals.length})</p>
            <div className="space-y-2.5">
              {proposals.map((p) => (
                <div key={p.id}>
                  <p className="mb-1 text-[11px] font-semibold text-[#8C4A55]">{p.status}</p>
                  <StageFunnel status={p.status} compact />
                </div>
              ))}
            </div>
          </div>
        )}

        {canSeeFullProfile && (
          <div className="mt-4 border-t border-[#EAE5E3] pt-3">
            <button
              onClick={() => toggleStaffArea(candidate.id)}
              className="flex w-full items-center justify-between text-[13px] font-semibold text-[#8C4A55]"
            >
              <span>אזור פנימי לצוות</span>
              <ChevronDown size={16} className={`transition ${isExpanded ? "rotate-180" : ""}`} />
            </button>

            {isExpanded && (
              <div className="mt-3 space-y-3">
                <div className="rounded-2xl bg-[#F6F5F4] p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="flex items-center gap-1.5 text-[12px] font-semibold text-[#3A3335]">
                      <Mic size={14} /> הקלטות שמע
                    </p>
                    <button
                      onClick={() => setRecording((v) => !v)}
                      className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition ${
                        recording ? "bg-red-500 text-white" : "bg-[#8C4A55] text-white"
                      }`}
                    >
                      {recording ? "עצירת הקלטה" : "הקלטה חדשה"}
                    </button>
                  </div>
                  {recording && <p className="mb-2 animate-pulse text-[11px] text-red-500">מקליטה כעת...</p>}
                  {candidate.voiceNotes.length === 0 ? (
                    <p className="text-[12px] text-[#B5AEB0]">אין הקלטות עדיין</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {candidate.voiceNotes.map((vn) => (
                        <li
                          key={vn.id}
                          className="flex items-center gap-2 rounded-xl bg-white px-2.5 py-2 text-[12px] shadow-sm"
                        >
                          <Play size={13} className="text-[#20A66B]" />
                          <span className="font-medium text-[#3A3335]">{vn.author}</span>
                          <span className="text-[#B5AEB0]">{vn.duration}</span>
                          <span className="mr-auto text-[#B5AEB0]">{vn.date}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {role === "admin" && (
                  <>
                    <div className="handwritten-note-crm">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-[11px] font-bold not-italic text-amber-800">
                          <PenLine size={12} /> הערת מנהלת
                        </span>
                      </div>
                      {candidate.adminNote || "אין הערה עדיין - לחצי לעריכה"}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .tag-chip-crm {
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.92);
          padding: 4px 10px;
          font-size: 11px;
          font-weight: 700;
          color: #3a3335;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
        }
        .handwritten-note-crm {
          transform: rotate(-1deg);
          border-radius: 12px;
          border: 1px solid #fde68a;
          background: #fffbeb;
          padding: 10px 12px;
          font-size: 13px;
          font-style: italic;
          line-height: 1.4;
          color: #78350f;
        }
      `}</style>
    </div>
  );
}
