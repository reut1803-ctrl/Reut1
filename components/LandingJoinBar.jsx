"use client";

import { useState } from "react";
import Link from "next/link";
import Modal from "./Modal";
import PersonIcon from "./PersonIcon";

// סרגל הצטרפות דביק בתחתית עמוד השער. במרכזו כפתור אליפטי בולט שחוצה את
// הגבול העליון של הסרגל (חצי בפנים, חצי בחוץ). לחיצה פותחת בחירת מסלול.
export default function LandingJoinBar() {
  const [choose, setChoose] = useState(false);

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-50 h-[calc(3.6rem+env(safe-area-inset-bottom))] border-t border-sand bg-cream/95 backdrop-blur">
        <div className="absolute inset-x-0 top-0 flex -translate-y-1/2 justify-center">
          <button
            type="button"
            onClick={() => setChoose(true)}
            className="rounded-full px-10 py-3 text-center ring-[5px] ring-cream transition active:scale-[0.98] shadow-[0_16px_30px_-8px_rgba(70,18,30,0.7),0_4px_10px_rgba(70,18,30,0.22)]"
            style={{ background: "linear-gradient(155deg,#8a3344,#551828)" }}
          >
            <span className="block text-lg font-bold leading-tight text-[#FBF3E6]">להצטרפות למאגר</span>
            <span className="mt-0.5 block text-[11px] font-medium tracking-[0.25em] text-[#E6CF9F]">הקהילה איתך</span>
          </button>
        </div>
      </div>

      {choose && (
        <Modal title="להצטרפות למאגר" onClose={() => setChoose(false)}>
          <p className="mb-4 text-sm text-ink/60">בחרו את המסלול שלכם:</p>
          <div className="grid grid-cols-2 gap-4 pb-1">
            {[["/form/male", "בחור"], ["/form/female", "בחורה"]].map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className="group flex flex-col items-center gap-2.5 rounded-[26px] border border-rose/15 bg-white/70 py-7 shadow-[0_8px_24px_rgba(167,79,79,0.08)] transition hover:border-rose/30 hover:bg-blush/40 active:scale-[0.99]"
              >
                <PersonIcon className="h-11 w-11 text-rose/80 transition-colors group-hover:text-rose" />
                <span className="text-lg font-light tracking-wide text-[#6E4B4B]">{label}</span>
              </Link>
            ))}
          </div>
        </Modal>
      )}
    </>
  );
}
