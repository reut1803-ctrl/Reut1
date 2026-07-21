"use client";

import { useState } from "react";
import { ImagePlus } from "lucide-react";
import Sheet from "@/components/ui/Sheet";
import Chip from "@/components/ui/Chip";
import { useAuth } from "@/lib/supabase/AuthProvider";
import { uploadCandidatePhoto, insertCandidate } from "@/lib/queries";
import { REGIONS, RELIGIOUS_LEVELS } from "@/lib/data";
import { TRAIT_OPTIONS, SMOKING_OPTIONS } from "@/lib/wizardOptions";

const EMPTY = {
  name: "",
  age: "",
  height: "",
  region: REGIONS[0],
  religiousLevel: RELIGIOUS_LEVELS[0],
  study: "",
  smoking: SMOKING_OPTIONS[1],
  traits: [],
  about: "",
};

export default function AddCandidateSheet({ open, onClose, gender, onCreated }) {
  const { supabase } = useAuth();
  const [form, setForm] = useState(EMPTY);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const toggleTrait = (trait) => {
    const has = form.traits.includes(trait);
    if (!has && form.traits.length >= 3) return;
    set("traits", has ? form.traits.filter((t) => t !== trait) : [...form.traits, trait]);
  };

  const pickPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const submit = async () => {
    setError("");
    if (!form.name || !form.age || !form.height) {
      setError("שם, גיל וגובה הם שדות חובה");
      return;
    }
    setSaving(true);
    try {
      let image = null;
      if (photoFile) image = await uploadCandidatePhoto(supabase, photoFile);
      const candidate = await insertCandidate(supabase, {
        ...form,
        gender,
        age: Number(form.age),
        height: Number(form.height),
        image,
      });
      onCreated?.(candidate);
      setForm(EMPTY);
      setPhotoFile(null);
      setPhotoPreview(null);
      onClose();
    } catch (e) {
      setError("משהו השתבש, נסי שוב");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title="הוספת מועמד/ת חדש/ה" maxHeight="92vh">
      <div className="flex flex-col gap-5">
        <label className="flex aspect-[4/3] w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-pink-200 bg-pink-50">
          {photoPreview ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={photoPreview} alt="תצוגה מקדימה" className="h-full w-full object-cover" />
          ) : (
            <span className="flex flex-col items-center gap-2 text-muted">
              <ImagePlus size={26} />
              <span className="text-xs">להעלאת תמונה</span>
            </span>
          )}
          <input type="file" accept="image/*" onChange={pickPhoto} className="hidden" />
        </label>

        <TextField label="שם" value={form.name} onChange={(v) => set("name", v)} />

        <div className="grid grid-cols-2 gap-3">
          <TextField label="גיל" type="number" value={form.age} onChange={(v) => set("age", v)} />
          <TextField label='גובה (ס"מ)' type="number" value={form.height} onChange={(v) => set("height", v)} />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-ink">אזור</label>
          <div className="flex flex-wrap gap-2">
            {REGIONS.map((r) => (
              <Chip key={r} label={r} selected={form.region === r} onClick={() => set("region", r)} />
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-ink">רמת תורניות</label>
          <div className="flex flex-wrap gap-2">
            {RELIGIOUS_LEVELS.map((r) => (
              <Chip key={r} label={r} selected={form.religiousLevel === r} onClick={() => set("religiousLevel", r)} />
            ))}
          </div>
        </div>

        <TextField label="לימודים / תעסוקה" value={form.study} onChange={(v) => set("study", v)} />

        <div>
          <label className="mb-2 block text-sm font-semibold text-ink">עישון</label>
          <div className="flex flex-wrap gap-2">
            {SMOKING_OPTIONS.map((s) => (
              <Chip key={s} label={s} selected={form.smoking === s} onClick={() => set("smoking", s)} />
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-ink">תכונות בולטות (עד 3)</label>
          <div className="flex flex-wrap gap-2">
            {TRAIT_OPTIONS.map((t) => (
              <Chip
                key={t}
                label={t}
                selected={form.traits.includes(t)}
                disabled={!form.traits.includes(t) && form.traits.length >= 3}
                onClick={() => toggleTrait(t)}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-ink">קצת עליו/ה</label>
          <textarea
            value={form.about}
            onChange={(e) => set("about", e.target.value)}
            rows={3}
            className="w-full rounded-2xl border border-black/10 bg-white p-3 text-sm outline-none focus:border-pink-400"
          />
        </div>

        {error && <p className="text-center text-sm text-red-600">{error}</p>}

        <button onClick={submit} disabled={saving} className="btn-pink w-full">
          {saving ? "שומרת..." : "הוספה למאגר"}
        </button>
      </div>
    </Sheet>
  );
}

function TextField({ label, value, onChange, type = "text" }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-ink">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-black/10 bg-white p-3 text-sm outline-none focus:border-pink-400"
      />
    </div>
  );
}
