import type { CSSProperties } from "react";

// ענן "צמר גפן": כמה אליפסות לבנות עם צל רך, בלי תמונות.
export default function Cloud({ style, speed = 0.3 }: { style?: CSSProperties; speed?: number }) {
  return <div className="cloud" data-speed={speed} style={style} aria-hidden="true" />;
}
