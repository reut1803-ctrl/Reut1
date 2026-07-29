"use client";

import { useCrmStore } from "@/lib/crm/store";

export default function GenderToggle() {
  const board = useCrmStore((s) => s.board);
  const setBoard = useCrmStore((s) => s.setBoard);

  return (
    <div data-tour="tour-gender" className="mx-auto flex w-full max-w-xs rounded-2xl bg-[#F2E8D5] p-1">
      <button
        onClick={() => setBoard("female")}
        className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition ${
          board === "female" ? "bg-white text-[#5B3418] shadow-sm" : "text-[#7A6A55]"
        }`}
      >
        מאגר בנות
      </button>
      <button
        onClick={() => setBoard("male")}
        className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition ${
          board === "male" ? "bg-white text-[#5B3418] shadow-sm" : "text-[#7A6A55]"
        }`}
      >
        מאגר בנים
      </button>
    </div>
  );
}
