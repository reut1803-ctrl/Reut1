// ============================================================================
//  שכבת הנתונים של מודול המשפחות.
//  families/{id}: lastName, firstName, phones[], street, ageLow, ageHigh,
//                 grade, year, source, assignedTo[uid], status, contactLog[]
//  status: "current" (מועמד עכשווי) | "future" (פוטנציאל עתידי) | ללא — טרם סווג
// ============================================================================

import {
  collection, doc, getDocs, onSnapshot, query, where, writeBatch,
  updateDoc, arrayUnion, serverTimestamp, deleteField, setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { assigneesFor, familyDocId } from "@/lib/territory";

export const STATUS_LABELS = { current: "מועמד עכשווי", future: "פוטנציאל עתידי" };

export async function loadStaff() {
  const snap = await getDocs(query(collection(db, "users"), where("role", "==", "staff")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function loadAllUsers() {
  const snap = await getDocs(collection(db, "users"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** שמירת משפחות שחולצו + שיוך מיידי לפי הטריטוריות. מחזיר כמה שויכו. */
export async function saveFamilies(rows, meta) {
  const staff = await loadStaff();
  let assigned = 0;
  for (let i = 0; i < rows.length; i += 400) {
    const batch = writeBatch(db);
    for (const r of rows.slice(i, i + 400)) {
      const family = {
        lastName: r.lastName || "",
        firstName: r.firstName || "",
        phones: r.phones || [],
        street: r.street || "",
        ageLow: r.age ? r.age.low : null,
        ageHigh: r.age ? r.age.high : null,
        grade: r.grade || null,
        year: r.year || null,
        source: meta.source || "",
      };
      const assignedTo = assigneesFor(family, staff);
      if (assignedTo.length) assigned++;
      // merge: סטטוס ויומן קשר שאשת הצוות כבר עדכנה — נשמרים
      batch.set(
        doc(db, "families", familyDocId(family)),
        { ...family, assignedTo, updatedAt: serverTimestamp() },
        { merge: true }
      );
    }
    await batch.commit();
  }
  return { total: rows.length, assigned };
}

/** שיגור מחדש: מחשב שוב את השיוך של כל המשפחות מול הטריטוריות העדכניות. */
export async function resyncAll() {
  const [staff, snap] = await Promise.all([loadStaff(), getDocs(collection(db, "families"))]);
  const changes = [];
  snap.docs.forEach((d) => {
    const f = d.data();
    const next = assigneesFor(f, staff);
    const prev = [...(f.assignedTo || [])].sort();
    if (JSON.stringify(next) !== JSON.stringify(prev)) changes.push([d.ref, next]);
  });
  for (let i = 0; i < changes.length; i += 400) {
    const batch = writeBatch(db);
    changes.slice(i, i + 400).forEach(([ref, next]) => batch.update(ref, { assignedTo: next }));
    await batch.commit();
  }
  return { total: snap.size, changed: changes.length };
}

export function watchAllFamilies(cb, onError) {
  return onSnapshot(collection(db, "families"), (s) => cb(s.docs.map((d) => ({ id: d.id, ...d.data() }))), onError);
}

export function watchMyFamilies(uid, cb, onError) {
  const q = query(collection(db, "families"), where("assignedTo", "array-contains", uid));
  return onSnapshot(q, (s) => cb(s.docs.map((d) => ({ id: d.id, ...d.data() }))), onError);
}

export function setFamilyStatus(id, status) {
  return updateDoc(doc(db, "families", id), { status, statusUpdatedAt: serverTimestamp() });
}

export function logContact(id, { channel, byName, kind }) {
  return updateDoc(doc(db, "families", id), {
    lastContactAt: new Date().toISOString(),
    contactLog: arrayUnion({ at: new Date().toISOString(), channel, kind: kind || "message", byName: byName || "" }),
  });
}

export function deleteFamilies(ids) {
  const batch = writeBatch(db);
  ids.forEach((id) => batch.delete(doc(db, "families", id)));
  return batch.commit();
}

// ---------- משתמשות ----------
export function saveTerritory(uid, territory) {
  return updateDoc(doc(db, "users", uid), {
    territory: { families: territory.families, streets: territory.streets, setAt: new Date().toISOString() },
  });
}
export function resetTerritory(uid) {
  return updateDoc(doc(db, "users", uid), { territory: deleteField() });
}
export function setRole(uid, role) {
  return setDoc(doc(db, "users", uid), { role }, { merge: true });
}
