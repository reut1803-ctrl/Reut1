"use client";

import { useState } from "react";
import { addTestimonial, deleteTestimonial } from "../lib/store";
import { Upload, Trash2, Quote } from "lucide-react";

// דוחס תמונה בצד הדפדפן ל-dataURL (JPEG) כדי להישאר קטן ובטוח לשמירה ב-Firestore.
function compressToDataURL(file, maxDim = 1100, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let { width, height } = img;
        const scale = Math.min(1, maxDim / Math.max(width, height));
        width = Math.round(width * scale);
        height = Math.round(height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff"; // רקע לבן למקרה של שקיפות
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        // מנסה להקטין את האיכות עד שהתמונה נכנסת בבטחה (<~820KB) למסמך Firestore.
        let q = quality;
        let url = canvas.toDataURL("image/jpeg", q);
        while (url.length > 820000 && q > 0.4) {
          q -= 0.12;
          url = canvas.toDataURL("image/jpeg", q);
        }
        resolve(url);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function TestimonialsManager({ data }) {
  const list = (data.testimonials || [])
    .slice()
    .sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onFiles(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    setError("");
    setBusy(true);
    try {
      for (const f of files) {
        if (!f.type.startsWith("image/")) continue;
        const url = await compressToDataURL(f);
        if (url.length > 1000000) {
          setError("אחת התמונות כבדה מדי גם אחרי דחיסה. נסו תמונה קטנה יותר.");
          continue;
        }
        await addTestimonial(url);
      }
    } catch (e2) {
      setError("ההעלאה נכשלה. נסו שוב או בחרו תמונה אחרת.");
    }
    setBusy(false);
  }

  async function remove(id) {
    if (!confirm("למחוק את ההמלצה?")) return;
    await deleteTestimonial(id);
  }

  return (
    <div className="space-y-4">
      <div className="card space-y-3">
        <p className="flex items-center gap-1.5 text-sm text-ink/60">
          <Quote className="h-4 w-4 text-rose" strokeWidth={1.75} />
          צילומי מסך של המלצות מוואטסאפ שיוצגו בקרוסלה בעמוד הבית. כדאי לחתוך כל צילום לבועות ההודעה בלבד (בלי שמות/מספרים).
        </p>
        <label className="btn-primary inline-flex w-full cursor-pointer justify-center">
          <Upload className="h-4 w-4" strokeWidth={1.75} /> {busy ? "מעלה…" : "העלאת צילומי מסך"}
          <input type="file" accept="image/*" multiple className="hidden" disabled={busy} onChange={onFiles} />
        </label>
        {error && <p className="text-sm font-medium text-roseDark">{error}</p>}
      </div>

      {list.length === 0 ? (
        <p className="text-sm text-ink/50">עדיין לא הועלו המלצות. עד שתעלי — מקטע ההמלצות באתר פשוט לא יוצג.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {list.map((t) => (
            <div key={t.id} className="relative overflow-hidden rounded-2xl border border-rose/15 bg-white shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={t.image} alt="המלצה" className="h-40 w-full object-contain" />
              <button
                onClick={() => remove(t.id)}
                className="absolute left-1.5 top-1.5 rounded-full bg-white/90 p-1.5 text-roseDark shadow hover:bg-white"
                title="מחיקה"
              >
                <Trash2 className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
