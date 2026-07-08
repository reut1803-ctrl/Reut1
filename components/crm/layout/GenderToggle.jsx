"use client";

import { useCrmStore } from "@/lib/crm/store";

export default function GenderToggle() {
  const board = useCrmStore((s) => s.board);
  const setBoard = useCrmStore((s) => s.setBoard);

  return (
    <div className="mx-auto flex w-full max-w-xs rounded-2xl bg-[#F6F5F4] p-1">
      <button
        onClick={() => setBoard("female")}
        className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition ${
          board === "female" ? "bg-white text-[#8C4A55] shadow-sm" : "text-[#8A8285]"
        }`}
      >
        מאגר בנות
      </button>
      <button
        onClick={() => setBoard("male")}
        className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition ${
          board === "male" ? "bg-white text-[#8C4A55] shadow-sm" : "text-[#8A8285]"
        }`}
      >
        מאגר בנים
      </button>
    </div>
  );
}
