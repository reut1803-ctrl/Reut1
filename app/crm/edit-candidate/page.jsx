"use client";

import MediaImage from "@/components/crm/ui/MediaImage";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Save, ImagePlus, X, FileText, Music, Trash2, AlertCircle } from "lucide-react";
import { useCrmStore, AVAILABILITY_STATUSES } from "@/lib/crm/store";
import { REGIONS, religiousLevelsFor, smokingOptionsFor, TRAITS, lifestyleTagsFor, occupationTagsFor, occupationsOf } from "@/lib/crm/mockData";
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
  const [lifestyle, setLifestyle] = useState([]);
  // עיסוק ורקע - בחירה מרובה. כרטיס ותיק נטען מהשדה הישן דרך occupationsOf.
  const [occupations, setOccupations] = useState([]);
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
  // נדלק אחרי לחיצה ראשונה על השמירה - ואז השדות החסרים מסומנים באדום
  const [attempted, setAttempted] = useState(false);
  const alertRef = useRef(null);

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
      region: c.region || REGIONS[0],
      city: c.city || "",
      religiousLevel: c.religiousLevel || religiousLevelsFor(c.gender)[0],
      currentOccupation: c.currentOccupation || "",
      smoking: c.smoking || smokingOptionsFor(c.gender)[0],
      phone: c.phone || "",
      bio: c.bio || "",
      availabilityStatus: c.availabilityStatus || AVAILABILITY_STATUSES[0],
      complexityNotes: c.complexityNotes || "",
      referenceContacts: c.referenceContacts || "",
      confidential: c.confidential || false,
    });
    setTraits(c.traits || []);
    setLifestyle(c.lifestyle || []);
    setOccupations(occupationsOf(c));
    setPhotos(c.photoUrls?.length > 0 ? c.photoUrls : c.photoUrl ? [c.photoUrl] : []);
    setPdfUrl(c.pdfUrl || null);
    setIntroAudioUrl(c.introAudioUrl || null);
    setLoaded(true);
  }, [id, loaded, findCandidateById]);

  // ברגע שמתקנים שדה - הודעת השגיאה נעלמת, כדי שלא תישאר על המסך אחרי שכבר תוקנה
  useEffect(() => {
    setSubmitError("");
  }, [form?.name, form?.age, form?.height, form?.phone, photos.length]);

  if (role !== "admin") {
    return <p className="px-4 py-10 text-center text-sm text-[#7C6E60]">אזור זה זמין למנהלת בלבד</p>;
  }

  if (!id) {
    return <p className="px-4 py-10 text-center text-sm text-[#7C6E60]">לא נבחר מועמד/ת לעריכה</p>;
  }

  if (!loaded || !form) {
    return <p className="px-4 py-10 text-center text-sm text-[#7C6E60]">טוען פרטי כרטיס...</p>;
  }

  const set = (partial) => setForm((f) => ({ ...f, ...partial }));
  const toggleTrait = (t) => setTraits((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));
  const setGender = (gender) => {
    setForm((f) => ({ ...f, gender, religiousLevel: religiousLevelsFor(gender)[0], smoking: smokingOptionsFor(gender)[0] }));
    setOccupations((cur) => cur.filter((t) => occupationTagsFor(gender).includes(t)));
  };
  const toggleOccupation = (t) =>
    setOccupations((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setPhotoError("יש לבחור קובץ תמונה בלבד");
      return;
    }
    if (photos.length >= MAX_PHOTOS) {
      setPhotoError(`אפשר להעלות עד ${MAX_PHOTOS} תמונות לכרטיס`);
      return;
    }
    setPhotoError("");
    setPhotoUploading(true);
    try {
      const compressed = await compressImage(file, { maxDimension: 1200, quality: 0.8 });
      const blob = await (await fetch(compressed)).blob();
      const url = await uploadToCloudinary(blob);
      setPhotos((cur) => [...cur, url]);
    } catch (err) {
      setPhotoError(`העלאת התמונה נכשלה: ${err?.message || String(err)}`);
    } finally {
      setPhotoUploading(false);
    }
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

  // רשימת מה שחסר בטופס, בשמות שמופיעים על המסך - כדי שהכפתור יסביר ולא ישתוק
  const missingName = !form.name.trim();
  const missingAge = !String(form.age).trim() || !Number.isFinite(Number(form.age));
  const missingHeight = !String(form.height).trim() || !Number.isFinite(Number(form.height));
  const missingPhone = !form.phone.trim();
  const missingPhoto = photos.length === 0;

  const missing = [];
  if (missingName) missing.push("שם מלא");
  if (missingAge) missing.push("גיל (מספר בלבד)");
  if (missingHeight) missing.push("גובה בס״מ (מספר בלבד)");
  if (missingPhone) missing.push("טלפון");
  if (missingPhoto) missing.push("תמונה אחת לפחות");

  const uploadingLabel = photoUploading
    ? "תמונה"
    : pdfUploading
    ? "קובץ PDF"
    : audioUploading
    ? "הקלטת היכרות"
    : "";
  const busyUploading = !!uploadingLabel;
  const blockedNow = submitting || busyUploading;

  const fieldCls = (bad) => (attempted && bad ? "input-crm input-crm-error" : "input-crm");

  const handleSubmit = async () => {
    setAttempted(true);
    if (busyUploading) {
      setSubmitError(`רגע - ${uploadingLabel} עדיין בהעלאה. אפשר ללחוץ שוב בעוד כמה שניות.`);
      return;
    }
    if (submitting) return;
    if (missing.length > 0) {
      setSubmitError(
        `לא ניתן לשמור עדיין. חסר למלא: ${missing.join(" · ")}${
          missingPhoto && photoError ? ` (העלאת התמונה נכשלה: ${photoError})` : ""
        }`
      );
      setTimeout(() => alertRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 30);
      return;
    }
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
        currentOccupation: form.currentOccupation.trim(),
        occupations,
        smoking: form.smoking,
        phone: form.phone.trim(),
        bio: form.bio.trim(),
        traits,
        lifestyle,
        photoUrl: photos[0] ?? null,
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
      <h1 className="flex items-center gap-2 text-xl font-bold text-[#3A2E26]">
        <Save size={22} /> עריכת פרטי הכרטיס
      </h1>
      <p className="mt-1 text-[13px] text-[#7C6E60]">כל שינוי יעודכן על הכרטיס הקיים - לא ייווצר כרטיס חדש</p>

      <div className="mt-4 space-y-4">
        <div>
          <p className="mb-1.5 text-[12px] font-semibold text-[#3A2E26]">מגדר</p>
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
                    ? "border-[#844442] bg-[#844442] text-white"
                    : "border-[#CCBDAB] bg-white text-[#3A2E26]"
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-[12px] font-semibold text-[#3A2E26]">תמונות * (עד {MAX_PHOTOS})</p>
          <div className="flex flex-wrap gap-2.5">
            {photos.map((p, i) => (
              <div key={i} className="relative h-32 w-28 shrink-0 overflow-hidden rounded-2xl border border-[#CCBDAB]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <MediaImage src={p} alt="תצוגה מקדימה" className="h-full w-full object-cover" />
                {i === 0 && (
                  <span className="absolute bottom-1 right-1 rounded-full bg-[#844442] px-1.5 py-0.5 text-[9px] font-bold text-white">
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
              <div className="flex h-32 w-28 shrink-0 flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-[#CCBDAB] bg-white text-[#A2937F]">
                <span className="text-[11px] font-semibold">מעלה תמונה...</span>
              </div>
            )}
            {photos.length < MAX_PHOTOS && !photoUploading && (
              <label className="flex h-32 w-28 shrink-0 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-[#CCBDAB] bg-white text-[#A2937F] transition hover:border-[#844442] hover:text-[#844442]">
                <ImagePlus size={22} />
                <span className="text-[11px] font-semibold">הוספת תמונה</span>
                <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              </label>
            )}
          </div>
          {photoError && (
            <p className="mt-1 rounded-xl bg-red-50 px-2.5 py-1.5 text-[12px] font-semibold text-[#C24545]">{photoError}</p>
          )}
          <p className={`mt-1 text-[11px] ${attempted && missingPhoto ? "font-bold text-[#C24545]" : "text-[#A2937F]"}`}>
            שדה חובה - חייבת להישאר לפחות תמונה אחת בכרטיס
          </p>
        </div>

        <Field label="שם מלא *">
          <input type="text" value={form.name} onChange={(e) => set({ name: e.target.value })} className={fieldCls(missingName)} />
        </Field>

        <div className="grid grid-cols-3 gap-3">
          <Field label="גיל *">
            <input type="number" value={form.age} onChange={(e) => set({ age: e.target.value })} className={fieldCls(missingAge)} />
          </Field>
          <Field label="גובה (ס״מ) *">
            <input type="number" value={form.height} onChange={(e) => set({ height: e.target.value })} className={fieldCls(missingHeight)} />
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

        <Field label="טלפון *">
          <input type="tel" dir="ltr" value={form.phone} onChange={(e) => set({ phone: e.target.value })} className={fieldCls(missingPhone)} />
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

        {/* מה הוא/היא עושים היום - טקסט חופשי קצר. מופיע בראש הפרופיל
            ליד שאר פרטי הזיהוי, בנפרד מ"המסלול שלי" שהוא סיפור הרקע. */}
        <Field label="עיסוק נוכחי">
          <input
            type="text"
            value={form.currentOccupation}
            onChange={(e) => set({ currentOccupation: e.target.value })}
            placeholder="לדוגמה: לומד בכולל / עובד בהייטק / מורה"
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

        <Field label="עישון">
          <select value={form.smoking} onChange={(e) => set({ smoking: e.target.value })} className="input-crm">
            {smokingOptionsFor(form.gender).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>

        <div>
          <p className="mb-1.5 text-[12px] font-semibold text-[#3A2E26]">סגנון חיים והשקפה</p>
          <div className="flex flex-wrap gap-2">
            {lifestyleTagsFor(form.gender).filter((t) => t !== "לא משנה").map((t) => (
              <button
                key={t}
                onClick={() =>
                  setLifestyle((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]))
                }
                className={`rounded-full border px-3 py-1.5 text-[12px] font-semibold transition ${
                  lifestyle.includes(t) ? "border-[#844442] bg-[#844442] text-white" : "border-[#CCBDAB] bg-white text-[#3A2E26]"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* "המסלול שלי" - כל הדרכים שהאדם עבר. יושב כאן למטה ליד התכונות,
            והוא זה שמזין את מבחן ההתאמות. */}
        <div>
          <p className="mb-1.5 text-[12px] font-semibold text-[#3A2E26]">המסלול שלי</p>
          <p className="mb-2 text-[11px] leading-relaxed text-[#A2937F]">
            כל הדרכים והמסגרות שהוא/היא עברו בחיים. אפשר לסמן כמה שרוצים - מבחן ההתאמות בודק את כל הסימונים.
          </p>
          <div className="flex flex-wrap gap-2">
            {occupationTagsFor(form.gender).map((t) => (
              <button
                key={t}
                onClick={() => toggleOccupation(t)}
                className={`rounded-full border px-3 py-1.5 text-[12px] font-semibold transition ${
                  occupations.includes(t) ? "border-[#844442] bg-[#844442] text-white" : "border-[#CCBDAB] bg-white text-[#3A2E26]"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-[12px] font-semibold text-[#3A2E26]">תכונות</p>
          <div className="flex flex-wrap gap-2">
            {TRAITS.map((t) => (
              <button
                key={t}
                onClick={() => toggleTrait(t)}
                className={`rounded-full border px-3 py-1.5 text-[12px] font-semibold transition ${
                  traits.includes(t) ? "border-[#844442] bg-[#844442] text-white" : "border-[#CCBDAB] bg-white text-[#3A2E26]"
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
                  <label className="flex h-9 flex-1 cursor-pointer items-center justify-center gap-1 rounded-xl border border-[#CCBDAB] bg-white text-[11px] font-semibold text-[#844442]">
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
              <label className="flex h-11 w-full cursor-pointer items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-[#CCBDAB] bg-white text-[12px] font-semibold text-[#844442]">
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
                  <label className="flex h-9 flex-1 cursor-pointer items-center justify-center gap-1 rounded-xl border border-[#CCBDAB] bg-white text-[11px] font-semibold text-[#844442]">
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
              <label className="flex h-11 w-full cursor-pointer items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-[#CCBDAB] bg-white text-[12px] font-semibold text-[#844442]">
                <Music size={15} />
                {audioUploading ? uploadStatus || "מעלה..." : "העלאת אודיו"}
                <input type="file" accept="audio/*" onChange={handleAudioChange} disabled={audioUploading} className="hidden" />
              </label>
            )}
          </Field>
        </div>
        {mediaError && <p className="text-[11px] text-red-500">{mediaError}</p>}

        {/* חיווי חי: מה עוד חסר כדי לשמור. מופיע לפני הלחיצה, ונצבע באדום אחריה. */}
        <div ref={alertRef}>
          {submitError ? (
            <div className="flex items-start gap-2 rounded-2xl border-2 border-[#C24545] bg-red-50 px-3.5 py-3 text-[13px] font-semibold leading-relaxed text-[#C24545]">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <span>{submitError}</span>
            </div>
          ) : missing.length > 0 ? (
            <div
              className={`flex items-start gap-2 rounded-2xl border-2 px-3.5 py-3 text-[13px] leading-relaxed ${
                attempted
                  ? "border-[#C24545] bg-red-50 text-[#C24545]"
                  : "border-[#D9A441] bg-[#FDF6E7] text-[#7A5A18]"
              }`}
            >
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <span>
                <span className="font-bold">כדי לשמור את הכרטיס חסר עוד:</span>
                <br />
                {missing.join(" · ")}
              </span>
            </div>
          ) : null}
        </div>
        <Button variant="primary" className="w-full" disabled={blockedNow} onClick={handleSubmit}>
          <Save size={16} />{" "}
          {submitting ? "שומרת..." : busyUploading ? `מעלה ${uploadingLabel}...` : "שמירת השינויים"}
        </Button>
      </div>

      <style jsx global>{`
        .input-crm {
          width: 100%;
          border-radius: 1rem;
          border: 1px solid #CCBDAB;
          background: white;
          padding: 0.625rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
        }
        .input-crm:focus {
          border-color: #844442;
        }
        .input-crm-error {
          border-color: #C24545;
          border-width: 2px;
          background: #FFF5F5;
        }
      `}</style>
    </div>
  );
}

// מציגים נגן/קישור גם עבור מדיה שנשמרה בחלקים ב-Firestore וגם עבור כתובת רגילה
function MediaAudio({ value }) {
  const { url, error, loading } = useMediaUrl(value);
  if (loading) return <p className="text-[11px] text-[#7C6E60]">טוען הקלטה...</p>;
  if (error) return <p className="text-[11px] text-red-500">{error}</p>;
  return <audio controls src={url} className="h-8 w-full" />;
}

function MediaFileLink({ value }) {
  const { url, error, loading } = useMediaUrl(value);
  if (loading) return <p className="text-[11px] text-[#7C6E60]">טוען קובץ...</p>;
  if (error) return <p className="text-[11px] text-red-500">{error}</p>;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block truncate rounded-2xl bg-[#E8DCCB] px-3 py-2 text-center text-[12px] font-semibold text-[#844442]"
    >
      צפייה בקובץ הקיים
    </a>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <p className="mb-1.5 text-[12px] font-semibold text-[#3A2E26]">{label}</p>
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
