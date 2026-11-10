// הגדרות החיבור ל-Firebase.
// הערכים האלה אינם סודיים (הם מופיעים בכל אתר שמשתמש ב-Firebase);
// האבטחה האמיתית מגיעה מכללי האבטחה שבתיקייה firebase/.
// כל עוד הערכים ריקים, האפליקציה רצה ב"מצב תצוגה" עם התחברות מדומה.
export const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
};

export const isFirebaseConfigured = firebaseConfig.apiKey.trim().length > 0;
