"use client";

const VARIANTS = {
  pink: "bg-[#E8D9BE] text-[#331D07] hover:bg-[#C9A87A] active:scale-95",
  green: "bg-[#7FB33F] text-white shadow-[0_8px_20px_rgba(32,166,107,0.25)] hover:bg-[#5E9128] active:scale-95",
  greenOutline: "bg-white text-[#5E9128] border-2 border-[#7FB33F] hover:bg-[#7FB33F]/5 active:scale-95",
  primary: "bg-[#5B3418] text-white shadow-[0_8px_20px_rgba(140,74,85,0.25)] hover:bg-[#331D07] active:scale-95",
  ghost: "bg-white text-[#2E2116] border border-[#D9C6A5] hover:bg-[#F2E8D5] active:scale-95",
};

export default function Button({ variant = "primary", className = "", children, ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-2xl px-4 py-3 text-sm font-semibold transition disabled:opacity-40 disabled:active:scale-100 ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
