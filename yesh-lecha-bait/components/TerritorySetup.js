"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPinned, Lock, X, Plus } from "lucide-react";
import { parseList } from "@/lib/territory";
import { saveTerritory } from "@/lib/familiesStore";

function ChipInput({ label, hint, values, setValues }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const next = parseList([...values, ...parseList(draft)].join("\n"));
    setValues(next);
    setDraft("");
  };
  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex gap-2">
        <input
          className="field"
          value={draft}
          placeholder={hint}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <button type="button" className="btn-ghost shrink-0" onClick={add} disabled={!draft.trim()}>
          <Plus size={15} /> הוספה
        </button>
      </div>
      <div className="mt-3 flex min-h-[2rem] flex-wrap gap-2">
        <AnimatePresence>
          {values.map((v) => (
            <motion.span
              key={v}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm text-bordeaux ring-1 ring-gold/50"
            >
              {v}
              <button type="button" aria-label={`הסרת ${v}`} onClick={() => setValues(values.filter((x) => x !== v))}>
                <X size={13} />
              </button>
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

/** הגדרת טריטוריה — פעם אחת. אחרי השמירה נעול; שינוי רק דרך ההנהלה. */
export default function TerritorySetup({ uid }) {
  const [families, setFamilies] = useState([]);
  const [streets, setStreets] = useState([]);
  const [confirm, setConfirm] = useState(false);
  const [state, setState] = useState("idle");

  const save = async () => {
    setState("saving");
    try {
      await saveTerritory(uid, { families, streets });
    } catch (e) {
      console.error(e);
      setState("error");
    }
  };

  const empty = !families.length && !streets.length;

  return (
    <motion.section
      initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      className="card mx-auto max-w-2xl"
    >
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-light to-gold text-bordeaux shadow-glow">
        <MapPinned size={24} strokeWidth={1.6} />
      </span>
      <h2 className="font-display text-3xl font-bold text-bordeaux">הגדרת אזור האחריות שלך</h2>
      <p className="mt-2 leading-relaxed text-ink-soft">
        מגדירים פעם אחת את שמות המשפחה או הרחובות שבאחריותך. מכאן והלאה, כל משפחה שמתאימה לאזור שלך תגיע אלייך אוטומטית.
      </p>

      <div className="mt-6 space-y-6">
        <ChipInput label="שמות משפחה" hint="למשל: כהן, לוי (אפשר כמה בבת אחת, מופרדים בפסיק)" values={families} setValues={setFamilies} />
        <ChipInput label="רחובות" hint="למשל: הרימון" values={streets} setValues={setStreets} />
      </div>

      <div className="mt-8 rounded-2xl bg-sand/70 p-4 text-sm leading-relaxed text-ink-soft">
        <span className="flex items-center gap-2 font-medium text-bordeaux">
          <Lock size={14} /> שימי לב
        </span>
        אחרי השמירה האזור ננעל. שינוי בהמשך נעשה דרך ההנהלה.
      </div>

      {!confirm ? (
        <button type="button" className="btn-luxe mt-6 w-full" disabled={empty} onClick={() => setConfirm(true)}>
          שמירת אזור האחריות
        </button>
      ) : (
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button type="button" className="btn-luxe flex-1" disabled={state === "saving"} onClick={save}>
            {state === "saving" ? "שומרת…" : "כן, לנעול ולשמור"}
          </button>
          <button type="button" className="btn-ghost flex-1 !py-4" onClick={() => setConfirm(false)}>
            חזרה לעריכה
          </button>
        </div>
      )}
      {state === "error" && <p className="mt-3 text-sm text-rose-dark">השמירה נכשלה. בדקי חיבור ונסי שוב.</p>}
    </motion.section>
  );
}
