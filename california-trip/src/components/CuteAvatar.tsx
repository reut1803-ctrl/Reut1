import type { Look } from "@/lib/types";

type Props = {
  photoUrl?: string | null;
  look: Look;
  shirt: string;
  index: number;
};

// דמות קטנה שהרגליים שלה נוגעות בנקודה (0,0).
// אם יש תמונת פנים — היא נכנסת לעיגול הראש, והכובע/הכיפה יושבים מעליה.
export default function CuteAvatar({ photoUrl, look, shirt, index }: Props) {
  const cls = ["avatar", `look-${look}`, photoUrl ? "has-photo" : ""].join(" ").trim();
  return (
    <g className={cls} data-avatar={index}>
      <line className="leg leg-l anim" x1={-3.6} y1={-12} x2={-3.6} y2={-0.5} />
      <line className="leg leg-r anim" x1={3.6} y1={-12} x2={3.6} y2={-0.5} />
      <path className="shirt" d="M-10 -10 Q-11.5 -24.5 0 -25.5 Q11.5 -24.5 10 -10 Z" style={{ fill: shirt }} />
      <line className="arm" x1={-8.5} y1={-21} x2={-13} y2={-12.5} />
      <g className="arm-wave anim">
        <line className="arm" x1={8.5} y1={-21} x2={13} y2={-12.5} />
      </g>
      <circle className="neck-skin" cx={0} cy={-33} r={10.4} />
      <g className="face">
        <path className="beard" d="M-9.2 -32 Q-8 -20.5 0 -20.2 Q8 -20.5 9.2 -32 Q5 -26.5 0 -26.8 Q-5 -26.5 -9.2 -32 Z" />
        <circle className="eye" cx={-3.6} cy={-34} r={1.25} />
        <circle className="eye" cx={3.6} cy={-34} r={1.25} />
        <circle className="cheek" cx={-6} cy={-30.6} r={2} />
        <circle className="cheek" cx={6} cy={-30.6} r={2} />
        <path className="smile" d="M-2.6 -30.2 Q0 -27.8 2.6 -30.2" />
      </g>
      <image
        className="avatar-photo"
        href={photoUrl ?? ""}
        x={-10.4}
        y={-43.4}
        width={20.8}
        height={20.8}
        clipPath="url(#headClip)"
        preserveAspectRatio="xMidYMid slice"
      />
      <circle className="head-ring" cx={0} cy={-33} r={10.4} />
      <g className="acc-hat">
        <path d="M-8.6 -40.4 Q-8 -50 0 -50.2 Q8 -50 8.6 -40.4 Z" />
        <rect className="hat-band" x={-8.4} y={-42.6} width={16.8} height={2.4} rx={1} />
        <ellipse cx={0} cy={-40.6} rx={15.5} ry={3.2} />
      </g>
      <path className="acc-kippah" d="M-6.4 -42.2 Q0 -47.6 6.4 -42.2 Q0 -43.8 -6.4 -42.2 Z" />
    </g>
  );
}
