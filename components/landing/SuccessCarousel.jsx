"use client";

import { Check, CheckCheck } from "lucide-react";

const STORIES = [
  {
    id: 1,
    name: "משפחת לוי",
    messages: [
      { from: "me", text: "היי! רציתי לעדכן שהם התארסו השבוע!" },
      { from: "them", text: "איזה כיף!! מזל טוב ענק!" },
      { from: "me", text: "תודה לכם על הליווי הצמוד לאורך כל הדרך" },
    ],
  },
  {
    id: 2,
    name: "משפחת אברהם",
    messages: [
      { from: "them", text: "אני חייבת לספר לך - הפגישה השנייה הייתה מדהימה" },
      { from: "me", text: "כל כך שמחה לשמוע! ממשיכים קדימה" },
      { from: "them", text: "בזכותכם הכרנו, תודה מכל הלב" },
    ],
  },
  {
    id: 3,
    name: "משפחת דוד",
    messages: [
      { from: "me", text: "מזל טוב על החתונה שהתקיימה אתמול!" },
      { from: "them", text: "היה חלום, תודה על כל מה שעשיתם בשבילנו" },
    ],
  },
];

export default function SuccessCarousel() {
  return (
    <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2">
      {STORIES.map((story) => (
        <div
          key={story.id}
          className="card w-[78%] shrink-0 snap-center overflow-hidden"
          style={{ background: "#E9F5E4" }}
        >
          <div className="flex items-center gap-2 bg-mint-600 px-4 py-2.5 text-white">
            <div className="h-7 w-7 rounded-full bg-white/25" />
            <p className="text-sm font-semibold">{story.name}</p>
          </div>
          <div className="flex flex-col gap-2 p-3">
            {story.messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed shadow-sm ${
                  m.from === "me" ? "self-end bg-[#DCF8C6] text-ink" : "self-start bg-white text-ink"
                }`}
              >
                {m.text}
                <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-mint-600">
                  <CheckCheck size={12} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
