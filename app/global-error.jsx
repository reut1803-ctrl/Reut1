"use client";

// רשת ביטחון אחרונה: קריסה שקורית מחוץ למסכי המערכת (למשל בטופס ההרשמה
// החיצוני) לא תשאיר מסך ריק, אלא תציג את השגיאה ואת כפתור הרענון.
export default function GlobalError({ error, reset }) {
  return (
    <html lang="he" dir="rtl">
      <body style={{ margin: 0, background: "#F6F5F4", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ maxWidth: 420, margin: "0 auto", padding: "48px 20px", color: "#3A3335" }}>
          <h1 style={{ fontSize: 19, fontWeight: 700, margin: 0 }}>משהו נשבר בטעינת העמוד</h1>
          <p style={{ fontSize: 13, lineHeight: 1.7, color: "#8A8285" }}>
            שלחו את הפרטים שלמטה, ואפשר בינתיים לנסות שוב.
          </p>
          <button
            onClick={() => reset()}
            style={{
              width: "100%", padding: "12px 0", borderRadius: 16, border: "none",
              background: "#8C4A55", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
            }}
          >
            ניסיון נוסף
          </button>
          <p dir="ltr" style={{ marginTop: 16, fontSize: 12, color: "#C24545", wordBreak: "break-word", textAlign: "left" }}>
            {error?.message || String(error)}
          </p>
          {error?.digest && (
            <p dir="ltr" style={{ fontSize: 10, color: "#B5AEB0", textAlign: "left" }}>{error.digest}</p>
          )}
        </div>
      </body>
    </html>
  );
}
