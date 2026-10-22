"use client";

import { useState } from "react";
import { RotateCw } from "lucide-react";
import { useData } from "../lib/useData";
import { DEFAULT_VISION_BOARD } from "../lib/store";

// "לוח חזון" לעמוד השער — פריסה א-סימטרית של כרטיסים מתהפכים (3D Flip).
// כל הטקסטים (כותרת, ולכל כרטיס: חזית + גב) נשלפים בזמן אמת מלוח הבקרה
// (meta/config.visionBoard), עם נפילה חלקה לברירת המחדל.
// הפריסה בשתי עמודות מפורשות (ולא CSS columns) — כי היפוך תלת-ממדי בתוך
// columns מתנהג לא יציב בחלק מדפדפני המובייל.
const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";
const asset = (p) => `${BASE}/assets/${p}`;

const BACKDROPS = {
  harlequin: { backgroundImage: `url(${asset("harlequin-pink.jpg")})`, backgroundSize: "150px auto" },
  paper: { backgroundImage: `url(${asset("bg-texture.jpg")})`, backgroundSize: "cover" },
  blush: { background: "radial-gradient(120% 90% at 20% 15%, #FBEDEA 0%, #F2D9D5 55%, #E9C9C4 100%)" },
  sand: { background: "radial-gradient(120% 90% at 80% 20%, #FBF5EC 0%, #F1E5D3 60%, #E8D8C0 100%)" },
  wine: { background: "linear-gradient(155deg,#8a3344,#551828)" },
  cream: { background: "#FFFCF7" },
};
const SIZES = { s: "h-36", m: "h-48", l: "h-60" };
const SHADOW = "shadow-[0_14px_30px_-16px_rgba(122,46,59,0.38)]";

function VisionCard({ item }) {
  const [flipped, setFlipped] = useState(false);
  const style = BACKDROPS[item.style] ? item.style : "cream";
  const isQuote = style === "cream" || style === "wine";
  const dark = style === "wine";
  const front = (item.front || "").trim();
  const back = (item.back || "").trim();

  return (
    <div className={`${SIZES[item.size] || SIZES.m} [perspective:1100px]`}>
      <button
        type="button"
        onClick={() => back && setFlipped((f) => !f)}
        aria-pressed={flipped}
        aria-label={back ? (flipped ? "חזרה לחזית הכרטיס" : "היפוך הכרטיס") : undefined}
        className={`flip-3d relative block h-full w-full text-center ${flipped ? "flipped" : ""} ${back ? "cursor-pointer" : "cursor-default"}`}
      >
        {/* חזית */}
        <span
          className={`flip-face absolute inset-0 overflow-hidden rounded-[22px] ${SHADOW} ${style === "cream" ? "border border-[#CBB089]/35" : ""}`}
          style={BACKDROPS[style]}
        >
          {isQuote && front && (
            <span className="flex h-full flex-col items-center justify-center px-4">
              <span className={`text-2xl leading-none ${dark ? "text-[#E6CF9F]" : "text-[#CBB089]"}`}>”</span>
              <span className={`mt-1 text-[15px] font-semibold leading-relaxed ${dark ? "text-[#FBF3E6]" : "text-[#7a2e3b]"}`}>{front}</span>
            </span>
          )}
          {!isQuote && front && (
            <span className="animate-float absolute inset-x-3 bottom-3 rounded-2xl bg-white/85 px-3 py-2 text-[13px] font-semibold leading-snug text-[#7a2e3b] shadow-[0_8px_18px_-8px_rgba(122,46,59,0.45)] backdrop-blur-sm">
              {front}
            </span>
          )}
          {back && (
            <span className={`absolute left-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full ${dark ? "bg-white/15 text-[#E6CF9F]" : "bg-white/70 text-[#7a2e3b]/70"}`}>
              <RotateCw className="h-3.5 w-3.5" strokeWidth={2} />
            </span>
          )}
        </span>

        {/* גב */}
        <span className={`flip-face flip-back absolute inset-0 flex flex-col items-center justify-center rounded-[22px] bg-[#FFFBF6] px-4 ring-1 ring-[#CBB089]/45 ${SHADOW}`}>
          <span className="text-sm text-[#CBB089]">✦</span>
          <span className="mt-1.5 text-[13.5px] font-medium leading-relaxed text-[#7a2e3b]">{back}</span>
        </span>
      </button>
    </div>
  );
}

export default function VisionBoard() {
  const data = useData();
  const board = (data && data.visionBoard) || DEFAULT_VISION_BOARD;
  const items = (board.items || []).filter((it) => (it.front || "").trim() || (it.back || "").trim() || !["cream", "wine"].includes(it.style));
  // חלוקה לשתי עמודות לסירוגין — יוצר את המראה הא-סימטרי
  const cols = [items.filter((_, i) => i % 2 === 0), items.filter((_, i) => i % 2 === 1)];

  return (
    <section className="mt-6">
      <div className="mb-5 text-center">
        <h2 className="text-2xl font-bold"><span className="title-skew">{board.title || DEFAULT_VISION_BOARD.title}</span></h2>
        {board.subtitle && <p className="mt-2 text-sm font-light text-ink/55">{board.subtitle}</p>}
        <p className="mt-1 text-[11px] text-ink/40">לחצו על כרטיס כדי להפוך אותו</p>
      </div>
      <div className="flex gap-3">
        {cols.map((col, c) => (
          <div key={c} className={`flex flex-1 flex-col gap-3 ${c === 1 ? "pt-8" : ""}`}>
            {col.map((it) => <VisionCard key={it.id} item={it} />)}
          </div>
        ))}
      </div>
    </section>
  );
}
