"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, ImagePlus, X, FileText, Music } from "lucide-react";
import { useCrmStore, AVAILABILITY_STATUSES } from "@/lib/crm/store";
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
  availabilityStatus: AVAILABILITY_STATUSES[0],
  complexityNotes: "",
};

export default function AddCandidatePage() {
  const router = useRouter();
  const role = useCrmStore((s) => s.role);
  const addCandidate = useCrmStore((s) => s.addCandidate);
  const [form, setForm] = useState(EMPTY_FORM);
  const [traits, setTraits] = useState([]);
  const [photo, setPhoto] = useState(null);
  const [photoError, setPhotoError] = useState("");
  const [pdfFile, setPdfFile] = useState(null);
  const [audioFile, setAudioFile] = useState(null);

  if (role !== "staff" && role !== "admin") {
    return <p className="px-4 py-10 text-center text-sm text-[#8A8285]">אזור זה זמין לצוות בלבד</p>;
  }

  const set = (partial) => setForm((f) => ({ ...f, ...partial }));
  const toggleTrait = (t) => setTraits((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setPhotoError("יש לבחור קובץ תמונה");
      return;
    }
    setPhotoError("");
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result);
    reader.readAsDataURL(file);
  };

  const readAsDataUrl = (file) =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });

  const canSubmit = form.name.trim() && form.age && form.height && form.phone.trim() && photo;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    const pdfUrl = pdfFile ? await readAsDataUrl(pdfFile) : null;
    const introAudioUrl = audioFile ? await readAsDataUrl(audioFile) : null;
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
      photoUrl: photo,
      availabilityStatus: form.availabilityStatus,
      complexityNotes: form.complexityNotes.trim(),
      pdfUrl,
      introAudioUrl,
    });
    setForm(EMPTY_FORM);
    setTraits([]);
    setPhoto(null);
    setPdfFile(null);
    setAudioFile(null);
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

        <div>
          <p className="mb-1.5 text-[12px] font-semibold text-[#3A3335]">תמונה *</p>
          {photo ? (
            <div className="relative h-40 w-32 overflow-hidden rounded-2xl border border-[#EAE5E3]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo} alt="תצוגה מקדימה" className="h-full w-full object-cover" />
              <button
                onClick={() => setPhoto(null)}
                aria-label="הסרת תמונה"
                className="absolute left-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <label className="flex h-40 w-32 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-[#EAE5E3] bg-white text-[#B5AEB0] transition hover:border-[#8C4A55] hover:text-[#8C4A55]">
              <ImagePlus size={24} />
              <span className="text-[11px] font-semibold">העלאת תמונה</span>
              <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
            </label>
          )}
          {photoError && <p className="mt-1 text-[11px] text-red-500">{photoError}</p>}
          <p className="mt-1 text-[11px] text-[#B5AEB0]">שדה חובה</p>
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

        <Field label="סטטוס פניות">
          <select value={form.availabilityStatus} onChange={(e) => set({ availabilityStatus: e.target.value })} className="input-crm">
            {AVAILABILITY_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>

        <Field label="מורכבויות וייחודיות (פנימי)">
          <textarea
            value={form.complexityNotes}
            onChange={(e) => set({ complexityNotes: e.target.value })}
            rows={3}
            placeholder="מה מיוחד או מורכב אצל המועמד/ת - לשימוש פנימי בלבד..."
            className="input-crm resize-none"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="כרטיס יבש (PDF)">
            <label className="flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-[#EAE5E3] bg-white text-[12px] font-semibold text-[#8C4A55]">
              <FileText size={15} />
              {pdfFile ? pdfFile.name : "העלאת PDF"}
              <input type="file" accept="application/pdf" onChange={(e) => setPdfFile(e.target.files?.[0] || null)} className="hidden" />
            </label>
          </Field>
          <Field label="הקלטת היכרות">
            <label className="flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-[#EAE5E3] bg-white text-[12px] font-semibold text-[#8C4A55]">
              <Music size={15} />
              {audioFile ? audioFile.name : "העלאת אודיו"}
              <input type="file" accept="audio/*" onChange={(e) => setAudioFile(e.target.files?.[0] || null)} className="hidden" />
            </label>
          </Field>
        </div>

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
