"use client";

import { useData } from "../lib/useData";
import { CalendarHeart, ExternalLink, Download } from "lucide-react";
import WhatsApp from "./icons/WhatsApp";

// לוח אירועים ציבורי: פלאייר גדול + הרשמה + שיתוף בוואטסאפ + הורדת התמונה.
export default function EventsBoard() {
  const data = useData();
  const events = [...(data?.events || [])].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

  return (
    <div className="mt-8">
      <div className="mb-3 flex items-center justify-center gap-2 text-roseDark">
        <CalendarHeart className="h-5 w-5" strokeWidth={1.75} />
        <h2 className="text-lg font-bold">אירועים קרובים</h2>
      </div>

      {events.length === 0 ? (
        <div className="card text-center text-sm text-ink/50">
          בקרוב נפרסם כאן אירועים ומפגשים שהציבור מוזמן אליהם. 💫
        </div>
      ) : (
        <div className="space-y-5">
          {events.map((ev) => {
            const shareText = `${ev.title || "אירוע"}${ev.link ? `\n${ev.link}` : ""}`;
            return (
              <div key={ev.id} className="card overflow-hidden !p-0">
                {ev.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={ev.image} alt={ev.title || "אירוע"} className="w-full object-cover" />
                )}
                <div className="space-y-3 p-4">
                  {ev.title && <p className="text-center text-lg font-bold text-ink">{ev.title}</p>}
                  {ev.caption && <p className="whitespace-pre-wrap text-center text-sm text-ink/70">{ev.caption}</p>}

                  <div className="flex flex-col gap-2">
                    {ev.link && (
                      <a href={ev.link} target="_blank" rel="noreferrer" className="btn-primary w-full">
                        <ExternalLink className="h-4 w-4" strokeWidth={1.75} /> הרשמה / הצטרפות
                      </a>
                    )}
                    <div className="flex gap-2">
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-soft flex-1"
                      >
                        <WhatsApp size={16} className="text-green-600" /> שתף בוואטסאפ
                      </a>
                      {ev.image && (
                        <a href={ev.image} download={`${(ev.title || "event").replace(/\s+/g, "-")}.jpg`} className="btn-soft flex-1">
                          <Download className="h-4 w-4" strokeWidth={1.75} /> הורד תמונה
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
