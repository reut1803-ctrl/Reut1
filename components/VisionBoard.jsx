// "לוח חזון" לעמוד השער — פריסה א-סימטרית (Masonry) של משבצות אווירה ומשפטי השראה.
// תשתית: כל משבצת "תמונה" יכולה לקבל src (קובץ ב-public/assets/vision/); בלי src
// מוצג רקע אווירה רך (נייר מעוינים / טקסטורה / שטיפת צבע) — כך הלוח נראה שלם כבר עכשיו.
const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";
const asset = (p) => `${BASE}/assets/${p}`;

const BACKDROPS = {
  harlequin: { backgroundImage: `url(${asset("harlequin-pink.jpg")})`, backgroundSize: "150px auto" },
  paper: { backgroundImage: `url(${asset("bg-texture.jpg")})`, backgroundSize: "cover" },
  blush: { background: "radial-gradient(120% 90% at 20% 15%, #FBEDEA 0%, #F2D9D5 55%, #E9C9C4 100%)" },
  sand: { background: "radial-gradient(120% 90% at 80% 20%, #FBF5EC 0%, #F1E5D3 60%, #E8D8C0 100%)" },
  wine: { background: "linear-gradient(155deg,#8a3344,#551828)" },
};

// סדר המשבצות = סדר הקריאה בעמודות. h = גובה המשבצת.
const VISION_ITEMS = [
  { type: "image", backdrop: "harlequin", h: "h-44", src: "" },
  { type: "quote", text: "כל בית נאמן מתחיל בשיחה אחת" },
  { type: "image", backdrop: "blush", h: "h-56", src: "", float: "בדיסקרטיות, בסבלנות ובאמונה" },
  { type: "quote", text: "לראות את האדם — לא רק את הפרטים", dark: true },
  { type: "image", backdrop: "paper", h: "h-36", src: "" },
  { type: "quote", text: "מאחורי כל הצעה עומד מישהו שאכפת לו" },
  { type: "image", backdrop: "sand", h: "h-48", src: "", float: "יחד, כקהילה אחת" },
  { type: "image", backdrop: "harlequin", h: "h-28", src: "" },
];

export default function VisionBoard() {
  return (
    <section className="mt-6">
      <div className="mb-5 text-center">
        <h2 className="text-2xl font-bold"><span className="title-skew">החזון שלנו</span></h2>
        <p className="mt-2 text-sm font-light text-ink/55">מה שמניע אותנו בכל שיחה ובכל הצעה</p>
      </div>

      <div className="columns-2 gap-3">
        {VISION_ITEMS.map((it, i) =>
          it.type === "quote" ? (
            <figure
              key={i}
              className={`mb-3 break-inside-avoid rounded-[22px] px-4 py-6 text-center shadow-[0_14px_30px_-16px_rgba(122,46,59,0.35)] ${it.dark ? "" : "border border-[#CBB089]/35 bg-[#FFFCF7]"}`}
              style={it.dark ? BACKDROPS.wine : undefined}
            >
              <span className={`block text-2xl leading-none ${it.dark ? "text-[#E6CF9F]" : "text-[#CBB089]"}`}>”</span>
              <blockquote className={`mt-1 text-[15px] font-semibold leading-relaxed ${it.dark ? "text-[#FBF3E6]" : "text-[#7a2e3b]"}`}>{it.text}</blockquote>
            </figure>
          ) : (
            <div key={i} className={`relative mb-3 break-inside-avoid overflow-hidden rounded-[22px] shadow-[0_14px_30px_-16px_rgba(122,46,59,0.35)] ${it.h}`}
              style={it.src ? undefined : BACKDROPS[it.backdrop]}>
              {it.src && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={asset(it.src)} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
              )}
              {it.float && (
                <span className="animate-float absolute inset-x-3 bottom-3 rounded-2xl bg-white/85 px-3 py-2 text-center text-[13px] font-semibold leading-snug text-[#7a2e3b] shadow-[0_8px_18px_-8px_rgba(122,46,59,0.45)] backdrop-blur-sm">
                  {it.float}
                </span>
              )}
            </div>
          )
        )}
      </div>
    </section>
  );
}
