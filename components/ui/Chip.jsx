"use client";

import clsx from "clsx";

export default function Chip({ label, selected, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "rounded-2xl border px-4 py-2.5 text-sm font-medium transition active:scale-95",
        selected
          ? "border-bordeaux-500 bg-bordeaux-500 text-white shadow-soft"
          : "border-black/10 bg-white text-ink hover:border-pink-400",
        disabled && "opacity-40"
      )}
    >
      {label}
    </button>
  );
}
