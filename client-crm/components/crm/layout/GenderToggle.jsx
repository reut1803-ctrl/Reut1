"use client";

import { useCrmStore } from "@/lib/crm/store";

export default function GenderToggle() {
  const board = useCrmStore((s) => s.board);
  const setBoard = useCrmStore((s) => s.setBoard);

  return (
    <div data-tour="tour-gender" className="mx-auto flex w-full max-w-xs rounded-2xl bg-[#FBF3EA] p-1">
      <button
        onClick={() => setBoard("female")}
        className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition ${
          board === "female" ? "bg-white text-[#C06E5E] shadow-sm" : "text-[#8C7B6B]"
        }`}
      >
        מאגר בנות
      </button>
      <button
        onClick={() => setBoard("male")}
        className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition ${
          board === "male" ? "bg-white text-[#C06E5E] shadow-sm" : "text-[#8C7B6B]"
        }`}
      >
        מאגר בנים
      </button>
    </div>
  );
}
