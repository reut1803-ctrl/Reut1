"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { useCrmStore } from "@/lib/crm/store";
import { REGIONS, RELIGIOUS_LEVELS, EDUCATION_OPTIONS, YESHIVA_LEVELS, SMOKING_OPTIONS, TRAITS } from "@/lib/crm/mockData";
import Button from "@/components/crm/ui/Button";

const EMPTY_FORM = {
  gender: "male",
  name: "",
  age: "",
  height: "",
  region: REGIONS[0],
  religiousLevel: RELIGIOUS_LEVELS[0],
  education: EDUCATION_OPTIONS[0],
  yeshivaLevel: YESHIVA_LEVELS[0],
  smoking: SMOKING_OPTIONS[0],
  phone: "",
  bio: "",
};

export default function AddCandidatePage() {
  const router = useRouter();
  const role = useCrmStore((s) => s.role);
  const addCandidate = useCrmStore((s) => s.addCandidate);
  const [form, setForm] = useState(EMPTY_FORM);
  const [traits, setTraits] = useState([]);

  if (role === "viewer") {
    return <p className="px-4 py-10 text-center text-sm text-[#8A8285]">אזור זה זמין לצוות בלבד</p>;
  }

  const set = (partial) => setForm((f) => ({ ...f, ...partial }));
  const toggleTrait = (t) => setTraits((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

  const canSubmit = form.name.trim() && form.age && form.height && form.phone.trim();

  const handleSubmit = () => {
    if (!canSubmit) return;
    const candidate = addCandidate({
      gender: form.gender,
      name: form.name.trim(),
      age: Number(form.age),
      height: Number(form.height),
      region: form.region,
      religiousLevel: form.religiousLevel,
      education: form.education,
      yeshivaLevel: form.gender === "male" ? form.yeshivaLevel : undefined,
      smoking: form.smoking,
      phone: form.phone.trim(),
      bio: form.bio.trim(),
      traits,
    });
    setForm(EMPTY_FORM);
    setTraits([]);
    router.push(`/crm?added=${candidate.id}`);
  };

  return (
    <div className="px-4 py-6">
      <h1 className="flex items-center gap-2 text-xl font-bold text-[#3A3335]">
        <UserPlus size={22} /> העלאת מועמד/ת חדש/ה
      </h1>
      <p className="mt-1 text-[13px] text-[#8A8285]">כל חברי הצוות יכולים להוסיף מועמדים למאגר</p>

      <div className="mt-4 space-y-4">
        <div>
          <p className="mb-1.5 text-[12px] font-semibold text-[#3A3335]">מגדר</p>
          <div className="flex gap-2">
            {[
              { key: "male", label: "בחור" },
              { key: "female", label: "בחורה" },
            ].map((g) => (
              <button
                key={g.key}
                onClick={() => set({ gender: g.key })}
                className={`flex-1 rounded-2xl border px-3.5 py-2.5 text-sm font-semibold transition ${
                  form.gender === g.key
                    ? "border-[#8C4A55] bg-[#8C4A55] text-white"
                    : "border-[#EAE5E3] bg-white text-[#3A3335]"
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        <Field label="שם מלא">
          <input
            type="text"
            value={form.name}
            onChange={(e) => set({ name: e.target.value })}
            placeholder="לדוגמה: דוד ישראלי"
            className="input-crm"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="גיל">
            <input type="number" value={form.age} onChange={(e) => set({ age: e.target.value })} className="input-crm" />
          </Field>
          <Field label="גובה (ס״מ)">
            <input type="number" value={form.height} onChange={(e) => set({ height: e.target.value })} className="input-crm" />
          </Field>
        </div>

        <Field label="טלפון">
          <input
            type="tel"
            dir="ltr"
            value={form.phone}
            onChange={(e) => set({ phone: e.target.value })}
            placeholder="050-1234567"
            className="input-crm"
          />
        </Field>

        <Field label="אזור מגורים">
          <select value={form.region} onChange={(e) => set({ region: e.target.value })} className="input-crm">
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </Field>

        <Field label="רמת תורניות">
          <select value={form.religiousLevel} onChange={(e) => set({ religiousLevel: e.target.value })} className="input-crm">
            {RELIGIOUS_LEVELS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </Field>

        {form.gender === "male" ? (
          <Field label="רמת לימוד">
            <select value={form.yeshivaLevel} onChange={(e) => set({ yeshivaLevel: e.target.value })} className="input-crm">
              {YESHIVA_LEVELS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </Field>
        ) : (
          <Field label="השכלה / עיסוק">
            <select value={form.education} onChange={(e) => set({ education: e.target.value })} className="input-crm">
              {EDUCATION_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </Field>
        )}

        <Field label="עישון">
          <select value={form.smoking} onChange={(e) => set({ smoking: e.target.value })} className="input-crm">
            {SMOKING_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>

        <div>
          <p className="mb-1.5 text-[12px] font-semibold text-[#3A3335]">תכונות</p>
          <div className="flex flex-wrap gap-2">
            {TRAITS.map((t) => (
              <button
                key={t}
                onClick={() => toggleTrait(t)}
                className={`rounded-full border px-3 py-1.5 text-[12px] font-semibold transition ${
                  traits.includes(t) ? "border-[#8C4A55] bg-[#8C4A55] text-white" : "border-[#EAE5E3] bg-white text-[#3A3335]"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <Field label="תיאור חופשי">
          <textarea
            value={form.bio}
            onChange={(e) => set({ bio: e.target.value })}
            rows={4}
            placeholder="כמה מילים על האופי, הרקע והציפיות..."
            className="input-crm resize-none"
          />
        </Field>

        <Button variant="primary" className="w-full" disabled={!canSubmit} onClick={handleSubmit}>
          <UserPlus size={16} /> הוספה למאגר
        </Button>
      </div>

      <style jsx global>{`
        .input-crm {
          width: 100%;
          border-radius: 1rem;
          border: 1px solid #eae5e3;
          background: white;
          padding: 0.625rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
        }
        .input-crm:focus {
          border-color: #8c4a55;
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <p className="mb-1.5 text-[12px] font-semibold text-[#3A3335]">{label}</p>
      {children}
    </div>
  );
}
