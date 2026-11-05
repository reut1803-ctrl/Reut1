// חילוץ קובץ הטקסט של הצ'אט מתוך קובץ ZIP שוואטסאפ מייצא - בדפדפן, בלי חבילות.
//
// וואטסאפ בחלק מהמכשירים מייצא ZIP גם כשבוחרים "ללא מדיה", ועם מדיה - ZIP
// גדול מאוד. כדי לא לטעון את כל הקובץ לזיכרון של הטלפון, קוראים רק את
// החלקים הנחוצים: סוף הקובץ (תוכן העניינים של ה-ZIP), ואז את קובץ הטקסט בלבד.
// הפענוח נעשה עם DecompressionStream המובנה בדפדפן.

const u16 = (v, o) => v.getUint16(o, true);
const u32 = (v, o) => v.getUint32(o, true);
const readSlice = async (file, start, end) => new DataView(await file.slice(start, end).arrayBuffer());

async function inflateRaw(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

// מחזיר את טקסט הצ'אט, או זורק שגיאה עם הסבר בעברית
export async function chatTextFromZip(file) {
  if (typeof DecompressionStream === "undefined") {
    throw new Error("הדפדפן הזה לא יודע לפתוח ZIP. אפשר לפתוח את הקובץ בטלפון ולהעלות את קובץ הטקסט שבתוכו.");
  }
  // סוף הרשומה הראשית (End Of Central Directory) נמצא ב-64KB האחרונים
  const tailStart = Math.max(0, file.size - 65_557);
  const tail = await readSlice(file, tailStart, file.size);
  let eocd = -1;
  for (let i = tail.byteLength - 22; i >= 0; i -= 1) {
    if (u32(tail, i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("הקובץ לא נראה כמו ZIP תקין.");
  const count = u16(tail, eocd + 10);
  const cdSize = u32(tail, eocd + 12);
  const cdOffset = u32(tail, eocd + 16);
  const cd = await readSlice(file, cdOffset, cdOffset + cdSize);

  // מחפשים את קובץ הטקסט: "_chat.txt" (אייפון) או "WhatsApp Chat ... .txt" (אנדרואיד)
  const decoder = new TextDecoder("utf-8");
  let best = null;
  for (let p = 0, n = 0; n < count && p + 46 <= cd.byteLength; n += 1) {
    if (u32(cd, p) !== 0x02014b50) break;
    const method = u16(cd, p + 10);
    const compSize = u32(cd, p + 20);
    const size = u32(cd, p + 24);
    const nameLen = u16(cd, p + 28);
    const extraLen = u16(cd, p + 30);
    const commentLen = u16(cd, p + 32);
    const localOffset = u32(cd, p + 42);
    const name = decoder.decode(new Uint8Array(cd.buffer, cd.byteOffset + p + 46, nameLen));
    if (/\.txt$/i.test(name) && (!best || size > best.size)) best = { name, method, compSize, size, localOffset };
    p += 46 + nameLen + extraLen + commentLen;
  }
  if (!best) throw new Error("לא נמצא קובץ טקסט של צ'אט בתוך ה-ZIP.");
  if (best.size > 20 * 1024 * 1024) throw new Error("קובץ הצ'אט גדול מדי. אפשר לייצא קבוצה עם פחות היסטוריה.");

  const local = await readSlice(file, best.localOffset, best.localOffset + 30);
  if (u32(local, 0) !== 0x04034b50) throw new Error("הקובץ לא נראה כמו ZIP תקין.");
  const dataStart = best.localOffset + 30 + u16(local, 26) + u16(local, 28);
  const raw = new Uint8Array(await file.slice(dataStart, dataStart + best.compSize).arrayBuffer());
  let bytes;
  if (best.method === 0) bytes = raw;
  else if (best.method === 8) bytes = await inflateRaw(raw);
  else throw new Error("שיטת הדחיסה של הקובץ לא נתמכת.");
  return decoder.decode(bytes);
}
