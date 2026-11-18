"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useRows, useTripCtx } from "@/lib/tripContext";
import { heDate } from "@/lib/time";
import { AudioClip, PhotoThumb } from "./media";
import type { Entry, Photo } from "./JournalView";

type Day = { id: string; lodging?: string };

// קפסולת זמן: כל הימים, התמונות, התודות וההקלטות — אלבום אחד נגלל.
export default function CapsuleView() {
  const { trip } = useTripCtx();
  const entries = useRows<Entry>("journal");
  const photos = useRows<Photo>("photos");
  const days = useRows<Day>("days");
  const places = useRows<{ id: string }>("places");
  const root = useRef<HTMLDivElement>(null);

  const dates = Array.from(new Set([...(entries ?? []).map((e) => e.date), ...(photos ?? []).map((p) => p.date)])).sort();
  const recordings = (entries ?? []).filter((e) => e.audioId).length;
  const face = (uid: string) => trip.members.find((m) => m.uid === uid)?.avatarUrl;

  useEffect(() => {
    const scope = root.current;
    if (!scope || !dates.length) return;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      scope.querySelectorAll(".cap-day").forEach((el) => {
        gsap.from(el, { y: 50, opacity: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 90%" } });
      });
    }, scope);
    return () => mm.revert();
  }, [dates.length]);

  if (entries === null || photos === null) return <p className="hint center">טוען…</p>;

  return (
    <div className="stack" ref={root}>
      <div className="cap-stats">
        <div className="stat glass"><span className="stat-num">{dates.length}</span><span className="stat-label">ימים מתועדים</span></div>
        <div className="stat glass"><span className="stat-num">{photos.length}</span><span className="stat-label">תמונות</span></div>
        <div className="stat glass"><span className="stat-num">{recordings}</span><span className="stat-label">הקלטות תודה</span></div>
        <div className="stat glass"><span className="stat-num">{(places ?? []).length}</span><span className="stat-label">מקומות במפה</span></div>
      </div>

      {dates.length === 0 && (
        <div className="empty glass">
          <p>הקפסולה מתמלאת מעצמה: כל תמונה, תודה והקלטה מהיומן יופיעו כאן, יום אחרי יום.</p>
        </div>
      )}

      {dates.map((d, i) => {
        const dayPhotos = photos.filter((p) => p.date === d).sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
        const dayEntries = entries.filter((e) => e.date === d);
        const sleep = (days ?? []).find((x) => x.id === d)?.lodging;
        return (
          <section key={d} className="cap-day">
            <header className="cap-head">
              <span className="cap-n">יום {i + 1}</span>
              <h2>{heDate(d)}</h2>
              {sleep && <span className="hint">ישנו ב{sleep}</span>}
            </header>
            {dayPhotos.length > 0 && (
              <div className="thumbs thumbs--cap">
                {dayPhotos.map((p) => <PhotoThumb key={p.id} id={p.id} thumb={p.thumb} caption={p.caption} />)}
              </div>
            )}
            {dayEntries.map((en) => (
              <article key={en.id} className="entry glass">
                <header className="entry-head">
                  <span className="person-face person-face--sm" style={face(en.by) ? { backgroundImage: `url("${face(en.by)}")` } : undefined}>{!face(en.by) && en.byName.slice(0, 1)}</span>
                  <strong>{en.byName}</strong>
                </header>
                {en.gratitude && <blockquote className="quote"><span className="label">מודה על</span>{en.gratitude}</blockquote>}
                {en.favorite && <p className="fav"><span className="label">הכי אהבנו</span>{en.favorite}</p>}
                {en.audioId && <AudioClip audioId={en.audioId} />}
              </article>
            ))}
          </section>
        );
      })}
    </div>
  );
}
