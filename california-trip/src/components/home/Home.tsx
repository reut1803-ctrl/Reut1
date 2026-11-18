"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useAuth } from "@/lib/auth";
import type { TripApi } from "@/lib/trip";
import AnalogClocks from "../AnalogClocks";
import AppNav from "../app/AppNav";
import TabBar from "../app/TabBar";
import Reminders from "../app/Reminders";
import Icon, { type IconName } from "../app/Icon";
import { useBatteryNight } from "@/lib/battery";
import Cloud from "./Cloud";
import OrigamiPlane, { PlaneShape } from "./OrigamiPlane";
import WavingFlag from "./WavingFlag";
import { FlagSymbols, MOSHIACH_FLAG, US_FLAG } from "./flags";

const FEATURES = [
  { href: "/map", icon: "map", title: "מפת קליפורניה", text: "אזורי הטיול, אטרקציות לפי התאריכים שלנו, בתי חב״ד, אוכל כשר וזמני הדלקת נרות." },
  { href: "/plan", icon: "route", title: "מסלול וזמנים", text: "שעון קליפורניה, ניווט ב-Waze בלחיצה, הזזה והשהיה של חוויות, ותזכורות בזמן." },
  { href: "/packing", icon: "bag", title: "ציוד חכם", text: "איפה ישנים היום ומה לארוז, עם רשימה שמסמנים בה ומקבלים אנימציה של הצלחה." },
  { href: "/journal", icon: "heart", title: "יומן הודיה", text: "על מה הודינו אחד לשני היום, בכתב או בהקלטה, ותמונות שננעצות על המפה." },
  { href: "/budget", icon: "cup", title: "מד תקציב", text: "כוס קפה שמתרוקנת ככל שמתקרבים לתקציב היומי. רואים בשנייה כמה נשאר." },
  { href: "/capsule", icon: "capsule", title: "קפסולת זמן", text: "בסוף הטיול: כל התמונות, ההקלטות והמקומות באלבום אחד נגלל." },
];


export default function Home({ trip, onReplay }: { trip: TripApi; onReplay: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const { user, signOut } = useAuth();
  const night = useBatteryNight();

  useEffect(() => {
    const scope = root.current;
    if (!scope) return;
    const mm = gsap.matchMedia();

    mm.add(
      {
        motion: "(prefers-reduced-motion: no-preference)",
        narrow: "(max-width: 700px)",
      },
      (ctx) => {
        const { motion, narrow } = ctx.conditions as { motion: boolean; narrow: boolean };
        if (!motion) return;
        const q = gsap.utils.selector(scope);

        // ---- פתיחה: הטקסט נחשף, המטוסים נכנסים ומרחפים ----
        gsap.from(q(".hero-reveal"), {
          y: 34, opacity: 0, filter: "blur(12px)", duration: 1.2, ease: "expo.out", stagger: 0.11, delay: 0.15,
        });
        gsap.from(q(".hero-plane--yellow"), { x: "45vw", y: "18vh", rotate: 18, duration: 2, ease: "expo.out" });
        gsap.from(q(".hero-plane--mint"), { x: "-40vw", y: "26vh", rotate: -14, duration: 2.3, ease: "expo.out", delay: 0.15 });
        q(".hero-float").forEach((el: Element, i: number) => {
          gsap.to(el, { y: i % 2 ? 12 : -16, rotate: i % 2 ? -2.5 : 3, duration: 3.2 + i * 0.6, ease: "sine.inOut", yoyo: true, repeat: -1 });
        });

        // ---- גלילה בפתיחה: הכותרת נסוגה, המטוסים ממריאים, העננים בשכבות עומק ----
        const heroST = { trigger: q(".hero")[0], start: "top top", end: "bottom top", scrub: 1 };
        gsap.to(q(".hero-copy"), { yPercent: -28, scale: 0.94, opacity: 0, ease: "none", scrollTrigger: heroST });
        gsap.to(q(".hero-plane--yellow"), { x: narrow ? "-70vw" : "-55vw", y: "-46vh", rotate: -16, ease: "none", scrollTrigger: heroST });
        gsap.to(q(".hero-plane--mint"), { x: "38vw", y: "-30vh", rotate: 10, ease: "none", scrollTrigger: heroST });
        q(".hero .cloud").forEach((el: Element) => {
          const speed = Number((el as HTMLElement).dataset.speed ?? 0.3);
          gsap.to(el, { yPercent: -120 * speed, ease: "none", scrollTrigger: heroST });
        });

        // ---- כותרות סעיפים נחשפות ----
        q(".reveal").forEach((el: Element) => {
          gsap.from(el, {
            y: 48, opacity: 0, filter: "blur(10px)", duration: 1.1, ease: "expo.out",
            scrollTrigger: { trigger: el, start: "top 88%" },
          });
        });

        // ---- הדגלים עולים על התורנים תוך כדי גלילה ----
        q(".pole-rig").forEach((rig: Element) => {
          const mount = rig.querySelector(".flag-mount") as HTMLElement;
          const pole = rig.querySelector(".pole") as HTMLElement;
          gsap.fromTo(
            mount,
            { y: () => pole.clientHeight - mount.clientHeight - 18 },
            {
              y: 0, ease: "power1.out",
              scrollTrigger: { trigger: rig, start: "top 92%", end: "center 42%", scrub: 1.2, invalidateOnRefresh: true },
            },
          );
        });

        // ---- המסע: הסעיף ננעץ, הקו נמתח והמטוס עף מתל אביב ללוס אנג׳לס ----
        const path = scope.querySelector(".journey-path") as SVGPathElement;
        const len = path.getTotalLength();
        gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
        const km = { v: 0 };
        const kmEl = q(".stat-km")[0] as HTMLElement;
        const tl = gsap.timeline({
          scrollTrigger: { trigger: q(".journey")[0], start: "top top", end: narrow ? "+=110%" : "+=150%", pin: true, scrub: 1 },
        });
        tl.to(path, { strokeDashoffset: 0, ease: "none", duration: 1 }, 0)
          .to(q(".journey-plane")[0], {
            ease: "none", duration: 1,
            motionPath: { path, align: path, alignOrigin: [0.5, 0.5], autoRotate: true },
          }, 0)
          .to(km, {
            v: 12200, duration: 0.85, ease: "none",
            onUpdate: () => { kmEl.textContent = (Math.round(km.v / 100) * 100).toLocaleString("he-IL"); },
          }, 0.1)
          .from(q(".journey-end"), { opacity: 0, scale: 0.6, duration: 0.15 }, 0.85);

        // ---- כרטיסי הזכוכית צפים פנימה ----
        ScrollTrigger.batch(q(".feature"), {
          start: "top 90%",
          onEnter: (els) =>
            gsap.fromTo(els,
              { y: 70, opacity: 0, rotateX: 12, filter: "blur(8px)" },
              { y: 0, opacity: 1, rotateX: 0, filter: "blur(0px)", duration: 1.1, ease: "expo.out", stagger: 0.09, overwrite: true }),
        });
        gsap.to(q(".blob"), {
          yPercent: (i: number) => (i % 2 ? -35 : 25), xPercent: (i: number) => (i % 2 ? 12 : -10), ease: "none",
          scrollTrigger: { trigger: q(".features")[0], start: "top bottom", end: "bottom top", scrub: 1.5 },
        });

        // ---- סיום: מטוסים חוצים את המסך ----
        gsap.fromTo(q(".finale-plane--a"), { x: "30vw", y: 60, rotate: -6 }, {
          x: "-40vw", y: -40, rotate: -14, ease: "none",
          scrollTrigger: { trigger: q(".finale")[0], start: "top bottom", end: "bottom top", scrub: 1 },
        });
        gsap.fromTo(q(".finale-plane--b"), { x: "-30vw", y: -20 }, {
          x: "35vw", y: 50, ease: "none",
          scrollTrigger: { trigger: q(".finale")[0], start: "top bottom", end: "bottom top", scrub: 1.4 },
        });
      },
      scope,
    );

    // הפונטים משנים מידות; מרעננים את הטריגרים כשהם נטענו.
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    return () => mm.revert();
  }, []);

  const firstName = user?.name ?? "";
  const names = trip.members.map((m) => m.name).filter(Boolean);
  const couple = names.length >= 2 ? `${names[0]} ו${names[1]}` : firstName;

  return (
    <div className="home" ref={root}>
      <FlagSymbols />

      <AppNav night={night} />

      {/* ---------- פתיחה ---------- */}
      <section className="hero" id="top">
        <Cloud speed={0.5} style={{ width: "34vw", top: "16%", insetInlineStart: "-6vw" }} />
        <Cloud speed={0.25} style={{ width: "22vw", top: "8%", insetInlineEnd: "6vw" }} />
        <Cloud speed={0.8} style={{ width: "40vw", bottom: "6%", insetInlineEnd: "-10vw" }} />
        <Cloud speed={0.4} style={{ width: "18vw", bottom: "22%", insetInlineStart: "18vw" }} />

        <div className="hero-plane hero-plane--yellow"><div className="hero-float"><OrigamiPlane tone="yellow" /></div></div>
        <div className="hero-plane hero-plane--mint"><div className="hero-float"><OrigamiPlane tone="mint" /></div></div>

        <div className="hero-copy">
          <p className="eyebrow-home hero-reveal">{couple ? `${couple} יוצאים לדרך` : "יוצאים לדרך"}</p>
          <h1 className="hero-title hero-reveal">קליפורניה<span className="dot">.</span></h1>
          <p className="lede hero-reveal">המסלול, המפה, הציוד והזיכרונות. הכול במקום אחד, ביד.</p>
          <div className="hero-reveal hero-pill glass">
            <span className="pill-dot" /> כאן נבנה הטיול שלנו
          </div>
        </div>
        <div className="scroll-cue" aria-hidden="true"><span /></div>
      </section>

      {/* ---------- שני דגלים ---------- */}
      <section className="flags section">
        <div className="section-head reveal">
          <p className="eyebrow-home">הדגלים שלנו</p>
          <h2 className="section-title">שני דגלים.<br />מסע אחד.</h2>
          <p className="lede">
            הכוכבים והפסים של אמריקה, ולצידם הדגל הצהוב עם הכתר. לכל מקום שנגיע בקליפורניה, נביא איתנו את בשורת הגאולה.
          </p>
        </div>
        <div className="flag-stage">
          <div className="pole-rig" style={{ ["--ratio" as string]: US_FLAG.w / US_FLAG.h }}>
            <div className="pole"><span className="pole-cap" /></div>
            <div className="flag-mount"><WavingFlag art={US_FLAG} label="דגל ארצות הברית" /></div>
            <p className="flag-caption">ארצות הברית</p>
          </div>
          <div className="pole-rig" style={{ ["--ratio" as string]: MOSHIACH_FLAG.w / MOSHIACH_FLAG.h }}>
            <div className="pole"><span className="pole-cap" /></div>
            <div className="flag-mount"><WavingFlag art={MOSHIACH_FLAG} label="דגל משיח" phase={1.3} /></div>
            <p className="flag-caption">משיח</p>
          </div>
        </div>
      </section>

      {/* ---------- המסע ---------- */}
      <section className="journey">
        <div className="journey-inner">
          <div className="section-head">
            <p className="eyebrow-home">הדרך</p>
            <h2 className="section-title">מנתב״ג ל-LAX.</h2>
          </div>
          <div className="journey-map">
            <span className="journey-label journey-label--from">תל אביב<small>TLV</small></span>
            <span className="journey-label journey-label--to">לוס אנג׳לס<small>LAX</small></span>
            <svg className="journey-svg" viewBox="0 0 1000 360" aria-hidden="true">
              <path className="journey-ghost" d="M70 290 C 300 10, 700 10, 930 290" />
              <path className="journey-path" d="M70 290 C 300 10, 700 10, 930 290" />
              <circle className="journey-dot" cx="70" cy="290" r="9" />
              <circle className="journey-dot journey-end" cx="930" cy="290" r="9" />
              <g className="journey-plane">
                <g transform="scale(0.42)"><PlaneShape tone="yellow" /></g>
              </g>
            </svg>
          </div>
          <div className="stats">
            <div className="stat glass"><span className="stat-num"><span className="stat-km">12,200</span></span><span className="stat-label">ק״מ, בערך, באוויר</span></div>
            <div className="stat glass"><span className="stat-num">10</span><span className="stat-label">שעות הפרש בשעון</span></div>
            <div className="stat glass"><span className="stat-num">15</span><span className="stat-label">שעות טיסה ישירה, בערך</span></div>
          </div>
        </div>
      </section>

      {/* ---------- מה בונים ---------- */}
      <section className="features section">
        <div className="blob blob--yellow" aria-hidden="true" />
        <div className="blob blob--mint" aria-hidden="true" />
        <div className="blob blob--sky" aria-hidden="true" />
        <div className="blob blob--lilac" aria-hidden="true" />
        <div className="section-head reveal">
          <p className="eyebrow-home">הכלים שלנו</p>
          <h2 className="section-title">כל הטיול.<br />במקום אחד.</h2>
          <p className="lede">כל חלק נפתח בלחיצה. מה שאחד מוסיף, השני רואה מיד.</p>
        </div>
        <div className="feature-grid">
          {FEATURES.map((f) => (
            <Link className="feature glass" key={f.title} href={f.href}>
              <div className="feature-top">
                <span className="feature-badge"><Icon name={f.icon as IconName} className="feature-icon" /></span>
                <span className="feature-go" aria-hidden="true">←</span>
              </div>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------- סיום ---------- */}
      <section className="finale section">
        <div className="finale-plane finale-plane--a"><OrigamiPlane tone="mint" /></div>
        <div className="finale-plane finale-plane--b"><OrigamiPlane tone="yellow" /></div>
        <div className="section-head reveal">
          <h2 className="section-title">נתראה<br />בקליפורניה.</h2>
        </div>
        <div className="finale-clocks reveal glass"><AnalogClocks /></div>
        <div className="finale-actions reveal">
          <button type="button" className="pill-btn pill-btn--dark" onClick={onReplay}>לראות שוב את הנחיתה</button>
          <button type="button" className="pill-btn" onClick={signOut}>יציאה</button>
        </div>
        <p className="footer-note">נבנה באהבה, לרעות ולזכריה.</p>
      </section>
      <Reminders />
      <TabBar />
    </div>
  );
}
