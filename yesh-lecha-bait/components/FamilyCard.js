"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MessageSquareText, MapPin, CalendarClock, Phone } from "lucide-react";
import { WhatsAppIcon } from "@/components/BrandIcons";
import { waNumber, isMobile } from "@/lib/hebrewYear";
import { STATUS_LABELS } from "@/lib/familiesStore";

export function fillTemplate(tpl, family, extra = {}) {
  return String(tpl || "")
    .replaceAll("{משפחה}", family.lastName || "")
    .replaceAll("{שם}", family.firstName || family.lastName || "")
    .replaceAll("{שמי}", extra.myName || "")
    .replaceAll("{אירוע}", extra.eventTitle || "")
    .replaceAll("{פרטים}", extra.eventDetails || "");
}

function daysAgo(iso) {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  const d = Math.max(0, Math.floor((Date.now() - t) / 86400000));
  return d === 0 ? "היום" : d === 1 ? "אתמול" : `לפני ${d} ימים`;
}

/** בורר סטטוס נקי עם הדגשה מחליקה */
export function StatusToggle({ value, onChange, disabled, id }) {
  return (
    <div className="relative inline-flex rounded-full bg-sand p-1 text-xs font-medium">
      {Object.entries(STATUS_LABELS).map(([key, label]) => {
        const active = value === key;
        return (
          <button
            key={key}
            type="button"
            disabled={disabled}
            onClick={() => onChange(key)}
            className={`relative rounded-full px-3 py-1.5 transition ${active ? "text-cream" : "text-ink-soft hover:text-bordeaux"}`}
          >
            {active && (
              <motion.span
                layoutId={`status-${id}`}
                className={`absolute inset-0 rounded-full ${key === "current" ? "bg-gradient-to-l from-bordeaux to-rose-dark" : "bg-gradient-to-l from-gold-dark to-gold"}`}
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
              />
            )}
            <span className="relative">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function FamilyCard({ family, message, onStatus, onContact, assigneeNames, readOnly }) {
  const phones = family.phones || [];
  const [phoneIdx, setPhoneIdx] = useState(Math.max(0, phones.findIndex(isMobile)));
  const phone = phones[phoneIdx] || "";
  const enc = encodeURIComponent(message || "");
  const last = daysAgo(family.lastContactAt);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="card flex flex-col gap-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow mb-1">משפחת</p>
          <h3 className="font-display text-2xl font-bold leading-tight text-bordeaux">{family.lastName || "ללא שם משפחה"}</h3>
          {family.firstName && <p className="mt-0.5 text-ink-soft">{family.firstName}</p>}
        </div>
        {family.ageLow != null && (
          <span className="shrink-0 rounded-2xl bg-gradient-to-br from-gold-light to-gold px-3 py-2 text-center text-bordeaux shadow-glow">
            <span className="block text-[10px] tracking-widest">גיל</span>
            <span dir="ltr" className="block font-display text-lg font-bold leading-none">
              {family.ageLow}–{family.ageHigh}
            </span>
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {family.street && (
          <span className="chip"><MapPin size={12} strokeWidth={1.8} /> {family.street}</span>
        )}
        {last && (
          <span className="chip"><CalendarClock size={12} strokeWidth={1.8} /> קשר אחרון {last}</span>
        )}
        {assigneeNames && (
          <span className={`chip ${assigneeNames.length ? "" : "!bg-rose/15 !text-rose-dark"}`}>
            {assigneeNames.length ? `באחריות: ${assigneeNames.join(", ")}` : "טרם שויכה"}
          </span>
        )}
      </div>

      {phones.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {phones.map((p, i) => (
            <button
              key={p + i}
              type="button"
              onClick={() => setPhoneIdx(i)}
              className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs transition ${i === phoneIdx ? "bg-white text-bordeaux ring-1 ring-gold shadow-glow" : "bg-white/50 text-ink-soft hover:bg-white"}`}
            >
              <Phone size={11} strokeWidth={1.8} /> <span dir="ltr">{p}</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="text-xs text-rose-dark">לא זוהה מספר טלפון.</p>
      )}

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-gold/20 pt-4">
        <StatusToggle id={family.id} value={family.status} disabled={readOnly} onChange={(s) => onStatus && onStatus(s)} />
        <div className="flex gap-2">
          <a
            href={phone ? `https://wa.me/${waNumber(phone)}${enc ? `?text=${enc}` : ""}` : undefined}
            target="_blank"
            rel="noreferrer"
            onClick={() => onContact && onContact("whatsapp")}
            aria-label="WhatsApp"
            className={`flex h-10 w-10 items-center justify-center rounded-full bg-[#1f8f5f] text-white shadow-luxe transition hover:-translate-y-0.5 ${phone ? "" : "pointer-events-none opacity-40"}`}
          >
            <WhatsAppIcon size={18} />
          </a>
          <a
            href={phone ? `sms:${phone.replace(/\D/g, "")}${enc ? `?&body=${enc}` : ""}` : undefined}
            onClick={() => onContact && onContact("sms")}
            aria-label="SMS"
            className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-bordeaux to-rose-dark text-cream shadow-luxe transition hover:-translate-y-0.5 ${phone ? "" : "pointer-events-none opacity-40"}`}
          >
            <MessageSquareText size={17} strokeWidth={1.7} />
          </a>
        </div>
      </div>
    </motion.article>
  );
}
