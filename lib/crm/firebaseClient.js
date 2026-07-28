// חיבור Firebase של מערכת ה-CRM.
// ההגדרות מגיעות ממקום מרכזי אחד (lib/appConfig.js), כדי שלא יהיה שום סיכוי
// שהמערכת תתחבר בטעות למסד נתונים של מערכת אחרת.
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { firebaseConfig } from "../appConfig";

const crmApp = getApps().find((a) => a.name === "crm") || initializeApp(firebaseConfig, "crm");

export const crmDb = getFirestore(crmApp);
export const crmAuth = getAuth(crmApp);
export const googleProvider = new GoogleAuthProvider();
