"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Save, ImagePlus, X, FileText, Music } from "lucide-react";
import { useCrmStore, AVAILABILITY_STATUSES } from "@/lib/crm/store";
import { REGIONS, religiousLevelsFor, EDUCATION_OPTIONS, YESHIVA_LEVELS, smokingOptionsFor, TRAITS, CANDIDATE_TAGS } from "@/lib/crm/mockData";
import { compressImage } from "@/lib/crm/compressImage";
import Button from "@/components/crm/ui/Button";

const MAX_PHOTOS = 4;
const MAX_PDF_SIZE = 350 * 1024;
const MAX_AUDIO_SIZE = 400 * 1024;

function EditCandidateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const role = useCrmStore((s) => s.role);
  const findCandidateById = useCrmStore((s) => s.findCandidateById);
  const updateCandidate = useCrmStore((s) => s.updateCandidate);
  const setCandidateAvailability = useCrmStore((s) => s.setCandidateAvailability);
  const showToast = useCrmStore((s) => s.showToast);

  const [loaded, setLoaded] = useState(false);
  const [form, setForm] = useState(null);
  const [traits, setTraits] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [photoError, setPhotoError] = useState("");
  const [pdfFile, setPdfFile] = useState(null);
  const [existingPdfUrl, setExistingPdfUrl] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [existingAudioUrl, setExistingAudioUrl] = useState(null);
  const [mediaError, setMediaError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id || loaded) return;
    const c = findCandidateById(id);
    if (!c) return;
    setForm({
      gender: c.gender,
      name: c.name || "",
      age: String(c.age ?? ""),
      height: String(c.height ?? ""),
      eda: c.eda || "",
      region: c.region,
      city: c.city || "",
      religiousLevel: c.religiousLevel,
      education: c.education,
      yeshivaLevel: c.yeshivaLevel || YESHIVA_LEVELS[0],
      smoking: c.smoking,
      tag: c.tag || "",
      phone: c.phone || "",
      bio: c.bio || "",
      availabilityStatus: c.availabilityStatus || AVAILABILITY_STATUSES[0],
      complexityNotes: c.complexityNotes || "",
      referenceContacts: c.referenceContacts || "",
      confidential: c.confidential || false,
    });
    setTraits(c.traits || []);
    setPhotos(c.photoUrls?.length > 0 ? c.photoUrls : c.photoUrl ? [c.photoUrl] : []);
    setExistingPdfUrl(c.pdfUrl || null);
    setExistingAudioUrl(c.introAudioUrl || null);
    setLoaded(true);
  }, [id, loaded, findCandidateById]);

  if (role !== "admin") {
    return <p className="px-4 py-10 text-center text-sm text-[#7A6A55]">אזור זה זמין למנהלת בלבד</p>;
  }

  if (!id) {
    return <p className="px-4 py-10 text-center text-sm text-[#7A6A55]">לא נבחר מועמד/ת לעריכה</p>;
  }

  if (!loaded || !form) {
    return <p className="px-4 py-10 text-center text-sm text-[#7A6A55]">טוען פרטי כרטיס...</p>;
  }

  const set = (partial) => setForm((f) => ({ ...f, ...partial }));
  const toggleTrait = (t) => setTraits((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));
  const setGender = (gender) =>
    setForm((f) => ({ ...f, gender, religiousLevel: religiousLevelsFor(gender)[0], smoking: smokingOptionsFor(gender)[0] }));

  const handlePhotoChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const invalid = files.some((f) => !f.type.startsWith("image/"));
    if (invalid) {
      setPhotoError("יש לבחור קובצי תמונה בלבד");
      return;
    }
    if (photos.length + files.length > MAX_PHOTOS) {
      setPhotoError(`אפשר להעלות עד ${MAX_PHOTOS} תמונות לכרטיס`);
      return;
    }
    setPhotoError("");
    e.target.value = "";
    for (const file of files) {
      try {
        const compressed = await compressImage(file);
        setPhotos((cur) => [...cur, compressed]);
      } catch {
        setPhotoError("העלאת אחת התמונות נכשלה, נסי שוב");
      }
    }
  };

  const removePhoto = (index) => setPhotos((cur) => cur.filter((_, i) => i !== index));

  const handlePdfChange = (e) => {
    const file = e.target.files?.[0] || null;
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_PDF_SIZE) {
      setMediaError(`קובץ ה-PDF גדול מדי (מקסימום ${Math.round(MAX_PDF_SIZE / 1024)}KB)`);
      return;
    }
    setMediaError("");
    setPdfFile(file);
  };

  const handleAudioChange = (e) => {
    const file = e.target.files?.[0] || null;
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_AUDIO_SIZE) {
      setMediaError(`הקובץ גדול מדי (מקסימום ${Math.round(MAX_AUDIO_SIZE / 1024)}KB)`);
      return;
    }
    setMediaError("");
    setAudioFile(file);
  };

  const readAsDataUrl = (file) =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });

  const canSubmit = form.name.trim() && form.age && form.height && form.phone.trim() && photos.length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitError("");
    setSubmitting(true);
    try {
      const pdfUrl = pdfFile ? await readAsDataUrl(pdfFile) : existingPdfUrl;
      const introAudioUrl = audioFile ? await readAsDataUrl(audioFile) : existingAudioUrl;
      await updateCandidate(id, {
        gender: form.gender,
        name: form.name.trim(),
        age: Number(form.age),
        height: Number(form.height),
        eda: form.eda.trim(),
        region: form.region,
        city: form.city.trim(),
        religiousLevel: form.religiousLevel,
        education: form.education,
        yeshivaLevel: form.gender === "male" ? form.yeshivaLevel : null,
        smoking: form.smoking,
        tag: form.tag || null,
        phone: form.phone.trim(),
        bio: form.bio.trim(),
        traits,
        photoUrl: photos[0],
        photoUrls: photos,
        complexityNotes: form.complexityNotes.trim(),
        referenceContacts: form.referenceContacts.trim(),
        confidential: !!form.confidential,
        pdfUrl,
        introAudioUrl,
      });
      await setCandidateAvailability(id, form.availabilityStatus);
      showToast("הכרטיס עודכן בהצלחה");
      router.push(`/crm?edited=${id}`);
    } catch (err) {
      console.error("שגיאת עדכון מועמד/ת:", err);
      setSubmitError(`השמירה נכשלה. שגיאה טכנית (לשליחה אליי): ${err?.code || ""} ${err?.message || String(err)}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="px-4 py-6">
      <h1 className="flex items-center gap-2 text-xl font-bold text-[#2E2116]">
        <Save size={22} /> עריכת פרטי הכרטיס
      </h1>
      <p className="mt-1 text-[13px] text-[#7A6A55]">כל שינוי יעודכן על הכרטיס הקיים - לא ייווצר כרטיס חדש</p>

      <div className="mt-4 space-y-4">
        <div>
          <p className="mb-1.5 text-[12px] font-semibold text-[#2E2116]">מגדר</p>
          <div className="flex gap-2">
            {[
              { key: "male", label: "בחור" },
              { key: "female", label: "בחורה" },
            ].map((g) => (
              <button
                key={g.key}
                onClick={() => setGender(g.key)}
                className={`flex-1 rounded-2xl border px-3.5 py-2.5 text-sm font-semibold transition ${
                  form.gender === g.key
                    ? "border-[#5B3418] bg-[#5B3418] text-white"
                    : "border-[#D9C6A5] bg-white text-[#2E2116]"
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-[12px] font-semibold text-[#2E2116]">תמונות * (עד {MAX_PHOTOS})</p>
          <div className="flex flex-wrap gap-2.5">
            {photos.map((p, i) => (
              <div key={i} className="relative h-32 w-28 shrink-0 overflow-hidden rounded-2xl border border-[#D9C6A5]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p} alt="תצוגה מקדימה" className="h-full w-full object-cover" />
                {i === 0 && (
                  <span className="absolute bottom-1 right-1 rounded-full bg-[#5B3418] px-1.5 py-0.5 text-[9px] font-bold text-white">
                    ראשית
                  </span>
                )}
                <button
                  onClick={() => removePhoto(i)}
                  aria-label="הסרת תמונה"
                  className="absolute left-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 shadow"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            {photos.length < MAX_PHOTOS && (
              <label className="flex h-32 w-28 shrink-0 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-[#D9C6A5] bg-white text-[#A08D74] transition hover:border-[#5B3418] hover:text-[#5B3418]">
                <ImagePlus size={22} />
                <span className="text-[11px] font-semibold">הוספת תמונה</span>
                <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              </label>
            )}
          </div>
          {photoError && <p className="mt-1 text-[11px] text-red-500">{photoError}</p>}
        </div>

        <Field label="שם מלא">
          <input type="text" value={form.name} onChange={(e) => set({ name: e.target.value })} className="input-crm" />
        </Field>

        <div className="grid grid-cols-3 gap-3">
          <Field label="גיל">
            <input type="number" value={form.age} onChange={(e) => set({ age: e.target.value })} className="input-crm" />
          </Field>
          <Field label="גובה (ס״מ)">
            <input type="number" value={form.height} onChange={(e) => set({ height: e.target.value })} className="input-crm" />
          </Field>
          <Field label="עדה">
            <input
              type="text"
              value={form.eda}
              onChange={(e) => set({ eda: e.target.value })}
              placeholder="תימני, אשכנזי..."
              className="input-crm"
            />
          </Field>
        </div>

        <Field label="טלפון">
          <input type="tel" dir="ltr" value={form.phone} onChange={(e) => set({ phone: e.target.value })} className="input-crm" />
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

        <Field label="מקום מגורים (עיר/יישוב)">
          <input
            type="text"
            value={form.city}
            onChange={(e) => set({ city: e.target.value })}
            placeholder="לדוגמה: בית שמש"
            className="input-crm"
          />
        </Field>

        <Field label="רמת תורניות">
          <select value={form.religiousLevel} onChange={(e) => set({ religiousLevel: e.target.value })} className="input-crm">
            {religiousLevelsFor(form.gender).map((r) => (
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
            {smokingOptionsFor(form.gender).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>

        <Field label="תווית (רשות)">
          <select value={form.tag} onChange={(e) => set({ tag: e.target.value })} className="input-crm">
            <option value="">ללא תווית</option>
            {CANDIDATE_TAGS.map((t) => (
              <option key={t.name} value={t.name}>
                {t.name}
              </option>
            ))}
          </select>
        </Field>

        <div>
          <p className="mb-1.5 text-[12px] font-semibold text-[#2E2116]">תכונות</p>
          <div className="flex flex-wrap gap-2">
            {TRAITS.map((t) => (
              <button
                key={t}
                onClick={() => toggleTrait(t)}
                className={`rounded-full border px-3 py-1.5 text-[12px] font-semibold transition ${
                  traits.includes(t) ? "border-[#5B3418] bg-[#5B3418] text-white" : "border-[#D9C6A5] bg-white text-[#2E2116]"
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
            className="input-crm resize-none"
          />
        </Field>

        <Field label="מספרים לבירורים">
          <textarea
            value={form.referenceContacts}
            onChange={(e) => set({ referenceContacts: e.target.value })}
            rows={3}
            placeholder="שמות ומספרי טלפון של אנשי קשר לבירור..."
            className="input-crm resize-none"
          />
        </Field>

        <label className="flex items-center gap-2.5 rounded-2xl border-2 border-[#C24545] bg-red-50 px-4 py-3">
          <input
            type="checkbox"
            checked={form.confidential}
            onChange={(e) => set({ confidential: e.target.checked })}
            className="h-5 w-5 shrink-0 accent-[#C24545]"
          />
          <span className="text-[13px] font-bold text-[#C24545]">כרטיס חסוי (גלוי למנהלת בלבד)</span>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <Field label="כרטיס יבש (PDF)">
            {existingPdfUrl && !pdfFile && (
              <a href={existingPdfUrl} target="_blank" rel="noopener noreferrer" className="mb-1.5 block truncate text-[11px] font-semibold text-[#5B3418]">
                צפייה בקובץ הקיים
              </a>
            )}
            <label className="flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-[#D9C6A5] bg-white text-[12px] font-semibold text-[#5B3418]">
              <FileText size={15} />
              {pdfFile ? pdfFile.name : existingPdfUrl ? "החלפת קובץ" : "העלאת PDF"}
              <input type="file" accept="application/pdf" onChange={handlePdfChange} className="hidden" />
            </label>
          </Field>
          <Field label="הקלטת היכרות">
            {existingAudioUrl && !audioFile && (
              <audio controls src={existingAudioUrl} className="mb-1.5 h-8 w-full" />
            )}
            <label className="flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-[#D9C6A5] bg-white text-[12px] font-semibold text-[#5B3418]">
              <Music size={15} />
              {audioFile ? audioFile.name : existingAudioUrl ? "החלפת הקלטה" : "העלאת אודיו"}
              <input type="file" accept="audio/*" onChange={handleAudioChange} className="hidden" />
            </label>
          </Field>
        </div>
        {mediaError && <p className="text-[11px] text-red-500">{mediaError}</p>}

        {submitError && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-[12px] font-semibold text-red-600">{submitError}</p>
        )}
        <Button variant="primary" className="w-full" disabled={!canSubmit} onClick={handleSubmit}>
          <Save size={16} /> {submitting ? "שומרת..." : "שמירת השינויים"}
        </Button>
      </div>

      <style jsx global>{`
        .input-crm {
          width: 100%;
          border-radius: 1rem;
          border: 1px solid #D9C6A5;
          background: white;
          padding: 0.625rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
        }
        .input-crm:focus {
          border-color: #5B3418;
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <p className="mb-1.5 text-[12px] font-semibold text-[#2E2116]">{label}</p>
      {children}
    </div>
  );
}

export default function EditCandidatePage() {
  return (
    <Suspense fallback={null}>
      <EditCandidateForm />
    </Suspense>
  );
}
