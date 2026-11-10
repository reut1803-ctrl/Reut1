"use client";

import { useEffect, useState } from "react";
import CuteAvatar from "./CuteAvatar";
import type { Look } from "@/lib/types";

export type ScenePhase = "idle" | "landing" | "arrived";
export type SceneAvatar = { photoUrl?: string | null; look: Look };

const SHIRTS = ["var(--blush)", "var(--sage)"];

function Cloud({ x, y, s, cls }: { x: number; y: number; s: number; cls: string }) {
  return (
    <g className={`cloud ${cls}`} transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx={0} cy={0} rx={46} ry={14} />
      <circle cx={-16} cy={-10} r={16} />
      <circle cx={10} cy={-15} r={21} />
      <circle cx={32} cy={-4} r={12} />
    </g>
  );
}

function Palm({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <g className="palm" transform={`translate(${x} ${y}) scale(${s})`}>
      <path className="palm-trunk" d="M0 0 Q4 -40 -2 -78" />
      <g transform="translate(-2 -78)">
        <path d="M0 0 Q-22 -12 -40 2 Q-20 -4 0 0Z" />
        <path d="M0 0 Q22 -14 42 0 Q20 -5 0 0Z" />
        <path d="M0 0 Q-12 -24 -30 -26 Q-12 -14 0 0Z" />
        <path d="M0 0 Q14 -26 32 -24 Q12 -14 0 0Z" />
        <path d="M0 0 Q2 -22 -4 -34 Q6 -18 0 0Z" />
      </g>
    </g>
  );
}

function Poppy({ x, y }: { x: number; y: number }) {
  return (
    <g className="poppy" transform={`translate(${x} ${y})`}>
      <line x1={0} y1={0} x2={0} y2={-9} />
      <circle cx={0} cy={-10} r={3.2} />
    </g>
  );
}

// כל הסצנה במערכת קואורדינטות אחת: המסלול בגובה 404, המטוס עוצר במרכז x=470.
// ה-viewBox ממסגר רק את "אזור הפעולה"; השמיים והקרקע מצוירים רחב יותר,
// כך שבטלפון (לאורך) רואים שמיים פתוחים מעל, ובמחשב (לרוחב) הכול ממלא את המסך.
const VIEW_WIDE = "130 100 560 400";
const VIEW_TALL = "280 250 380 250";

export default function Scene({ phase, avatars }: { phase: ScenePhase; avatars: SceneAvatar[] }) {
  // בטלפון (מסך עומד) מתקרבים לאזור המטוס, כדי שהדמויות לא ייראו זעירות.
  const [tall, setTall] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-aspect-ratio: 1/1)");
    const on = () => setTall(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  const people: SceneAvatar[] = [
    avatars[0] ?? { look: "hat" },
    avatars[1] ?? { look: "kippah" },
  ];
  const poppies: [number, number][] = [
    [140, 452], [182, 470], [228, 458], [470, 476], [520, 456], [568, 482], [612, 462],
    [660, 474], [96, 478], [705, 452], [430, 490], [270, 492],
  ];

  return (
    <svg
      className={`scene scene--${phase}`}
      viewBox={tall ? VIEW_TALL : VIEW_WIDE}
      preserveAspectRatio="xMidYMax meet"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: "var(--sky-top)" }} />
          <stop offset="1" style={{ stopColor: "var(--sky-bottom)" }} />
        </linearGradient>
        <radialGradient id="sunGlow">
          <stop offset="0" style={{ stopColor: "var(--peach)", stopOpacity: 0.85 }} />
          <stop offset="1" style={{ stopColor: "var(--peach)", stopOpacity: 0 }} />
        </radialGradient>
        <clipPath id="headClip">
          <circle cx={0} cy={-33} r={10.4} />
        </clipPath>
        <clipPath id="bodyClip">
          <path d="M-140 -84 L105 -84 C140 -84 165 -70 165 -52 C165 -36 145 -24 110 -24 L-125 -24 C-145 -24 -152 -40 -152 -54 C-152 -72 -150 -84 -140 -84 Z" />
        </clipPath>
      </defs>

      {/* שמיים ושמש */}
      <rect className="sky" x={-1400} y={-1600} width={3600} height={2040} />
      <circle cx={600} cy={150} r={120} fill="url(#sunGlow)" />
      <circle className="sun" cx={600} cy={150} r={44} />

      {/* עננים — חלקם גבוה מאוד, בשביל מסכי טלפון */}
      <g className="clouds">
        <Cloud x={180} y={150} s={1} cls="drift-a" />
        <Cloud x={470} y={210} s={0.7} cls="drift-b" />
        <Cloud x={690} y={120} s={0.85} cls="drift-c" />
        <Cloud x={300} y={-20} s={1.1} cls="drift-b" />
        <Cloud x={620} y={-150} s={0.9} cls="drift-a" />
        <Cloud x={220} y={-260} s={0.8} cls="drift-c" />
        <Cloud x={540} y={-420} s={1} cls="drift-b" />
      </g>

      {/* גבעות רחוקות עם גשר הזהב */}
      <path
        className="hills-far"
        d="M-1400 360 L-200 352 Q40 300 180 330 Q300 280 420 326 Q560 286 700 322 Q860 292 2200 340 L2200 420 L-1400 420 Z"
      />
      <g className="bridge" transform="translate(150 336)">
        <rect x={-2} y={-46} width={5} height={50} />
        <rect x={88} y={-46} width={5} height={50} />
        <rect x={-60} y={-2} width={210} height={3} />
        <path d="M-60 -2 Q-30 -36 0 -44 Q45 -6 90 -44 Q120 -36 150 -2" />
      </g>
      <path
        className="hills-near"
        d="M-1400 392 Q-300 370 60 384 Q200 352 340 380 Q480 360 620 378 Q760 356 2200 384 L2200 420 L-1400 420 Z"
      />

      {/* מגדל פיקוח */}
      <g className="tower" transform="translate(700 398)">
        <rect x={-6} y={-60} width={12} height={60} />
        <path d="M-17 -60 L17 -60 L13 -78 L-13 -78 Z" />
        <rect className="tower-glass" x={-11} y={-75} width={22} height={11} rx={2} />
        <text x={0} y={-30} className="tower-label">LAX</text>
      </g>
      <Palm x={110} y={398} s={0.8} />
      <Palm x={760} y={398} s={0.95} />
      <Palm x={790} y={398} s={0.7} />

      {/* מסלול נחיתה ודשא */}
      <rect className="runway" x={-1400} y={396} width={3600} height={42} />
      <line className="runway-line" x1={-1400} y1={417} x2={2200} y2={417} />
      <rect className="grass" x={-1400} y={436} width={3600} height={500} />
      {poppies.map(([x, y]) => (
        <Poppy key={`${x}-${y}`} x={x} y={y} />
      ))}

      {/* צל המטוס ואבק הנחיתה */}
      <ellipse className="plane-shadow anim" cx={480} cy={408} rx={150} ry={6} />
      <g className="puffs">
        <circle className="puff puff-1 anim" cx={222} cy={398} r={9} />
        <circle className="puff puff-2 anim" cx={236} cy={400} r={7} />
        <circle className="puff puff-3 anim" cx={208} cy={401} r={6} />
      </g>

      {/* המטוס */}
      <g transform="translate(470 404)">
        <g className="plane anim">
          <g className="stairs anim">
            <path className="stairs-side" d="M-108 -34 L-100 -34 L-160 0 L-172 0 Z" />
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const t = (i + 0.5) / 6;
              const x = -104 - 62 * t;
              const y = -34 + 34 * t;
              return <line key={i} className="stair" x1={x - 4} y1={y} x2={x + 10} y2={y} />;
            })}
            <line className="stairs-rail" x1={-112} y1={-50} x2={-174} y2={-14} />
          </g>
          <line className="gear" x1={-60} y1={-26} x2={-60} y2={-8} />
          <line className="gear" x1={100} y1={-26} x2={100} y2={-8} />
          <circle className="wheel" cx={-60} cy={-6.5} r={6.5} />
          <circle className="wheel" cx={100} cy={-6.5} r={6.5} />
          <path className="tail" d="M-138 -82 L-170 -142 L-140 -142 L-96 -84 Z" />
          <path className="tail-heart" d="M-147 -122 C-147 -127 -140 -127 -140 -122 C-140 -127 -133 -127 -133 -122 C-133 -117 -140 -113 -140 -111 C-140 -113 -147 -117 -147 -122 Z" />
          <path
            className="fuselage"
            d="M-140 -84 L105 -84 C140 -84 165 -70 165 -52 C165 -36 145 -24 110 -24 L-125 -24 C-145 -24 -152 -40 -152 -54 C-152 -72 -150 -84 -140 -84 Z"
          />
          <g clipPath="url(#bodyClip)">
            <rect className="stripe" x={-160} y={-46} width={340} height={7} />
            <rect className="belly" x={-160} y={-32} width={340} height={10} />
          </g>
          <ellipse className="stabilizer" cx={-132} cy={-62} rx={28} ry={5} />
          {[-62, -40, -18, 4, 26, 48, 70, 92].map((x) => (
            <circle key={x} className="window" cx={x} cy={-63} r={4.6} />
          ))}
          <path className="window" d="M128 -74 Q150 -72 157 -60 L134 -60 Q130 -66 128 -74 Z" />
          <rect className="door-gap" x={-106} y={-80} width={20} height={46} rx={5} />
          <rect className="door anim" x={-106} y={-80} width={20} height={46} rx={5} />
          <path className="wing" d="M40 -44 L-8 -44 L-66 -9 L-44 -9 Z" />
          <ellipse className="engine" cx={-2} cy={-30} rx={16} ry={7} />
        </g>
      </g>

      {/* הדמויות שלנו יורדות במדרגות */}
      {people.map((p, i) => (
        <g key={i} className={`walker walker-${i} anim`}>
          <g className="bob anim">
            <CuteAvatar index={i} photoUrl={p.photoUrl} look={p.look} shirt={SHIRTS[i]} />
          </g>
        </g>
      ))}
    </svg>
  );
}
