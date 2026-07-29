"use client";

// טעינת הווידג'ט הרשמי של Cloudinary (סקריפט חיצוני) - עוטף חוויית העלאה אמינה ומוכרת
// שנועדה במיוחד להתמודד עם חסימות רשת/דפדפן שקריאת fetch ישירה עלולה להיתקל בהן.
const CLOUD_NAME = "ewx9uylu";
const UPLOAD_PRESET = "shiduchim_uploads";
const SCRIPT_SRC = "https://upload-widget.cloudinary.com/global/all.js";

let scriptPromise = null;

function loadWidgetScript() {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.cloudinary) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("טעינת רכיב ההעלאה נכשלה"));
    document.body.appendChild(script);
  });
  return scriptPromise;
}

// resourceType: "image" | "auto" (auto מזהה גם PDF/אודיו)
export async function openCloudinaryWidget({ resourceType = "auto", onSuccess, onError }) {
  try {
    await loadWidgetScript();
  } catch (err) {
    onError?.(err);
    return;
  }

  const widget = window.cloudinary.createUploadWidget(
    {
      cloudName: CLOUD_NAME,
      uploadPreset: UPLOAD_PRESET,
      resourceType,
      sources: ["local", "camera"],
      multiple: false,
      maxFileSize: 25 * 1024 * 1024,
      text: {
        he: {
          menu: { files: "העלאה ממכשיר", camera: "מצלמה" },
          local: { browse: "בחירת קובץ", dd_title_single: "גררי קובץ לכאן" },
        },
      },
      language: "he",
    },
    (error, result) => {
      if (error) {
        onError?.(error);
        return;
      }
      if (result?.event === "success") {
        onSuccess?.(result.info.secure_url);
      }
    }
  );

  widget.open();
}
