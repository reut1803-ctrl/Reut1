// פענוח (בלבד, ללא אימות חתימה - אין שרת לאמת מולו) של ה-ID token שגוגל מחזירה בצד הלקוח.
export function decodeJwtPayload(token) {
  const base64Url = token.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const json = decodeURIComponent(
    atob(base64)
      .split("")
      .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
      .join("")
  );
  return JSON.parse(json);
}
