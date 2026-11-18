// דפדפנים מובנים של אפליקציות (וואטסאפ באנדרואיד, אינסטגרם, פייסבוק ועוד) —
// גוגל חוסמת בהם התחברות, ולכן מציעים לפתוח את האתר בדפדפן רגיל.
export function inAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /FBAN|FBAV|FB_IAB|Instagram|Line\/|MicroMessenger|Snapchat|TikTok|; wv\)/i.test(ua);
}

export function isAndroid(): boolean {
  return typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent || "");
}

export function chromeIntentUrl(): string {
  const { host, pathname } = window.location;
  return `intent://${host}${pathname}#Intent;scheme=https;package=com.android.chrome;end`;
}
