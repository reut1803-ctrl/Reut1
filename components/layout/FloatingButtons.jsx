"use client";

import { useState } from "react";
import { Accessibility, MessageCircle, X, ZoomIn, ZoomOut, Contrast } from "lucide-react";

export default function FloatingButtons() {
  const [a11yOpen, setA11yOpen] = useState(false);
  const [fontScale, setFontScale] = useState(100);
  const [highContrast, setHighContrast] = useState(false);

  const adjustFont = (delta) => {
    const next = Math.min(130, Math.max(90, fontScale + delta));
    setFontScale(next);
    document.documentElement.style.fontSize = `${next}%`;
  };

  const toggleContrast = () => {
    setHighContrast((v) => !v);
    document.documentElement.classList.toggle("contrast-125");
  };

  return (
    <div className="fixed bottom-24 left-4 z-40 flex flex-col items-start gap-3">
      {a11yOpen && (
        <div className="card mb-1 flex w-52 flex-col gap-2 p-3 animate-slide-up">
          <p className="mb-1 text-xs font-semibold text-muted">נגישות</p>
          <button
            onClick={() => adjustFont(10)}
            className="flex items-center gap-2 rounded-xl bg-bg px-3 py-2 text-sm font-medium"
          >
            <ZoomIn size={16} /> הגדלת טקסט
          </button>
          <button
            onClick={() => adjustFont(-10)}
            className="flex items-center gap-2 rounded-xl bg-bg px-3 py-2 text-sm font-medium"
          >
            <ZoomOut size={16} /> הקטנת טקסט
          </button>
          <button
            onClick={toggleContrast}
            className="flex items-center gap-2 rounded-xl bg-bg px-3 py-2 text-sm font-medium"
          >
            <Contrast size={16} /> ניגודיות גבוהה
          </button>
        </div>
      )}
      <button
        onClick={() => setA11yOpen((v) => !v)}
        aria-label="נגישות"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-bordeaux-500 text-white shadow-float transition active:scale-90"
      >
        {a11yOpen ? <X size={20} /> : <Accessibility size={22} />}
      </button>

      <a
        href="https://wa.me/972501234567"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="שאלות בוואטסאפ"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-mint-500 text-white shadow-float transition active:scale-90"
      >
        <MessageCircle size={22} />
      </a>
    </div>
  );
}
