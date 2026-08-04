"use client";

import { useState } from "react";
import { Briefcase, ChevronDown, MessageCircle, Phone, Copy, Check, Pencil, Trash2, UserPlus, X } from "lucide-react";
import { useCrmStore } from "@/lib/crm/store";
import { waDigits } from "@/components/crm/profiles/ProfileCard";
import { prettyPhone } from "@/components/crm/ui/CopyStaffButton";

// הצעות נפוצות ל"כובע" של איש המקצוע. אפשר גם להקליד תפקיד אחר בחופשיות.
const ROLE_SUGGESTIONS = [
  "אימון לחתונה",
  "ליווי תוך כדי קשר",
  "עיבוד אחרי קשר ארוך",
  "ליווי רגשי",
  "ייעוץ מקצועי",
];

const EMPTY_FORM = { name: "", role: "", location: "", phone: "" };

// שורת ההעתקה: כל פרטי איש המקצוע כמקשה אחת, מוכנים לשליחה לשגריר/ה
export function professionalText(p) {
  return [p.name, p.role, p.location, prettyPhone(p.phone)].map((v) => String(v || "").trim()).filter(Boolean).join(" - ");
}

async function writeToClipboard(text) {
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

function CopyRowButton({ pro }) {
  const showToast = useCrmStore((s) => s.showToast);
  const [copied, setCopied] = useState(false);

  const handle = async () => {
    const text = professionalText(pro);
    const ok = await writeToClipboard(text);
    if (!ok) {
      showToast("לא הצלחתי להעתיק. אפשר לסמן את הטקסט ידנית");
      return;
    }
    setCopied(true);
    showToast(`הועתק: ${text}`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handle}
      aria-label={`העתקת כל פרטי ${pro.name}`}
      title="העתקת כל השורה"
      className="shrink-0 rounded-full p-1.5 text-[#844442] transition active:scale-90 hover:bg-white/70"
    >
      {copied ? <Check size={15} className="text-[#4A6552]" /> : <Copy size={15} />}
    </button>
  );
}

// מאגר אנשי המקצוע החיצוניים (מאמנים ומלווים), בתצוגה נפתחת ונסגרת,
// כדי שלוח הבקרה לא יתארך. הניהול נעשה כאן, ישירות מתוך לוח הבקרה.
export default function ProfessionalsDirectory() {
  const professionals = useCrmStore((s) => s.professionals);
  const addProfessional = useCrmStore((s) => s.addProfessional);
  const updateProfessional = useCrmStore((s) => s.updateProfessional);
  const removeProfessional = useCrmStore((s) => s.removeProfessional);
  const showToast = useCrmStore((s) => s.showToast);

  const [open, setOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormOpen(false);
  };

  const startEdit = (pro) => {
    setForm({ name: pro.name || "", role: pro.role || "", location: pro.location || "", phone: pro.phone || "" });
    setEditingId(pro.id);
    setFormOpen(true);
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      showToast("צריך להזין לפחות שם");
      return;
    }
    if (editingId) {
      await updateProfessional(editingId, form);
      showToast("הפרטים עודכנו");
    } else {
      await addProfessional(form);
      showToast("איש/אשת המקצוע נוסף/ה למאגר");
    }
    resetForm();
  };

  const handleRemove = async (pro) => {
    await removeProfessional(pro.id);
    showToast(`${pro.name} הוסר/ה מהמאגר`);
    if (editingId === pro.id) resetForm();
  };

  const field = (key, placeholder, type = "text", dir) => (
    <input
      type={type}
      dir={dir}
      value={form[key]}
      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
      placeholder={placeholder}
      className={`w-full rounded-xl border border-[#CCBDAB] bg-white px-3 py-2 text-sm outline-none focus:border-[#844442] ${
        dir === "ltr" ? "text-left" : ""
      }`}
      {...(key === "role" ? { list: "pro-role-suggestions" } : {})}
    />
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="mt-8 mb-3 flex w-full items-center justify-between gap-2 text-right"
      >
        <ChevronDown size={18} className={`shrink-0 text-[#844442] transition-transform ${open ? "rotate-180" : ""}`} />
        <span className="flex min-w-0 items-center gap-1.5 text-[15px] font-bold text-[#3A2E26]">
          <Briefcase size={17} /> מאגר אנשי מקצוע ({professionals.length})
        </span>
      </button>

      {open && (
        <div className="rounded-3xl border border-[#CCBDAB] bg-white p-4 shadow-[0_4px_18px_rgba(58,51,53,0.06)]">
          {professionals.length === 0 ? (
            <p className="py-4 text-center text-[13px] text-[#7C6E60]">
              המאגר עדיין ריק. אפשר להוסיף מאמנים ומלווים בכפתור שלמטה.
            </p>
          ) : (
            <div className="space-y-2">
              {professionals.map((pro) => (
                <div key={pro.id} className="rounded-2xl bg-[#E8DCCB] px-3 py-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex shrink-0 items-center">
                      <CopyRowButton pro={pro} />
                      <button
                        type="button"
                        onClick={() => startEdit(pro)}
                        aria-label={`עריכת ${pro.name}`}
                        title="עריכה"
                        className="rounded-full p-1.5 text-[#7C6E60] transition active:scale-90 hover:bg-white/70"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemove(pro)}
                        aria-label={`מחיקת ${pro.name}`}
                        title="מחיקה"
                        className="rounded-full p-1.5 text-[#C24545] transition active:scale-90 hover:bg-white/70"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="min-w-0 flex-1 text-right">
                      <p className="break-words text-[13px] font-bold leading-relaxed text-[#3A2E26]">{pro.name}</p>
                      {(pro.role || pro.location) && (
                        <p className="break-words text-[11px] leading-relaxed text-[#7C6E60]">
                          {[pro.role, pro.location].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>
                  </div>

                  {pro.phone && (
                    <div className="mt-1.5 flex items-center justify-end gap-2 border-t border-[#CCBDAB] pt-1.5">
                      <a
                        href={`https://wa.me/${waDigits(pro.phone)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`וואטסאפ ל${pro.name}`}
                        title="וואטסאפ"
                        className="text-[#62826B] transition active:scale-90"
                      >
                        <MessageCircle size={17} />
                      </a>
                      <a
                        href={`tel:${pro.phone}`}
                        dir="ltr"
                        className="flex items-center gap-1 text-[13px] font-semibold text-[#3A2E26]"
                      >
                        <Phone size={13} className="text-[#844442]" />
                        {prettyPhone(pro.phone)}
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <datalist id="pro-role-suggestions">
            {ROLE_SUGGESTIONS.map((r) => (
              <option key={r} value={r} />
            ))}
          </datalist>

          {formOpen ? (
            <div className="mt-3 space-y-2 border-t border-[#CCBDAB] pt-3">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={resetForm}
                  aria-label="ביטול"
                  className="rounded-full p-1 text-[#7C6E60] hover:bg-[#E8DCCB]"
                >
                  <X size={15} />
                </button>
                <p className="text-[13px] font-semibold text-[#3A2E26]">
                  {editingId ? "עריכת פרטים" : "איש/אשת מקצוע חדש/ה"}
                </p>
              </div>
              {field("name", "שם מלא")}
              {field("role", "תפקיד / כובע - אימון, ליווי רגשי, עיבוד...")}
              {field("location", "מיקום בארץ - עיר או אזור")}
              {field("phone", "טלפון", "tel", "ltr")}
              <button
                type="button"
                onClick={handleSave}
                className="w-full rounded-2xl bg-[#844442] px-4 py-2.5 text-[13px] font-semibold text-white transition active:scale-95"
              >
                {editingId ? "שמירת השינויים" : "הוספה למאגר"}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setFormOpen(true)}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-2xl border-2 border-[#844442] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#844442] transition active:scale-95 hover:bg-[#F0E2DE]"
            >
              <UserPlus size={15} /> הוספת איש מקצוע
            </button>
          )}
        </div>
      )}
    </>
  );
}
