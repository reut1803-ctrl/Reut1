"use client";

import { useEffect, useState } from "react";
import { isMediaRef, resolveMediaUrl } from "./mediaStore";

// הופך הפניית מדיה (media:...) לכתובת שניתן לנגן/לפתוח, ומשחרר את הכתובת בסיום.
// כתובות רגילות (Cloudinary או data:) מוחזרות מיד כמו שהן.
export function useMediaUrl(value) {
  const [url, setUrl] = useState(() => (isMediaRef(value) ? null : value || null));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isMediaRef(value)) {
      setUrl(value || null);
      setError("");
      return;
    }

    let objectUrl = null;
    let cancelled = false;
    setUrl(null);
    setError("");

    resolveMediaUrl(value)
      .then((resolved) => {
        if (cancelled) {
          URL.revokeObjectURL(resolved);
          return;
        }
        objectUrl = resolved;
        setUrl(resolved);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || "טעינת הקובץ נכשלה");
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [value]);

  return { url, error, loading: isMediaRef(value) && !url && !error };
}
