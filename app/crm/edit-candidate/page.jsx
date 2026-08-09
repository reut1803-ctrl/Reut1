"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Save, ImagePlus, X, FileText, Music, Trash2 } from "lucide-react";
import { useCrmStore, AVAILABILITY_STATUSES } from "@/lib/crm/store";
import { REGIONS, religiousLevelsFor, EDUCATION_OPTIONS, YESHIVA_LEVELS, OCCUPATION_OPTIONS, smokingOptionsFor, TRAITS, CANDIDATE_TAGS, normalizeTagName, candidateOccupations } from "@/lib/crm/mockData";
import { uploadToCloudinary } from "@/lib/crm/cloudinary";
import { saveMedia } from "@/lib/crm/mediaStore";
import { useMediaUrl } from "@/lib/crm/useMediaUrl";
import { compressImage } from "@/lib/crm/compressImage";
import Button from "@/components/crm/ui/Button";

const MAX_PHOTOS = 4;

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
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [introAudioUrl, setIntroAudioUrl] = useState(null);
  const [audioUploading, setAudioUploading] = useState(false);
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
      occupations: candidateOccupations(c),
      smoking: c.smoking,
      tag: normalizeTagName(c.tag) || "",
      phone: c.phone || "",
      bio: c.bio || "",
      availabilityStatus: c.availabilityStatus || AVAILABILITY_STATUSES[0],
      complexityNotes: c.complexityNotes || "",
      referenceContacts: c.referenceContacts || "",
      confidential: c.confidential || false,
    });
    setTraits(c.traits || []);
    setPhotos(c.photoUrls?.length > 0 ? c.photoUrls : c.photoUrl ? [c.photoUrl] : []);
    setPdfUrl(c.pdfUrl || null);
    setIntroAudioUrl(c.introAudioUrl || null);
    setLoaded(true);
  }, [id, loaded, findCandidateById]);

  if (role !== "admin") {
    return <p className="px-4 py-10 text-center text-sm text-[#8A8285]">אזור זה זמין למנהלת בלבד</p>;
  }

  if (!id) {
    return <p className="px-4 py-10 text-center text-sm text-[#8A8285]">לא נבחר מועמד/ת לעריכה</p>;
  }

  if (!loaded || !form) {
    return <p className="px-4 py-10 text-center text-sm text-[#8A8285]">טוען פרטי כרטיס...</p>;
  }

  const set = (partial) => setForm((f) => ({ ...f, ...partial }));
  const toggleOccupation = (o) =>
    setForm((f) => {
      const cur = f.occupations || [];
      return { ...f, occupations: cur.includes(o) ? cur.filter((x) => x !== o) : [...cur, o] };
    });
  const toggleTrait = (t) => setTraits((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));
  const setGender = (gender) =>
    setForm((f) => ({ ...f, gender, religiousLevel: religiousLevelsFor(gender)[0], smoking: smokingOptionsFor(gender)[0] }));

  // אפשר לבחור כמה תמונות בבת אחת. כל תמונה מועלית בנפרד, וכישלון של אחת
  // אינו מבטל את השאר - מוצג בדיוק מה נכשל ומה עלה בהצלחה.
  const handlePhotoChange = async (e) => {
    const chosen = [...(e.target.files || [])];
    e.target.value = "";
    if (chosen.length === 0) return;

    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) {
      setPhotoError(`אפשר להעלות עד ${MAX_PHOTOS} תמונות לכרטיס`);
      return;
    }

    const images = chosen.filter((f) => f.type.startsWith("image/"));
    if (images.length === 0) {
      setPhotoError("יש לבחור קובץ תמונה בלבד");
      return;
    }

    const batch = images.slice(0, room);
    const skipped = images.length - batch.length;
    setPhotoError("");
    setPhotoUploading(true);
    const failures = [];

    for (const file of batch) {
      try {
        const compressed = await compressImage(file, { maxDimension: 1200, quality: 0.8 });
        const blob = await (await fetch(compressed)).blob();
        const url = await uploadToCloudinary(blob);
        setPhotos((cur) => (cur.length >= MAX_PHOTOS ? cur : [...cur, url]));
      } catch (err) {
        failures.push(`${file.name}: ${err?.message || String(err)}`);
      }
    }

    setPhotoUploading(false);
    const notes = [];
    if (failures.length > 0) notes.push(`העלאה נכשלה עבור ${failures.join(" | ")}`);
    if (skipped > 0) notes.push(`${skipped} תמונות לא נוספו כי הגעת למקסימום ${MAX_PHOTOS}`);
    setPhotoError(notes.join(". "));
  };

  const removePhoto = (index) => setPhotos((cur) => cur.filter((_, i) => i !== index));

  const handlePdfChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setMediaError("");
    setPdfUploading(true);
    setUploadStatus("");
    try {
      const ref = await saveMedia(file, setUploadStatus);
      setPdfUrl(ref);
    } catch (err) {
      setMediaError(`העלאת קובץ ה-PDF נכשלה: ${err?.message || String(err)}`);
    } finally {
      setPdfUploading(false);
    }
  };

  const handleAudioChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setMediaError("");
    setAudioUploading(true);
    setUploadStatus("");
    try {
      const ref = await saveMedia(file, setUploadStatus);
      setIntroAudioUrl(ref);
    } catch (err) {
      setMediaError(`העלאת הקלטת ההיכרות נכשלה: ${err?.message || String(err)}`);
    } finally {
      setAudioUploading(false);
    }
  };

  const canSubmit =
    form.name.trim() &&
    form.age &&
    form.height &&
    form.phone.trim() &&
    photos.length > 0 &&
    !submitting &&
    !photoUploading &&
    !pdfUploading &&
    !audioUploading;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitError("");
    setSubmitting(true);
    try {
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
        occupations: form.occupations || [],
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
      <h1 className="flex items-center gap-2 text-xl font-bold text-[#3A3335]">
        <Save size={22} /> עריכת פרטי הכרטיס
      </h1>
      <p className="mt-1 text-[13px] text-[#8A8285]">כל שינוי יעודכן על הכרטיס הקיים - לא ייווצר כרטיס חדש</p>

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
                onClick={() => setGender(g.key)}
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
          <p className="mb-1.5 text-[12px] font-semibold text-[#3A3335]">תמונות * (עד {MAX_PHOTOS})</p>
          <div className="flex flex-wrap gap-2.5">
            {photos.map((p, i) => (
              <div key={i} className="relative h-32 w-28 shrink-0 overflow-hidden rounded-2xl border border-[#EAE5E3]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p} alt="תצוגה מקדימה" className="h-full w-full object-cover" />
                {i === 0 && (
                  <span className="absolute bottom-1 right-1 rounded-full bg-[#8C4A55] px-1.5 py-0.5 text-[9px] font-bold text-white">
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
            {photoUploading && (
              <div className="flex h-32 w-28 shrink-0 flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-[#EAE5E3] bg-white text-[#B5AEB0]">
                <span className="text-[11px] font-semibold">מעלה תמונה...</span>
              </div>
            )}
            {photos.length < MAX_PHOTOS && !photoUploading && (
              // הקלט מוסתר חזותית אך נשאר קיים בעמוד. עם display:none חלק מדפדפני
              // הנייד לא פותחים כלל את בוחר הקבצים בלחיצה על המסגרת.
              <label className="relative flex h-32 w-28 shrink-0 cursor-pointer flex-col items-center justify-center gap-1.5 overflow-hidden rounded-2xl border-2 border-dashed border-[#EAE5E3] bg-white text-[#B5AEB0] transition hover:border-[#8C4A55] hover:text-[#8C4A55]">
                <ImagePlus size={22} />
                <span className="text-[11px] font-semibold">הוספת תמונה</span>
                <span className="text-[10px]">
                  {photos.length}/{MAX_PHOTOS}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoChange}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
              </label>
            )}
          </div>
          {photoError && <p className="mt-1 text-[11px] text-red-500">{photoError}</p>}
          <p className="mt-1 text-[11px] text-[#B5AEB0]">אפשר לבחור כמה תמונות יחד. התמונה הראשונה היא הראשית.</p>
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

        <div>
          <p className="mb-1.5 text-[12px] font-semibold text-[#3A3335]">עיסוק (אפשר לסמן כמה)</p>
          <div className="flex flex-wrap gap-2">
            {OCCUPATION_OPTIONS.map((o) => {
              const active = form.occupations?.includes(o);
              return (
                <button
                  key={o}
                  type="button"
                  onClick={() => toggleOccupation(o)}
                  className={`rounded-full border px-3 py-1.5 text-[12px] font-semibold transition active:scale-95 ${
                    active ? "border-transparent bg-[#8C4A55] text-white" : "border-[#EAE5E3] bg-white text-[#3A3335]"
                  }`}
                >
                  {o}
                </button>
              );
            })}
          </div>
        </div>

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
            {pdfUrl ? (
              <div className="space-y-1.5">
                <MediaFileLink value={pdfUrl} />
                <div className="flex gap-1.5">
                  <label className="flex h-9 flex-1 cursor-pointer items-center justify-center gap-1 rounded-xl border border-[#EAE5E3] bg-white text-[11px] font-semibold text-[#8C4A55]">
                    <FileText size={13} />
                    {pdfUploading ? uploadStatus || "מעלה..." : "החלפת קובץ"}
                    <input type="file" accept="application/pdf" onChange={handlePdfChange} disabled={pdfUploading} className="hidden" />
                  </label>
                  <button
                    onClick={() => setPdfUrl(null)}
                    className="flex h-9 items-center justify-center gap-1 rounded-xl border border-red-200 bg-red-50 px-2.5 text-[11px] font-semibold text-[#C24545]"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex h-11 w-full cursor-pointer items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-[#EAE5E3] bg-white text-[12px] font-semibold text-[#8C4A55]">
                <FileText size={15} />
                {pdfUploading ? uploadStatus || "מעלה..." : "העלאת PDF"}
                <input type="file" accept="application/pdf" onChange={handlePdfChange} disabled={pdfUploading} className="hidden" />
              </label>
            )}
          </Field>
          <Field label="הקלטת היכרות">
            {introAudioUrl ? (
              <div className="space-y-1.5">
                <MediaAudio value={introAudioUrl} />
                <div className="flex gap-1.5">
                  <label className="flex h-9 flex-1 cursor-pointer items-center justify-center gap-1 rounded-xl border border-[#EAE5E3] bg-white text-[11px] font-semibold text-[#8C4A55]">
                    <Music size={13} />
                    {audioUploading ? uploadStatus || "מעלה..." : "החלפת הקלטה"}
                    <input type="file" accept="audio/*" onChange={handleAudioChange} disabled={audioUploading} className="hidden" />
                  </label>
                  <button
                    onClick={() => setIntroAudioUrl(null)}
                    aria-label="מחיקת הקלטה"
                    className="flex h-9 items-center justify-center gap-1 rounded-xl border border-red-200 bg-red-50 px-2.5 text-[11px] font-semibold text-[#C24545]"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex h-11 w-full cursor-pointer items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-[#EAE5E3] bg-white text-[12px] font-semibold text-[#8C4A55]">
                <Music size={15} />
                {audioUploading ? uploadStatus || "מעלה..." : "העלאת אודיו"}
                <input type="file" accept="audio/*" onChange={handleAudioChange} disabled={audioUploading} className="hidden" />
              </label>
            )}
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

// מציגים נגן/קישור גם עבור מדיה שנשמרה בחלקים ב-Firestore וגם עבור כתובת רגילה
function MediaAudio({ value }) {
  const { url, error, loading } = useMediaUrl(value);
  if (loading) return <p className="text-[11px] text-[#8A8285]">טוען הקלטה...</p>;
  if (error) return <p className="text-[11px] text-red-500">{error}</p>;
  return <audio controls src={url} className="h-8 w-full" />;
}

function MediaFileLink({ value }) {
  const { url, error, loading } = useMediaUrl(value);
  if (loading) return <p className="text-[11px] text-[#8A8285]">טוען קובץ...</p>;
  if (error) return <p className="text-[11px] text-red-500">{error}</p>;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block truncate rounded-2xl bg-[#F6F5F4] px-3 py-2 text-center text-[12px] font-semibold text-[#8C4A55]"
    >
      צפייה בקובץ הקיים
    </a>
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

export default function EditCandidatePage() {
  return (
    <Suspense fallback={null}>
      <EditCandidateForm />
    </Suspense>
  );
}
