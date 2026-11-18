// ציורי הדגלים עצמם. כל דגל מצויר פעם אחת כ-<symbol>, והדגל המתנופף "חותך" אותו לרצועות.

function starPath(cx: number, cy: number, r: number) {
  let d = "";
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.4;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    d += `${i === 0 ? "M" : "L"}${(cx + rad * Math.cos(a)).toFixed(2)} ${(cy + rad * Math.sin(a)).toFixed(2)}`;
  }
  return d + "Z";
}

// 50 כוכבים: 9 שורות, לסירוגין 6 ו-5, כמו בדגל האמיתי.
const STARS = (() => {
  const cw = 76;
  const ch = 53.85;
  let d = "";
  for (let r = 0; r < 9; r++) {
    const y = (ch / 10) * (r + 1);
    const count = r % 2 === 0 ? 6 : 5;
    for (let c = 0; c < count; c++) {
      const x = (cw / 12) * (r % 2 === 0 ? 2 * c + 1 : 2 * c + 2);
      d += starPath(x, y, 2.3);
    }
  }
  return d;
})();

export const US_FLAG = { id: "art-usa", w: 190, h: 100 };
export const MOSHIACH_FLAG = { id: "art-moshiach", w: 150, h: 100 };

export function FlagSymbols() {
  const stripe = 100 / 13;
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <defs>
        <symbol id={US_FLAG.id} viewBox="0 0 190 100">
          <rect width="190" height="100" fill="#fff" />
          {Array.from({ length: 7 }, (_, i) => (
            <rect key={i} y={i * 2 * stripe} width="190" height={stripe} fill="#B22234" />
          ))}
          <rect width="76" height="53.85" fill="#3C3B6E" />
          <path d={STARS} fill="#fff" />
        </symbol>
        <symbol id={MOSHIACH_FLAG.id} viewBox="0 0 150 100">
          <rect width="150" height="100" fill="#FFD21F" />
          <g transform="translate(75 38)" fill="#4B2A7B">
            <path d="M-30 12 L-34 -16 L-18 -2 L-8 -24 L0 -6 L8 -24 L18 -2 L34 -16 L30 12 Z" />
            <rect x="-31" y="13" width="62" height="7" rx="2" />
            <circle cx="-34" cy="-18" r="3.6" />
            <circle cx="-8" cy="-26" r="3.6" />
            <circle cx="8" cy="-26" r="3.6" />
            <circle cx="34" cy="-18" r="3.6" />
            <circle cx="0" cy="-9" r="3" fill="#FFD21F" />
            <circle cx="-17" cy="4" r="2.4" fill="#FFD21F" />
            <circle cx="17" cy="4" r="2.4" fill="#FFD21F" />
          </g>
          <text
            x="75"
            y="86"
            textAnchor="middle"
            fill="#C8102E"
            style={{ font: "800 27px 'Noto Sans Hebrew', 'Heebo', sans-serif" }}
          >
            משיח
          </text>
        </symbol>
      </defs>
    </svg>
  );
}
