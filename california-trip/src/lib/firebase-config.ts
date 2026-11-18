// הגדרות החיבור ל-Firebase של הפרויקט california-trip-5119e.
// הערכים האלה אינם סודיים (הם מופיעים בכל אתר שמשתמש ב-Firebase);
// האבטחה האמיתית מגיעה מכללי האבטחה שבתיקייה firebase/.
export const firebaseConfig = {
  apiKey: "AIzaSyCL6rASsrbiXiOBPCzrIx0fyVbctV1wAI8",
  authDomain: "california-trip-5119e.firebaseapp.com",
  projectId: "california-trip-5119e",
  storageBucket: "california-trip-5119e.firebasestorage.app",
  messagingSenderId: "1020945892675",
  appId: "1:1020945892675:web:996f8c3eb45f046a509bf6",
};

// התצוגה המקדימה בצ'אט לא יכולה להתחבר לגוגל, ולכן היא מבקשת "מצב תצוגה" במפורש.
const forceDemo =
  typeof window !== "undefined" &&
  (window as unknown as { __ctForceDemo?: boolean }).__ctForceDemo === true;

export const isFirebaseConfigured = firebaseConfig.apiKey.trim().length > 0 && !forceDemo;
