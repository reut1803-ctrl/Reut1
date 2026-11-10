"use client";

import { motion } from "framer-motion";

// לוגו בית שמצטייר מול העיניים
export default function HouseMark({ size = 72 }) {
  const draw = {
    hidden: { pathLength: 0, opacity: 0 },
    show: (i) => ({
      pathLength: 1,
      opacity: 1,
      transition: { pathLength: { delay: 0.3 + i * 0.35, duration: 1.2, ease: "easeInOut" }, opacity: { delay: 0.3 + i * 0.35, duration: 0.2 } },
    }),
  };
  return (
    <motion.svg width={size} height={size} viewBox="0 0 64 64" fill="none" initial="hidden" animate="show">
      <defs>
        <linearGradient id="hm" x1="0" y1="0" x2="64" y2="64">
          <stop offset="0%" stopColor="#C9A45C" />
          <stop offset="100%" stopColor="#7A2E3B" />
        </linearGradient>
      </defs>
      <motion.path d="M8 30 L32 10 L56 30" stroke="url(#hm)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" variants={draw} custom={0} />
      <motion.path d="M14 26 V54 H50 V26" stroke="url(#hm)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" variants={draw} custom={1} />
      <motion.path d="M32 46 C26 41 22 37.5 22 33.5 C22 30.5 24.5 28.5 27 28.5 C29 28.5 30.8 29.6 32 31.3 C33.2 29.6 35 28.5 37 28.5 C39.5 28.5 42 30.5 42 33.5 C42 37.5 38 41 32 46 Z" fill="url(#hm)" variants={draw} custom={2} />
    </motion.svg>
  );
}
