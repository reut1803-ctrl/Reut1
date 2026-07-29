"use client";

const VARIANTS = {
  pink: "bg-[#F0E2DE] text-[#5E2F2D] hover:bg-[#C08D88] active:scale-95",
  green: "bg-[#62826B] text-white shadow-[0_8px_20px_rgba(32,166,107,0.25)] hover:bg-[#4A6552] active:scale-95",
  greenOutline: "bg-white text-[#4A6552] border-2 border-[#62826B] hover:bg-[#62826B]/5 active:scale-95",
  primary: "bg-[#844442] text-white shadow-[0_8px_20px_rgba(140,74,85,0.25)] hover:bg-[#5E2F2D] active:scale-95",
  ghost: "bg-white text-[#3A2E26] border border-[#CCBDAB] hover:bg-[#E8DCCB] active:scale-95",
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
