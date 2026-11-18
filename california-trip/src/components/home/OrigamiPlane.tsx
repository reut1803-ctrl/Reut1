export type PaperTone = "yellow" | "mint" | "white";

// מטוס נייר מקופל: ארבעה משטחים בגוונים שונים, כמו נייר אוריגמי מואר מלמעלה.
// החרטום מצביע ימינה (כיוון x חיובי), כדי ש-MotionPath יסובב אותו נכון.
export function PlaneShape({ tone }: { tone: PaperTone }) {
  return (
    <g className={`origami origami--${tone}`}>
      <polygon className="f1" points="236,56 34,6 116,62" />
      <polygon className="f2" points="236,56 8,58 116,62" />
      <polygon className="f3" points="236,56 116,62 124,108" />
      <polygon className="f4" points="116,62 98,76 124,108" />
      <line className="crease" x1="236" y1="56" x2="116" y2="62" />
    </g>
  );
}

export default function OrigamiPlane({
  tone,
  className = "",
}: {
  tone: PaperTone;
  className?: string;
}) {
  return (
    <svg className={`origami-svg ${className}`} viewBox="0 0 240 114" aria-hidden="true">
      <PlaneShape tone={tone} />
    </svg>
  );
}
