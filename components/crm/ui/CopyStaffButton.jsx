"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { useCrmStore } from "@/lib/crm/store";

// עיצוב מספר טלפון לקריאה נוחה בהודעה: 0501234567 יהפוך ל-050-1234567
export function prettyPhone(phone) {
  const digits = String(phone || "").replace(/[^0-9]/g, "");
  if (digits.length === 10 && digits.startsWith("0")) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  if (digits.length === 9 && digits.startsWith("0")) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  return String(phone || "").trim();
}

export function staffContactText(name, phone) {
  const clean = prettyPhone(phone);
  return clean ? `${String(name || "").trim()} - ${clean}` : String(name || "").trim();
}

// העתקה ללוח. navigator.clipboard אינו זמין בכל דפדפני הנייד, ולכן יש גיבוי ישן.
export async function writeToClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // ממשיכים לגיבוי
  }
  try {
    const el = document.createElement("textarea");
    el.value = text;
    el.setAttribute("readonly", "");
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}

// אייקון העתקה קטן ליד שם של איש/אשת צוות. לחיצה מעתיקה "שם - טלפון",
// כדי שאפשר יהיה להדביק ישירות בהודעה למועמד/ת.
export default function CopyStaffButton({ name, phone, className = "" }) {
  const showToast = useCrmStore((s) => s.showToast);
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const text = staffContactText(name, phone);
    const ok = await writeToClipboard(text);
    if (!ok) {
      showToast("לא הצלחתי להעתיק. אפשר לסמן את הטקסט ידנית");
      return;
    }
    setCopied(true);
    showToast(phone ? `הועתק: ${text}` : `הועתק השם בלבד - לא הוזן טלפון ל${name}`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`העתקת השם והטלפון של ${name}`}
      title="העתקת שם וטלפון"
      data-print-hide
      data-html2canvas-ignore="true"
      className={`shrink-0 rounded-full p-1.5 text-[#844442] transition active:scale-90 hover:bg-white/70 ${className}`}
    >
      {copied ? <Check size={14} className="text-[#4A6552]" /> : <Copy size={14} />}
    </button>
  );
}
