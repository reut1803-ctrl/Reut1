// חיפוש חופשי בכרטיס מועמד/ת.
//
// החיפוש עובר על כל שדות הטקסט של הכרטיס, ולא רק על השם: יישוב, עדה,
// עיסוק, מסלול, תיאור אישי, תוויות, הערות הצוות וההערה הפנימית האישית.
// כך אפשר למצוא "סוסים", "חקלאות" או שם של מוסד לימודים גם כשהם מופיעים
// באמצע התיאור החופשי.
//
// כל מילה בשאילתה נבדקת בנפרד, וכולן חייבות להימצא (וגם, לא או). כך
// "מדרשה ירושלים" מחזיר רק את מי שגם למד/ה במדרשה וגם מירושלים.

function candidateHaystack(candidate, personalNote = "") {
  const parts = [
    candidate.name,
    candidate.city,
    candidate.region,
    candidate.eda,
    candidate.religiousLevel,
    candidate.currentOccupation,
    candidate.education,
    candidate.yeshivaLevel,
    candidate.bio,
    candidate.tag,
    candidate.staffNote,
    candidate.adminNote,
    candidate.complexityNotes,
    candidate.referenceContacts,
    candidate.availabilityStatus,
    personalNote,
    ...(Array.isArray(candidate.occupations) ? candidate.occupations : []),
    ...(Array.isArray(candidate.traits) ? candidate.traits : []),
    ...(Array.isArray(candidate.lifestyle) ? candidate.lifestyle : []),
    ...(Array.isArray(candidate.voiceNotes) ? candidate.voiceNotes.map((v) => v?.name) : []),
  ];
  return parts
    .filter((v) => typeof v === "string" || typeof v === "number")
    .join(" ")
    .toLowerCase();
}

export function matchesSearch(candidate, term, personalNote = "") {
  const words = String(term || "").trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const hay = candidateHaystack(candidate, personalNote);
  return words.every((w) => hay.includes(w));
}
