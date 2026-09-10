"use client";

const VARIANTS = {
  pink: "bg-[#F6E4E6] text-[#6E3540] hover:bg-[#E9B9C0] active:scale-95",
  green: "bg-[#20A66B] text-white shadow-[0_8px_20px_rgba(32,166,107,0.25)] hover:bg-[#178A57] active:scale-95",
  greenOutline: "bg-white text-[#178A57] border-2 border-[#20A66B] hover:bg-[#20A66B]/5 active:scale-95",
  primary: "bg-[#8C4A55] text-white shadow-[0_8px_20px_rgba(140,74,85,0.25)] hover:bg-[#6E3540] active:scale-95",
  ghost: "bg-white text-[#3A3335] border border-[#EAE5E3] hover:bg-[#F6F5F4] active:scale-95",
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
