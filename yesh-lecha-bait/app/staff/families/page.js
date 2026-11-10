"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Megaphone, PenLine, ChevronDown, MapPinned, Lock } from "lucide-react";
import AppShell, { PageTitle } from "@/components/AppShell";
import FamilyCard, { fillTemplate } from "@/components/FamilyCard";
import TerritorySetup from "@/components/TerritorySetup";
import EventBroadcast from "@/components/EventBroadcast";
import { useAuth } from "@/context/AuthContext";
import { useFamilyFilter, FilterBar } from "@/components/FamilyFilters";
import { watchMyFamilies, setFamilyStatus, logContact } from "@/lib/familiesStore";

const TPL_KEY = "ylb_staff_message_v1";
const DEFAULT_MSG = 'שלום למשפחת {משפחה},\nכאן {שמי} מצוות "יש לך בית" ביצהר.\nאשמח לשוחח איתכם כמה דקות, מתי נוח לכם?';

export default function StaffFamiliesPage() {
  return (
    <AppShell roles={["staff"]}>
      <StaffFamilies />
    </AppShell>
  );
}

function StaffFamilies() {
  const { user, profile } = useAuth();
  const [families, setFamilies] = useState([]);
  const [error, setError] = useState("");
  const [tpl, setTpl] = useState(DEFAULT_MSG);
  const [tplOpen, setTplOpen] = useState(false);
  const [broadcast, setBroadcast] = useState(false);
  const flt = useFamilyFilter(families);
  const myName = profile.name || "";
  const territory = profile.territory;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(TPL_KEY);
      if (saved) setTpl(saved);
    } catch {}
  }, []);
  const saveTpl = (v) => {
    setTpl(v);
    try {
      localStorage.setItem(TPL_KEY, v);
    } catch {}
  };

  useEffect(() => {
    if (!territory) return;
    return watchMyFamilies(user.uid, setFamilies, (e) => {
      console.error(e);
      setError("לא הצלחתי לטעון את המשפחות. נסי לרענן.");
    });
  }, [user.uid, territory]);

  if (!territory) {
    return (
      <>
        <PageTitle eyebrow="צעד ראשון" title="אזור האחריות" />
        <TerritorySetup uid={user.uid} />
      </>
    );
  }

  const contact = (f, channel, kind) => logContact(f.id, { channel, byName: myName, kind }).catch(console.error);

  return (
    <>
      <PageTitle eyebrow="ממשק הצוות" title="המשפחות שלי">
        כל המשפחות שבאזור האחריות שלך מגיעות לכאן אוטומטית אחרי כל העלאה של ההנהלה.
      </PageTitle>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.7 }}
        className="mb-6 flex flex-wrap items-center gap-2"
      >
        <span className="chip !bg-white/70"><MapPinned size={12} /> {[...(territory.families || []), ...(territory.streets || [])].join(" · ")}</span>
        <span className="chip !bg-white/70"><Lock size={12} /> נעול</span>
        <div className="ms-auto flex gap-2">
          <button type="button" className="btn-ghost" onClick={() => setTplOpen((v) => !v)}>
            <PenLine size={15} /> נוסח הפנייה <ChevronDown size={14} className={`transition ${tplOpen ? "rotate-180" : ""}`} />
          </button>
          <button type="button" className="btn-solid" disabled={!families.length} onClick={() => setBroadcast(true)}>
            <Megaphone size={15} /> הפצת אירוע
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {tplOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="card mb-6">
              <label className="label">הנוסח שנפתח בוואטסאפ וב-SMS (נשמר במכשיר הזה)</label>
              <textarea className="field min-h-[110px] leading-relaxed" value={tpl} onChange={(e) => saveTpl(e.target.value)} />
              <p className="mt-1 text-xs text-ink-soft/70">{"{משפחה}"} שם המשפחה · {"{שם}"} השם הפרטי · {"{שמי}"} השם שלך</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <FilterBar {...flt} />
      {error && <p className="mb-4 text-sm text-rose-dark">{error}</p>}

      {families.length === 0 ? (
        <div className="card text-center leading-relaxed text-ink-soft">
          עדיין לא הגיעו משפחות לאזור שלך. ברגע שההנהלה תעלה דפי קשר, המשפחות המתאימות יופיעו כאן.
        </div>
      ) : (
        <motion.div layout className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence>
            {flt.shown.map((f) => (
              <FamilyCard
                key={f.id}
                family={f}
                message={fillTemplate(tpl, f, { myName })}
                onStatus={(s) => setFamilyStatus(f.id, s).catch(console.error)}
                onContact={(ch) => contact(f, ch)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <AnimatePresence>
        {broadcast && (
          <EventBroadcast families={flt.shown} myName={myName} onSent={(f, ch) => contact(f, ch, "event")} onClose={() => setBroadcast(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
