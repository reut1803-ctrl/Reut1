"use client";

const VARIANTS = {
  pink: "bg-[#F3E7D5] text-[#4E3220] hover:bg-[#E0C79C] active:scale-95",
  green: "bg-[#7FB33F] text-white shadow-[0_8px_20px_rgba(32,166,107,0.25)] hover:bg-[#5E9128] active:scale-95",
  greenOutline: "bg-white text-[#5E9128] border-2 border-[#7FB33F] hover:bg-[#7FB33F]/5 active:scale-95",
  primary: "bg-[#6F4A2E] text-white shadow-[0_8px_20px_rgba(140,74,85,0.25)] hover:bg-[#4E3220] active:scale-95",
  ghost: "bg-white text-[#3B332A] border border-[#E7DECD] hover:bg-[#FAF6EE] active:scale-95",
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
