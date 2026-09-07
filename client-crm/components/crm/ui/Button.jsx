"use client";

const VARIANTS = {
  pink: "bg-[#DCEEF5] text-[#1F6E88] hover:bg-[#A8D8E8] active:scale-95",
  green: "bg-[#2FA39B] text-white shadow-[0_8px_20px_rgba(32,166,107,0.25)] hover:bg-[#21867F] active:scale-95",
  greenOutline: "bg-white text-[#21867F] border-2 border-[#2FA39B] hover:bg-[#2FA39B]/5 active:scale-95",
  primary: "bg-[#2E8BA8] text-white shadow-[0_8px_20px_rgba(140,74,85,0.25)] hover:bg-[#1F6E88] active:scale-95",
  ghost: "bg-white text-[#23414E] border border-[#CFE3EC] hover:bg-[#F2F8FB] active:scale-95",
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
