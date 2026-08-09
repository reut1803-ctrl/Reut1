import { normalizeTagName, candidateOccupations } from "@/lib/crm/mockData";

// תבנית מוסתרת (מחוץ למסך) שמצולמת ל-PDF - כך שהטקסט העברי מוצג ומיושר נכון (RTL)
// על ידי מנוע הדפדפן עצמו, בלי צורך בפונט מוטמע או טיפול ידני בכיווניות בתוך ה-PDF.
export default function CandidateExportTemplate({ candidate, forwardedRef }) {
  const eduLabel = candidateOccupations(candidate).join(" · ");
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
        color: "#3A3335",
      }}
    >
      {candidate.photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={candidate.photoUrl}
          alt=""
          style={{ display: "block", width: "220px", height: "280px", objectFit: "cover", borderRadius: "16px", margin: "0 auto 28px" }}
        />
      )}

      <h1 style={{ textAlign: "center", fontSize: "30px", margin: "0 0 6px", color: "#8C4A55" }}>{candidate.name}</h1>
      <p style={{ textAlign: "center", fontSize: "15px", color: "#8A8285", margin: "0 0 28px" }}>
        {candidate.age} | {candidate.height} ס״מ | {candidate.region}
        {candidate.eda ? ` | ${candidate.eda}` : ""}
      </p>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "16px" }}>
        <tbody>
          <Row label="רמת תורניות" value={candidate.religiousLevel} />
          <Row label="עיסוק" value={eduLabel} />
          {candidate.tag && <Row label="תווית" value={normalizeTagName(candidate.tag)} />}
        </tbody>
      </table>

      {candidate.bio && (
        <div style={{ marginTop: "28px" }}>
          <h3 style={{ fontSize: "17px", margin: "0 0 8px", color: "#8C4A55" }}>קצת על {firstName}</h3>
          <p style={{ fontSize: "15px", lineHeight: 1.7, whiteSpace: "pre-line", margin: 0 }}>{candidate.bio}</p>
        </div>
      )}

      {candidate.traits?.length > 0 && (
        <div style={{ marginTop: "22px" }}>
          <h3 style={{ fontSize: "17px", margin: "0 0 8px", color: "#8C4A55" }}>תכונות</h3>
          <p style={{ fontSize: "15px", margin: 0 }}>{candidate.traits.join(" · ")}</p>
        </div>
      )}

      {/* עישון מוצג כהערת שוליים בתחתית העמוד, ולא כשורה בטבלה */}
      {candidate.smoking && (
        <p style={{ marginTop: "26px", paddingTop: "10px", borderTop: "1px solid #EAE5E3", fontSize: "13px", color: "#8A8285" }}>
          * עישון: {candidate.smoking}
        </p>
      )}
    </div>
  );
}

function Row({ label, value }) {
  if (!value) return null;
  return (
    <tr style={{ borderBottom: "1px solid #EAE5E3" }}>
      <td style={{ padding: "10px 0", color: "#8A8285", width: "180px" }}>{label}</td>
      <td style={{ padding: "10px 0", fontWeight: "bold" }}>{value}</td>
    </tr>
  );
}
