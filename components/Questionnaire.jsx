"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "./Header";
import Modal from "./Modal";
import DateField from "./DateField";
import { PERSONAL_FIELDS, REFERENCES_QUESTION, genderLabel } from "../lib/questions";
import { loadData, addCandidate } from "../lib/store";
import { compressImage } from "../lib/image";
import { User, Camera, MessageCircle, Contact, Lightbulb, HeartHandshake, Crown, Phone, ShieldCheck, ChevronRight } from "lucide-react";

export default function Questionnaire({ gender }) {
  const router = useRouter();
  const genderText = gender === "female" ? "בחורה" : "בחור";

  const DRAFT_KEY = `shidduch_draft_${gender}`;
  function loadDraft() {
    if (typeof window === "undefined") return null;
    try {
      const r = localStorage.getItem(DRAFT_KEY);
      return r ? JSON.parse(r) : null;
    } catch (e) {
      return null;
    }
  }

  const [openQuestions, setOpenQuestions] = useState([]);
  const [intro, setIntro] = useState("");
  const [registration, setRegistration] = useState(null);
  const [inApp, setInApp] = useState(false);
  const [track, setTrack] = useState(null); // null | "personal" | "gold" | "callback"
  const [agree, setAgree] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);
  const [form, setForm] = useState(() => loadDraft()?.form || {});
  const [photo, setPhoto] = useState(() => loadDraft()?.photo || "");
  const [refs, setRefs] = useState(
    () =>
      loadDraft()?.refs || [
        { name: "", relation: "", phone: "" },
        { name: "", relation: "", phone: "" },
      ]
  );
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const data = loadData();
    setOpenQuestions(data.openQuestions || []);
    setRegistration(data.registration);
    const it = data.intro || {};
    setIntro(gender === "female" ? it.female : it.male);
  }, [gender]);

  useEffect(() => {
    const ua = navigator.userAgent || "";
    setInApp(/FBAN|FBAV|Instagram|Line\/|Twitter|Snapchat|Pinterest|; wv\)/i.test(ua));
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, photo, refs }));
    } catch (e) {}
  }, [form, photo, refs, DRAFT_KEY]);

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }
  function setRef(i, key, value) {
    setRefs((r) => r.map((item, idx) => (idx === i ? { ...item, [key]: value } : item)));
  }

  async function onPhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setPhoto(await compressImage(file));
    } catch (err) {
      setError("בעיה בטעינת התמונה. נסו לצלם מחדש או לבחור תמונה אחרת (רצוי בפורמט JPG).");
    }
  }

  function validateFull() {
    for (const f of PERSONAL_FIELDS) {
      if (!form[f.key] || String(form[f.key]).trim() === "") return `נא למלא: ${genderLabel(f, gender)}`;
    }
    if (!photo) return "נא להוסיף תמונה";
    for (const q of openQuestions) {
      if (!form[q.key] || String(form[q.key]).trim() === "") return "נא לענות על כל השאלות";
    }
    for (const r of refs) {
      if (!r.name.trim() || !r.relation.trim() || !r.phone.trim()) return "נא למלא את פרטי שני אנשי הקשר";
    }
    if (!agree) return "נא לאשר את מדיניות הפרטיות לפני השליחה";
    return "";
  }

  async function submitFull(e) {
    e.preventDefault();
    const err = validateFull();
    if (err) {
      setError(err);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const answers = {};
    openQuestions.forEach((q) => { answers[q.key] = form[q.key]; });
    setSubmitting(true);
    try {
      await addCandidate({
        gender,
        fullName: form.fullName,
        location: form.location,
        age: form.age,
        birthDate: form.birthDate,
        height: form.height,
        community: form.community,
        work: form.work,
        degree: form.degree,
        parentsWork: form.parentsWork,
        phone: form.phone,
        photo,
        answers,
        references: refs,
        track,
        status: "pending", // ממתין לאישור ההנהלה - לא נכנס אוטומטית למאגר
      });
    } catch (err) {
      setSubmitting(false);
      setError("אירעה תקלה בשליחה. ודאו חיבור לאינטרנט ונסו שוב. אם פתחתם מתוך וואטסאפ/אינסטגרם — כדאי לפתוח את הדף בדפדפן (Chrome/Safari). מה שמילאתם נשמר ולא אבד.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}
    router.push("/thank-you");
  }

  async function submitCallback(e) {
    e.preventDefault();
    if (!form.fullName?.trim() || !form.phone?.trim()) {
      setError("נא למלא שם וטלפון.");
      return;
    }
    if (!agree) {
      setError("נא לאשר את מדיניות הפרטיות לפני השליחה.");
      return;
    }
    setSubmitting(true);
    try {
      await addCandidate({
        gender,
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        description: (form.callbackNote || "").trim(),
        track: "callback",
        status: "pending",
      });
    } catch (err) {
      setSubmitting(false);
      setError("אירעה תקלה בשליחה. ודאו חיבור לאינטרנט ונסו שוב.");
      return;
    }
    try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}
    router.push("/thank-you");
  }

  if (!registration) {
    return (
      <div>
        <Header />
        <main className="mx-auto max-w-md px-4 py-10 text-center text-ink/50">טוען…</main>
      </div>
    );
  }

  const reg = registration;
  const trackMeta = {
    personal: { icon: HeartHandshake, cfg: reg.personal },
    gold: { icon: Crown, cfg: reg.gold },
    callback: { icon: Phone, cfg: reg.callback },
  };
  const curCfg = track ? trackMeta[track].cfg : null;

  // ----- מסך בחירת מסלול -----
  if (!track) {
    const cards = [
      { id: "personal", ...trackMeta.personal },
      { id: "gold", ...trackMeta.gold },
      { id: "callback", ...trackMeta.callback },
    ].filter((c) => c.cfg?.enabled);
    return (
      <div>
        <Header />
        <main className="mx-auto max-w-md px-4 py-6">
          <h1 className="mb-1 text-2xl font-bold text-roseDark">בחירת מסלול</h1>
          <p className="mb-5 text-sm text-ink/60">מסלול: {genderText} · בחרו את הדרך שהכי מתאימה לכם</p>
          <div className="space-y-3">
            {cards.map((c) => {
              const Icon = c.icon;
              return (
                <button
                  key={c.id}
                  onClick={() => { setError(""); setTrack(c.id); window.scrollTo({ top: 0 }); }}
                  className="card flex w-full items-center gap-4 text-right transition hover:border-rose hover:shadow-lg"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blush text-roseDark">
                    <Icon className="h-6 w-6" strokeWidth={1.75} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 font-bold text-ink">
                      {c.cfg.title}
                      {c.cfg.price && <span className="rounded-full bg-rose/10 px-2 py-0.5 text-xs font-semibold text-roseDark">{c.cfg.price}</span>}
                    </span>
                    {c.cfg.desc && <span className="mt-0.5 block text-sm text-ink/60">{c.cfg.desc}</span>}
                  </span>
                  <ChevronRight className="h-5 w-5 shrink-0 rotate-180 text-ink/30" />
                </button>
              );
            })}
          </div>
        </main>
        {showPolicy && <PolicyModal text={reg.policy} onClose={() => setShowPolicy(false)} />}
      </div>
    );
  }

  const policyRow = (
    <label className="flex items-start gap-3 rounded-2xl bg-blush/40 p-4">
      <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-rose" checked={agree} onChange={(e) => { setAgree(e.target.checked); setError(""); }} />
      <span className="text-sm text-ink/80">
        קראתי ואני מאשר/ת את{" "}
        <button type="button" className="font-semibold text-roseDark underline underline-offset-2" onClick={() => setShowPolicy(true)}>מדיניות הפרטיות</button>.
      </span>
    </label>
  );

  const backBtn = (
    <button type="button" onClick={() => { setTrack(null); setError(""); }} className="mb-3 flex items-center gap-1 text-sm font-medium text-ink/50 hover:text-rose">
      <ChevronRight className="h-4 w-4" strokeWidth={2} /> חזרה לבחירת מסלול
    </button>
  );

  // ----- מסלול "שיחזרו אליי" -----
  if (track === "callback") {
    return (
      <div>
        <Header />
        <main className="mx-auto max-w-md px-4 py-6 pb-24">
          {backBtn}
          <h1 className="mb-1 flex items-center gap-2 text-2xl font-bold text-roseDark"><Phone className="h-6 w-6" strokeWidth={1.75} /> {reg.callback.title}</h1>
          <p className="mb-4 text-sm text-ink/60">השאירו פרטים ונחזור אליכם בהקדם.</p>
          {error && <div className="mb-4 rounded-2xl bg-rose/10 px-4 py-3 text-sm font-medium text-roseDark">{error}</div>}
          <form onSubmit={submitCallback} className="space-y-4">
            <section className="card space-y-4">
              <div>
                <label className="field-label">שם מלא</label>
                <input className="field-input" value={form.fullName || ""} onChange={(e) => setField("fullName", e.target.value)} />
              </div>
              <div>
                <label className="field-label">טלפון</label>
                <input className="field-input" type="tel" value={form.phone || ""} onChange={(e) => setField("phone", e.target.value)} />
              </div>
              <div>
                <label className="field-label">הערה (לא חובה)</label>
                <textarea className="field-input min-h-[80px]" value={form.callbackNote || ""} onChange={(e) => setField("callbackNote", e.target.value)} placeholder="מה היה נוח לכם שנדע מראש?" />
              </div>
            </section>
            {policyRow}
            <button type="submit" disabled={submitting} className="btn-primary w-full text-lg">{submitting ? "שולח…" : "שליחה"}</button>
          </form>
        </main>
        {showPolicy && <PolicyModal text={reg.policy} onClose={() => setShowPolicy(false)} />}
      </div>
    );
  }

  // ----- מסלול אישי / מסגרת זהב (שאלון מלא) -----
  return (
    <div>
      <Header />
      <main className="mx-auto max-w-md px-4 py-6 pb-24">
        {backBtn}
        <h1 className="mb-1 text-2xl font-bold text-roseDark">{curCfg.title} — שאלון היכרות</h1>
        <p className="mb-4 text-sm text-ink/60">מסלול: {genderText} · כל השדות הם שדות חובה</p>

        {intro && (
          <div className="mb-5 rounded-3xl bg-blush/60 px-5 py-4 text-center text-lg font-medium leading-relaxed text-ink">{intro}</div>
        )}

        {/* פרטי תשלום בביט */}
        {(curCfg.price || curCfg.pay || reg.bit) && (
          <div className="mb-5 rounded-2xl border border-rose/30 bg-white/70 p-4">
            <p className="mb-1 font-bold text-roseDark">פרטי תשלום</p>
            {curCfg.price && <p className="text-sm text-ink/80">עלות המסלול: <b>{curCfg.price}</b></p>}
            {reg.bit && <p className="text-sm text-ink/80">תשלום באפליקציית ביט (Bit) אל: <b>{reg.bit}</b></p>}
            {curCfg.pay && <p className="mt-1 whitespace-pre-wrap text-sm text-ink/70">{curCfg.pay}</p>}
            <p className="mt-2 text-xs text-ink/50">לאחר שליחת הטופס, נא להשלים את התשלום בביט. ההרשמה תאושר על ידי ההנהלה לאחר אימות הפרטים והתשלום.</p>
          </div>
        )}

        {inApp && (
          <div className="mb-4 flex items-start gap-2 rounded-2xl bg-amber-100 px-4 py-3 text-sm font-medium text-amber-800">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} /> <span>פתחתם מתוך אפליקציה (וואטסאפ/אינסטגרם). כדי שהשליחה תעבוד חלק, מומלץ לפתוח את הדף בדפדפן.</span>
          </div>
        )}
        {error && <div className="mb-4 rounded-2xl bg-rose/10 px-4 py-3 text-sm font-medium text-roseDark">{error}</div>}

        <form onSubmit={submitFull} className="space-y-5">
          <section className="card space-y-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-ink"><User className="h-5 w-5 text-rose" strokeWidth={1.75} /> פרטים אישיים</h2>
            {PERSONAL_FIELDS.map((f) => (
              <div key={f.key}>
                <label className="field-label">{genderLabel(f, gender)}</label>
                {f.type === "date" ? (
                  <DateField value={form[f.key]} onChange={(v) => setField(f.key, v)} />
                ) : (
                  <input className="field-input" type={f.type} value={form[f.key] || ""} onChange={(e) => setField(f.key, e.target.value)} />
                )}
              </div>
            ))}
            <div>
              <label className="field-label flex items-center gap-1.5"><Camera className="h-4 w-4" strokeWidth={1.75} /> הוספת תמונה</label>
              <input className="field-input" type="file" accept="image/*" onChange={onPhoto} />
              {photo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo} alt="תצוגה מקדימה" className="mt-3 h-28 w-28 rounded-2xl object-cover" />
              )}
            </div>
          </section>

          <section className="card space-y-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-ink"><MessageCircle className="h-5 w-5 text-rose" strokeWidth={1.75} /> קצת עליך</h2>
            {openQuestions.map((q) => (
              <div key={q.key}>
                <label className="field-label">{genderLabel(q, gender)}</label>
                <textarea className="field-input min-h-[90px]" value={form[q.key] || ""} onChange={(e) => setField(q.key, e.target.value)} />
              </div>
            ))}
          </section>

          <section className="card space-y-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-ink"><Contact className="h-5 w-5 text-rose" strokeWidth={1.75} /> אנשי קשר</h2>
            <p className="text-sm text-ink/70">{REFERENCES_QUESTION}</p>
            {refs.map((r, i) => (
              <div key={i} className="space-y-2 rounded-2xl bg-blush/40 p-3">
                <p className="text-sm font-medium text-roseDark">איש קשר {i + 1}</p>
                <input className="field-input" placeholder="שם" value={r.name} onChange={(e) => setRef(i, "name", e.target.value)} />
                <input className="field-input" placeholder="מה הם בשבילך" value={r.relation} onChange={(e) => setRef(i, "relation", e.target.value)} />
                <input className="field-input" placeholder="טלפון" type="tel" value={r.phone} onChange={(e) => setRef(i, "phone", e.target.value)} />
              </div>
            ))}
          </section>

          {policyRow}

          <button type="submit" disabled={submitting} className="btn-primary w-full text-lg">{submitting ? "שולח…" : "שליחה"}</button>
          <p className="text-center text-xs text-ink/50">לאחר השליחה לא ניתן לערוך את הטופס.</p>
        </form>
      </main>
      {showPolicy && <PolicyModal text={reg.policy} onClose={() => setShowPolicy(false)} />}
    </div>
  );
}

function PolicyModal({ text, onClose }) {
  return (
    <Modal title="מדיניות ופרטיות" onClose={onClose}>
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-roseDark"><ShieldCheck className="h-5 w-5" strokeWidth={1.75} /> <span className="font-semibold">הפרטיות שלך חשובה לנו</span></div>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink/80">{text || "הפרטים נשמרים בדיסקרטיות וישמשו את צוות השידוכים בלבד."}</p>
        <button className="btn-primary w-full" onClick={onClose}>הבנתי</button>
      </div>
    </Modal>
  );
}
