"use client";

const VARIANTS = {
  pink: "bg-[#F7DFD8] text-[#A05243] hover:bg-[#F1B3A6] active:scale-95",
  green: "bg-[#8C9A78] text-white shadow-[0_8px_20px_rgba(32,166,107,0.25)] hover:bg-[#6F7D5C] active:scale-95",
  greenOutline: "bg-white text-[#6F7D5C] border-2 border-[#8C9A78] hover:bg-[#8C9A78]/5 active:scale-95",
  primary: "bg-[#C06E5E] text-white shadow-[0_8px_20px_rgba(140,74,85,0.25)] hover:bg-[#A05243] active:scale-95",
  ghost: "bg-white text-[#5A4A3C] border border-[#EADCCB] hover:bg-[#FBF3EA] active:scale-95",
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
