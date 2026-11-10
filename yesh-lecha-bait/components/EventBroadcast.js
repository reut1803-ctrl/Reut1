"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ImagePlus, Share2, X, Check, Copy, MessageSquareText, Megaphone } from "lucide-react";
import { WhatsAppIcon } from "@/components/BrandIcons";
import { fillTemplate } from "@/components/FamilyCard";
import { waNumber, isMobile } from "@/lib/hebrewYear";

const DEFAULT_TEXT =
  'שלום למשפחת {משפחה},\nבשם צוות "יש לך בית" ביצהר, אנחנו שמחים להזמין אתכם ל{אירוע}.\n{פרטים}\nנשמח מאוד לראותכם.\n{שמי}';

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * הפצת אירוע: פלייר + נוסח הזמנה, לכל המשפחות של אשת הצוות.
 * הפלייר נשאר במכשיר. שיתוף התמונה עצמה נעשה דרך תפריט השיתוף של הטלפון
 * (וואטסאפ לא מאפשר לצרף תמונה דרך קישור), והנוסח האישי נשלח לכל משפחה בנפרד.
 */
export default function EventBroadcast({ families, myName, onSent, onClose }) {
  const [flyer, setFlyer] = useState(null);
  const [preview, setPreview] = useState("");
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [tpl, setTpl] = useState(DEFAULT_TEXT);
  const [sent, setSent] = useState({});
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!flyer) return setPreview("");
    const url = URL.createObjectURL(flyer);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [flyer]);

  const extra = { myName, eventTitle: title, eventDetails: details };
  const generic = fillTemplate(tpl, { lastName: "" }, extra).replace("למשפחת ,", "").replace("למשפחת", "").trim();
  const canShareFiles = useMemo(
    () => typeof navigator !== "undefined" && !!navigator.canShare && !!flyer && navigator.canShare({ files: [flyer] }),
    [flyer]
  );

  const shareFlyer = async () => {
    setNote("");
    try {
      if (canShareFiles) {
        await navigator.share({ files: [flyer], text: generic, title: title || "הזמנה" });
      } else if (flyer) {
        const a = document.createElement("a");
        a.href = preview;
        a.download = flyer.name || "flyer.jpg";
        a.click();
        await copyText(generic);
        setNote("הפלייר ירד למכשיר והנוסח הועתק. אפשר לצרף אותם לקבוצה או לרשימת תפוצה.");
      }
    } catch (e) {
      if (e?.name !== "AbortError") setNote("השיתוף לא הושלם. נסי שוב.");
    }
  };

  const allNumbers = families
    .map((f) => (f.phones || []).find(isMobile) || (f.phones || [])[0])
    .filter(Boolean)
    .join(", ");

  const mark = (f, channel) => {
    setSent((s) => ({ ...s, [f.id]: true }));
    onSent && onSent(f, channel);
  };

  return (
    <motion.div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-bordeaux/30 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ y: 60, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
        className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-[2rem] bg-cream p-6 shadow-luxe sm:rounded-[2rem] sm:p-8"
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <p className="eyebrow mb-1">הפצת אירוע</p>
            <h2 className="font-display text-3xl font-bold text-bordeaux">הזמנה למשפחות שלך</h2>
          </div>
          <button onClick={onClose} aria-label="סגירה" className="rounded-full p-2 text-ink-soft hover:bg-white">
            <X size={20} />
          </button>
        </div>

        <div className="grid gap-5 sm:grid-cols-[180px_1fr]">
          <label className="group relative flex aspect-[3/4] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-gold/50 bg-white/70 text-center text-sm text-ink-soft transition hover:border-gold">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="פלייר" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <>
                <ImagePlus size={28} strokeWidth={1.4} className="mb-2 text-gold-dark" />
                צירוף פלייר
              </>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => setFlyer(e.target.files?.[0] || null)} />
          </label>
          <div className="space-y-3">
            <div>
              <label className="label">שם האירוע</label>
              <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="ערב היכרות קהילתי" />
            </div>
            <div>
              <label className="label">פרטים</label>
              <input className="field" value={details} onChange={(e) => setDetails(e.target.value)} placeholder="יום שלישי, 20:30, בבית הכנסת המרכזי" />
            </div>
          </div>
        </div>

        <div className="mt-4">
          <label className="label">נוסח ההזמנה</label>
          <textarea className="field min-h-[130px] leading-relaxed" value={tpl} onChange={(e) => setTpl(e.target.value)} />
          <p className="mt-1 text-xs text-ink-soft/70">{"{משפחה}"} יוחלף בשם המשפחה של כל אחת. {"{אירוע}"}, {"{פרטים}"}, {"{שמי}"} מתמלאים מהשדות.</p>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" className="btn-solid" disabled={!flyer} onClick={shareFlyer}>
            <Share2 size={15} /> שיתוף הפלייר
          </button>
          <button type="button" className="btn-ghost" onClick={async () => setNote((await copyText(allNumbers)) ? "כל המספרים הועתקו, אפשר להדביק ברשימת תפוצה." : "ההעתקה נכשלה.")}>
            <Copy size={15} /> העתקת כל המספרים
          </button>
        </div>
        <AnimatePresence>
          {note && (
            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 text-sm text-gold-dark">
              {note}
            </motion.p>
          )}
        </AnimatePresence>

        <div className="mt-6">
          <p className="mb-2 flex items-center gap-2 text-sm font-medium text-bordeaux">
            <Megaphone size={15} /> שליחה אישית ({Object.keys(sent).length}/{families.length})
          </p>
          <div className="divide-y divide-gold/15 overflow-hidden rounded-2xl bg-white/70">
            {families.map((f) => {
              const phone = (f.phones || []).find(isMobile) || (f.phones || [])[0];
              const enc = encodeURIComponent(fillTemplate(tpl, f, extra));
              return (
                <div key={f.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <span className="flex min-w-0 items-center gap-2 truncate text-sm text-ink">
                    {sent[f.id] && <Check size={14} className="shrink-0 text-[#1f8f5f]" strokeWidth={2.4} />}
                    משפחת {f.lastName} {f.firstName && <span className="text-ink-soft">· {f.firstName}</span>}
                  </span>
                  <span className="flex shrink-0 gap-1.5">
                    <a
                      href={phone ? `https://wa.me/${waNumber(phone)}?text=${enc}` : undefined}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => mark(f, "whatsapp")}
                      aria-label="WhatsApp"
                      className={`flex h-8 w-8 items-center justify-center rounded-full bg-[#1f8f5f] text-white ${phone ? "" : "pointer-events-none opacity-40"}`}
                    >
                      <WhatsAppIcon size={15} />
                    </a>
                    <a
                      href={phone ? `sms:${phone.replace(/\D/g, "")}?&body=${enc}` : undefined}
                      onClick={() => mark(f, "sms")}
                      aria-label="SMS"
                      className={`flex h-8 w-8 items-center justify-center rounded-full bg-bordeaux text-cream ${phone ? "" : "pointer-events-none opacity-40"}`}
                    >
                      <MessageSquareText size={14} />
                    </a>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
