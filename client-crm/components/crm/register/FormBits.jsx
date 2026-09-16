"use client";

// אבני הבניין של טופס ההרשמה. מופרדות מהעמוד עצמו כדי שהאשף יישאר קריא,
// וכדי שכל שדה ייראה ויתנהג אותו דבר בכל ארבעת השלבים.

export function StepIndicator({ steps, current, onJump }) {
  const pct = ((current + 1) / steps.length) * 100;
  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center justify-between text-[12px] font-semibold text-[#5E7A87]">
        <span>
          שלב {current + 1} מתוך {steps.length}
        </span>
        <span className="text-[#1F6E88]">{steps[current]}</span>
      </div>

      {/* פס התקדמות רציף - נקרא במבט אחד גם במסך צר */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#DCEEF5]">
        <div
          className="h-full rounded-full bg-[#2E8BA8] transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between">
        {steps.map((label, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <button
              key={label}
              type="button"
              // חזרה לשלב קודם מותרת תמיד. קדימה לא, כדי שלא ידלגו על שדות חובה.
              onClick={() => i <= current && onJump(i)}
              disabled={i > current}
              aria-current={active ? "step" : undefined}
              aria-label={`שלב ${i + 1}: ${label}`}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-bold transition ${
                active
                  ? "bg-[#2E8BA8] text-white shadow"
                  : done
                    ? "bg-[#DCEEF5] text-[#1F6E88]"
                    : "bg-[#EDF4F8] text-[#9FBAC7]"
              } ${i <= current ? "cursor-pointer" : "cursor-default"}`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// שדה בטופס.
//
// group=true מצייר קבוצה (div) במקום תווית (label). זה חובה בכל שדה
// שמכיל כפתורים או תווית משלו - גלריית התמונות, קבוצות הבחירה
// והאישורים. תווית שעוטפת כפתורים יוצרת שני כשלים: תווית בתוך תווית
// היא HTML לא חוקי, וקורא מסך מקריא כל כפתור עם שם השדה מודבק לפניו
// ("אני * בחור" במקום "בחור").
export function Field({ label, hint, required, children, group = false, id, invalid = false }) {
  const Wrap = group ? "div" : "label";
  return (
    <Wrap
      id={id}
      // scroll-mt: כשגוללים אל השדה, הוא לא נצמד לקצה העליון של המסך
      className={`block scroll-mt-24 ${
        invalid ? "-mx-2.5 rounded-2xl bg-[#FDECEA] px-2.5 py-2.5 ring-1 ring-[#E9B4AD]" : ""
      }`}
    >
      <span
        className={`mb-1 block text-[13px] font-semibold ${invalid ? "text-[#C4584C]" : "text-[#23414E]"}`}
      >
        {label} {required && <span className="text-[#C4584C]">*</span>}
      </span>
      {invalid && (
        <span className="mb-1.5 block text-[11.5px] font-bold text-[#C4584C]">
          חסר — צריך למלא כדי לשלוח
        </span>
      )}
      {hint && <span className="mb-1.5 block text-[11.5px] leading-relaxed text-[#5E7A87]">{hint}</span>}
      {children}
    </Wrap>
  );
}

const INPUT =
  "w-full rounded-2xl border border-[#CFE3EC] bg-white px-3.5 py-3 text-[15px] text-[#23414E] outline-none transition focus:border-[#2E8BA8] focus:ring-2 focus:ring-[#2E8BA8]/20";

export function TextInput(props) {
  return <input {...props} className={INPUT} />;
}

export function TextArea({ rows = 4, ...props }) {
  return (
    <textarea
      {...props}
      rows={rows}
      // גלילה למרכז בפוקוס: בנייד המקלדת מכסה חצי מסך, ובלי זה
      // השדה התחתון נחתך בדיוק ברגע שמתחילים להקליד בו.
      onFocus={(e) => {
        const el = e.currentTarget;
        setTimeout(() => el.scrollIntoView({ block: "center", behavior: "smooth" }), 250);
      }}
      className={`${INPUT} resize-y leading-relaxed scroll-mb-64`}
    />
  );
}

export function Select({ children, ...props }) {
  return (
    <select {...props} className={INPUT}>
      {children}
    </select>
  );
}

// בחירה מרשימה סגורה בלחיצה אחת. עדיף על תפריט נפתח בנייד:
// כל האפשרויות גלויות, ואין צורך בגלילה בתוך רשימה קטנה.
export function ChipGroup({ options, value, onChange, multi = false }) {
  const selected = multi ? (Array.isArray(value) ? value : []) : [value];
  const toggle = (opt) => {
    if (!multi) return onChange(value === opt ? "" : opt);
    return onChange(selected.includes(opt) ? selected.filter((v) => v !== opt) : [...selected, opt]);
  };
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const on = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            aria-pressed={on}
            className={`rounded-full border px-3.5 py-2 text-[13px] font-semibold transition active:scale-95 ${
              on
                ? "border-[#2E8BA8] bg-[#2E8BA8] text-white shadow-sm"
                : "border-[#CFE3EC] bg-white text-[#23414E] hover:bg-[#F2F8FB]"
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

// סולם 1-10 עם שני קטבים מסומנים, כדי שברור מה כל קצה אומר.
//
// סדר הקטבים קריטי: בעברית (RTL) הדפדפן הופך את פס הגרירה, ולכן הערך
// הנמוך (1) יושב בקצה הימני והגבוה (10) בשמאלי. ב-flex תחת RTL הילד
// הראשון מוצג מימין, ולכן הקוטב הנמוך חייב להיכתב ראשון. קודם הוא
// נכתב הפוך, וכך מי שגרר לקצה שכתוב בו "שכלי/ת" קיבל בתיאור "רגשי/ת
// מאוד" - בדיוק ההפך ממה שהתכוון.
// סולם בלי קטבים מוגדרים (למשל כזה שנוצר לפני שהיה אפשר להגדיר אותם)
// מציג את שמו במרכז ואת המספר בלבד, במקום שני צדדים ריקים.
export function ScaleSlider({ scale, value, onChange, description, hint, required }) {
  const hasPoles = Boolean(scale.low && scale.high);
  return (
    <div className="rounded-2xl border border-[#CFE3EC] bg-white p-3.5">
      <div className="mb-2 flex items-center justify-between gap-2 text-[12px] font-semibold text-[#5E7A87]">
        {hasPoles && <span className="shrink-0">{scale.low}</span>}
        <span className="flex-1 text-center text-[13px] font-bold text-[#1F6E88]">
          {scale.label} {required && <span className="text-[#C4584C]">*</span>}
        </span>
        {hasPoles && <span className="shrink-0">{scale.high}</span>}
      </div>
      {hint && <p className="mb-2 text-center text-[11.5px] leading-relaxed text-[#5E7A87]">{hint}</p>}
      <input
        type="range"
        min={1}
        max={10}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={scale.label}
        className="w-full accent-[#2E8BA8]"
      />
      <p className="mt-1.5 text-center text-[12px] text-[#5E7A87]">{description}</p>
    </div>
  );
}
