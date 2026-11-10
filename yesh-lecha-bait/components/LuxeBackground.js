"use client";

import { motion } from "framer-motion";

// רקע יוקרתי: כתמי צבע מים רכים שנעים לאט + גרעיניות עדינה
export default function LuxeBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-cream">
      <div className="absolute -top-40 -right-32 h-[36rem] w-[36rem] rounded-full bg-rose/30 blur-3xl animate-float" />
      <div className="absolute top-1/3 -left-40 h-[32rem] w-[32rem] rounded-full bg-gold-light/60 blur-3xl animate-float-slow" />
      <div className="absolute -bottom-48 right-1/4 h-[30rem] w-[30rem] rounded-full bg-bordeaux/20 blur-3xl animate-float" />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.35 }}
        transition={{ duration: 2 }}
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(rgba(122,46,59,0.08) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />
    </div>
  );
}
