// אתחול Firebase + Firestore עבור צד השאלון ומסך הניהול הישן.
// מצביע לאותו פרויקט Firebase של המערכת הזו בלבד (lib/appConfig.js),
// כדי שאף חלק במערכת לא יכתוב או יקרא ממסד נתונים של מערכת אחרת.
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { firebaseConfig } from "./appConfig";

const app = getApps().find((a) => a.name === "[DEFAULT]") || initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
