"use client";

import { useState } from "react";
import { Mic, Square, Play, PenLine, MessageCircle, Share2 } from "lucide-react";
import Sheet from "@/components/ui/Sheet";
import { useAppStore } from "@/lib/store";
import { PIPELINE_STATUSES } from "@/lib/data";

export default function ProfileDetailSheet({ candidate, onClose }) {
  const role = useAppStore((s) => s.role);
  const [recording, setRecording] = useState(false);
  const [status, setStatus] = useState(PIPELINE_STATUSES[0]);

  if (!candidate) return null;
  const canSeeInternal = role === "staff" || role === "admin";

  return (
    <Sheet open={!!candidate} onClose={onClose} title={candidate.name} maxHeight="90vh">
      <div className="flex flex-col gap-5">
        <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl bg-pink-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={candidate.image} alt={candidate.name} className="h-full w-full object-cover" />
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <StatBox label="גיל" value={candidate.age} />
          <StatBox label="גובה" value={`${candidate.height} ס״מ`} />
          <StatBox label="אזור" value={candidate.region} />
        </div>

        <div>
          <h4 className="mb-1.5 text-sm font-bold text-ink">אודות</h4>
          <p className="text-sm leading-relaxed text-muted">{candidate.about}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <DetailRow label="רמת תורניות" value={candidate.religiousLevel} />
          <DetailRow label="לימודים / תעסוקה" value={candidate.study} />
          <DetailRow label="עישון" value={candidate.smoking} />
          <DetailRow label="תכונות בולטות" value={candidate.traits.join(", ") || "—"} />
        </div>

        <div className="flex gap-2">
          <a
            href="https://wa.me/972500000000"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-mint flex-1"
          >
            <MessageCircle size={16} />
            שלחי הודעה לבירורים
          </a>
          <a href="https://wa.me/" target="_blank" rel="noopener noreferrer" className="btn-outline-mint flex-1">
            <Share2 size={16} />
            שיתוף
          </a>
        </div>

        {canSeeInternal && (
          <div className="rounded-2xl border border-bordeaux-100 bg-bordeaux-50/40 p-4">
            <h4 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-bordeaux-500">
              אזור פנימי לצוות
            </h4>

            <div className="mb-4">
              <p className="mb-2 text-xs font-semibold text-muted">הקלטת שמע - סיעור מוחות</p>
              <div className="flex items-center gap-3 rounded-2xl bg-white p-3">
                <button
                  onClick={() => setRecording((v) => !v)}
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-white transition ${
                    recording ? "bg-red-500 animate-pulse" : "bg-bordeaux-500"
                  }`}
                >
                  {recording ? <Square size={16} /> : <Mic size={16} />}
                </button>
                <div className="flex-1">
                  <p className="text-xs font-medium text-ink">
                    {recording ? "מקליטה כעת..." : "לחצי כדי להתחיל הקלטה"}
                  </p>
                  <p className="text-[11px] text-muted">2 הקלטות שמורות בתיק</p>
                </div>
                <button className="text-muted">
                  <Play size={16} />
                </button>
              </div>
            </div>

            <div className="mb-4">
              <p className="mb-2 text-xs font-semibold text-muted">הערת נציג/ה</p>
              <p className="rounded-2xl bg-white p-3 text-sm text-ink">{candidate.staffNote}</p>
            </div>

            {role === "admin" && (
              <div>
                <p className="mb-2 flex items-center gap-1 text-xs font-semibold text-muted">
                  <PenLine size={13} />
                  פתק אישי של רעות
                </p>
                <div
                  className="rounded-2xl border border-dashed border-bordeaux-200 bg-[#FFFDF6] p-3 text-sm text-bordeaux-500"
                  style={{ fontFamily: "cursive" }}
                >
                  {candidate.adminNote || "אין הערה עדיין - הקלידי כדי להוסיף פתק אישי."}
                </div>
              </div>
            )}

            {role === "admin" && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold text-muted">סטטוס במשפך ההתאמות</p>
                <div className="flex flex-wrap gap-1.5">
                  {PIPELINE_STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatus(s)}
                      className={`pill border transition ${
                        status === s
                          ? "border-mint-500 bg-mint-500 text-white"
                          : "border-black/10 bg-white text-muted"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Sheet>
  );
}

function StatBox({ label, value }) {
  return (
    <div className="rounded-2xl bg-pink-50 py-3">
      <p className="text-sm font-bold text-bordeaux-500">{value}</p>
      <p className="text-[11px] text-muted">{label}</p>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="rounded-2xl bg-bg p-3">
      <p className="mb-0.5 text-[11px] text-muted">{label}</p>
      <p className="font-medium text-ink">{value}</p>
    </div>
  );
}
