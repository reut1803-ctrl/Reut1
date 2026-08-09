// תבנית מוסתרת (מחוץ למסך) שמצולמת ל-PDF - כך שהטקסט העברי מוצג ומיושר נכון (RTL)
// על ידי מנוע הדפדפן עצמו, בלי צורך בפונט מוטמע או טיפול ידני בכיווניות בתוך ה-PDF.
import { occupationsOf } from "@/lib/crm/mockData";
export default function CandidateExportTemplate({ candidate, forwardedRef, photoDataUrl }) {
  const routeTags = occupationsOf(candidate);
  const firstName = candidate.name?.split(" ")[0] || "";

  return (
    <div
      ref={forwardedRef}
      dir="rtl"
      style={{
        position: "fixed",
        top: "20000px",
        left: 0,
        width: "800px",
        background: "#ffffff",
        padding: "48px",
        fontFamily: "Arial, Helvetica, sans-serif",
        color: "#3A2E26",
      }}
    >
      {/* התמונה מגיעה ככתובת data: מוכנה. התמונה במאגר נשמרת כהפניה פנימית
          (media:...) שאינה כתובת תקינה לדפדפן, ולכן חייבים לפענח אותה לפני הצילום. */}
      {photoDataUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoDataUrl}
          alt=""
          style={{ display: "block", width: "220px", height: "280px", objectFit: "cover", borderRadius: "16px", margin: "0 auto 28px" }}
        />
      )}

      <h1 style={{ textAlign: "center", fontSize: "30px", margin: "0 0 6px", color: "#844442" }}>{candidate.name}</h1>
      <p style={{ textAlign: "center", fontSize: "15px", color: "#7C6E60", margin: "0 0 28px" }}>
        {candidate.age} | {candidate.height} ס״מ | {candidate.region}
        {candidate.eda ? ` | ${candidate.eda}` : ""}
      </p>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "16px" }}>
        <tbody>
          <Row label="רמת תורניות" value={candidate.religiousLevel} />
          <Row label="עיסוק נוכחי" value={candidate.currentOccupation} />
        </tbody>
      </table>

      {candidate.bio && (
        <div style={{ marginTop: "28px" }}>
          <h3 style={{ fontSize: "17px", margin: "0 0 8px", color: "#844442" }}>קצת על {firstName}</h3>
          <p style={{ fontSize: "15px", lineHeight: 1.7, whiteSpace: "pre-line", margin: 0 }}>{candidate.bio}</p>
        </div>
      )}

      {routeTags.length > 0 && (
        <div style={{ marginTop: "22px" }}>
          <h3 style={{ fontSize: "17px", margin: "0 0 8px", color: "#844442" }}>המסלול שלי</h3>
          <p style={{ fontSize: "15px", margin: 0 }}>{routeTags.join(" · ")}</p>
        </div>
      )}

      {candidate.traits?.length > 0 && (
        <div style={{ marginTop: "22px" }}>
          <h3 style={{ fontSize: "17px", margin: "0 0 8px", color: "#844442" }}>תכונות</h3>
          <p style={{ fontSize: "15px", margin: 0 }}>{candidate.traits.join(" · ")}</p>
        </div>
      )}

      {/* עישון כהערת שוליים עדינה בתחתית, ולא כשורה בולטת בטבלה */}
      {candidate.smoking && (
        <p style={{ marginTop: "26px", fontSize: "12px", color: "#A2937F" }}>* {candidate.smoking}</p>
      )}
    </div>
  );
}

function Row({ label, value }) {
  if (!value) return null;
  return (
    <tr style={{ borderBottom: "1px solid #CCBDAB" }}>
      <td style={{ padding: "10px 0", color: "#7C6E60", width: "180px" }}>{label}</td>
      <td style={{ padding: "10px 0", fontWeight: "bold" }}>{value}</td>
    </tr>
  );
}
