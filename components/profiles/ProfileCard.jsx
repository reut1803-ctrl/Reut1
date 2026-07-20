"use client";

import { Heart, MessageCircle, Share2 } from "lucide-react";
import { useAppStore } from "@/lib/store";

export default function ProfileCard({ candidate, onReadMore, matchScore }) {
  const isFavorite = useAppStore((s) => s.favorites.includes(candidate.id));
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);

  const shareText = encodeURIComponent(
    `שווה להסתכל על ההצעה של ${candidate.name} במאגר`
  );

  return (
    <div className="card overflow-hidden">
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-pink-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={candidate.image}
          alt={candidate.name}
          className="h-full w-full object-cover"
          loading="lazy"
        />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <div className="flex flex-wrap gap-1.5">
            {candidate.isNew && (
              <span className="pill bg-pink-500 text-white shadow-soft">חדש</span>
            )}
            {matchScore && (
              <span className="pill bg-mint-500 text-white shadow-soft">{matchScore}% התאמה</span>
            )}
          </div>
          <button
            onClick={() => toggleFavorite(candidate.id)}
            aria-label="הוספה למועדפים"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-soft transition active:scale-90"
          >
            <Heart
              size={18}
              className={isFavorite ? "fill-pink-500 text-pink-500" : "text-muted"}
            />
          </button>
        </div>

        <div className="absolute inset-x-0 bottom-0 flex flex-wrap gap-1.5 bg-gradient-to-t from-black/55 to-transparent p-3 pt-8">
          <InfoTag text={`גיל ${candidate.age}`} />
          <InfoTag text={`${candidate.height} ס"מ`} />
          <InfoTag text={candidate.region} />
        </div>
      </div>

      <div className="p-4">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-base font-bold text-ink">{candidate.name}</h3>
          <span className="text-xs font-medium text-muted">{candidate.religiousLevel}</span>
        </div>
        <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-muted">{candidate.about}</p>

        <div className="flex flex-col gap-2">
          <button onClick={() => onReadMore(candidate)} className="btn-pink w-full">
            קראי עוד על {candidate.name}
          </button>
          <div className="flex gap-2">
            <a
              href={`https://wa.me/972500000000?text=${shareText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-mint flex-1"
            >
              <MessageCircle size={16} />
              שלחי הודעה לבירורים
            </a>
            <a
              href={`https://wa.me/?text=${shareText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline-mint flex-1"
            >
              <Share2 size={16} />
              שתפי בוואטסאפ
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoTag({ text }) {
  return (
    <span className="pill bg-white/85 text-ink backdrop-blur">{text}</span>
  );
}
