"use client";

import { useState } from "react";
import { ClipboardPaste, Wand2, ChevronDown } from "lucide-react";
import { parseCandidateText } from "@/lib/crm/parseCandidateText";

// הדבקת טקסט חופשי (למשל הודעת וואטסאפ) ומילוי אוטומטי של השדות שזוהו.
// מה שלא זוהה פשוט לא נוגע בשדה, ונשאר למילוי ידני.
export default function SmartPastePanel({ onApply }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);

  const handlePasteFromClipboard = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) setText(clip);
    } catch {
      // דפדפנים מסוימים חוסמים קריאה מהלוח - במקרה כזה פשוט מדביקים ידנית בתיבה
    }
  };

  const handleApply = () => {
    const parsed = parseCandidateText(text);
    const count = Object.keys(parsed.fields).length + (parsed.traits.length > 0 ? 1 : 0);
    onApply(parsed);
    setResult(count);
  };

  return (
    <div className="mt-4 rounded-2xl border border-[#EAE5E3] bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-right"
      >
        <span className="flex items-center gap-2 text-[13px] font-bold text-[#8C4A55]">
          <Wand2 size={16} /> מילוי מהיר מטקסט
        </span>
        <ChevronDown size={18} className={`text-[#8C4A55] transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="border-t border-[#EAE5E3] p-4">
          <p className="mb-2 text-[11px] leading-relaxed text-[#8A8285]">
            הדביקו כאן טקסט חופשי (למשל הודעה שקיבלתם בוואטסאפ) והמערכת תפזר לבד את מה שהיא מזהה לשדות
            שלמטה. מה שלא זוהה יישאר ריק להקלדה ידנית, ואפשר תמיד לתקן כל שדה.
          </p>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            placeholder={"שם: מוריה שגב\nגיל: 24\nגובה: 1.68\nעיר: ירושלים\nטלפון: 052-1234567"}
            className="w-full resize-y rounded-xl border border-[#EAE5E3] bg-white px-3 py-2.5 text-sm leading-relaxed outline-none focus:border-[#8C4A55]"
          />

          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={handlePasteFromClipboard}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-[#EAE5E3] px-3 py-2 text-[12px] font-semibold text-[#3A3335] transition active:scale-95"
            >
              <ClipboardPaste size={14} /> הדבקה
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={!text.trim()}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#8C4A55] px-3 py-2 text-[12px] font-semibold text-white transition active:scale-95 disabled:opacity-50"
            >
              <Wand2 size={14} /> מילוי השדות
            </button>
          </div>

          {result !== null && (
            <p className="mt-2 text-[12px] font-semibold text-[#20A66B]">
              {result > 0 ? `מולאו ${result} שדות. בדקו אותם ותקנו במידת הצורך.` : "לא זוהו נתונים בטקסט - אפשר למלא ידנית."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
