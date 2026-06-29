"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "./Header";
import { PERSONAL_FIELDS, REFERENCES_QUESTION } from "../lib/questions";
import { loadData, addCandidate } from "../lib/store";

export default function Questionnaire({ gender }) {
  const router = useRouter();
  const genderLabel = gender === "female" ? "בחורה" : "בחור";

  const [openQuestions, setOpenQuestions] = useState([]);
  const [form, setForm] = useState({});
  const [photo, setPhoto] = useState("");
  const [refs, setRefs] = useState([
    { name: "", relation: "", phone: "" },
    { name: "", relation: "", phone: "" },
  ]);
  const [error, setError] = useState("");

  useEffect(() => {
    const data = loadData();
    setOpenQuestions(data.openQuestions || []);
  }, []);

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function setRef(i, key, value) {
    setRefs((r) => r.map((item, idx) => (idx === i ? { ...item, [key]: value } : item)));
  }

  function onPhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result);
    reader.readAsDataURL(file);
  }

  function validate() {
    for (const f of PERSONAL_FIELDS) {
      if (!form[f.key] || String(form[f.key]).trim() === "") return `נא למלא: ${f.label}`;
    }
    if (!photo) return "נא להוסיף תמונה";
    for (const q of openQuestions) {
      if (!form[q.key] || String(form[q.key]).trim() === "") return "נא לענות על כל השאלות";
    }
    for (const r of refs) {
      if (!r.name.trim() || !r.relation.trim() || !r.phone.trim())
        return "נא למלא את פרטי שני אנשי הקשר";
    }
    return "";
  }

  function onSubmit(e) {
    e.preventDefault();
    const err = validate();
    if (err) {
      setError(err);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const answers = {};
    openQuestions.forEach((q) => {
      answers[q.key] = form[q.key];
    });
    addCandidate({
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
    });
    router.push("/thank-you");
  }

  return (
    <div>
      <Header />
      <main className="mx-auto max-w-md px-4 py-6 pb-24">
        <h1 className="mb-1 text-2xl font-bold text-roseDark">שאלון היכרות</h1>
        <p className="mb-6 text-sm text-ink/60">מסלול: {genderLabel} · כל השדות הם שדות חובה</p>

        {error && (
          <div className="mb-4 rounded-2xl bg-rose/10 px-4 py-3 text-sm font-medium text-roseDark">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-5">
          {/* פרטים אישיים */}
          <section className="card space-y-4">
            <h2 className="text-lg font-semibold text-ink">👤 פרטים אישיים</h2>
            {PERSONAL_FIELDS.map((f) => (
              <div key={f.key}>
                <label className="field-label">{f.label}</label>
                <input
                  className="field-input"
                  type={f.type}
                  value={form[f.key] || ""}
                  onChange={(e) => setField(f.key, e.target.value)}
                />
              </div>
            ))}
            <div>
              <label className="field-label">📷 הוספת תמונה</label>
              <input className="field-input" type="file" accept="image/*" onChange={onPhoto} />
              {photo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo} alt="תצוגה מקדימה" className="mt-3 h-28 w-28 rounded-2xl object-cover" />
              )}
            </div>
          </section>

          {/* שאלות פתוחות */}
          <section className="card space-y-4">
            <h2 className="text-lg font-semibold text-ink">💬 קצת עליך</h2>
            {openQuestions.map((q) => (
              <div key={q.key}>
                <label className="field-label">{q.label}</label>
                <textarea
                  className="field-input min-h-[90px]"
                  value={form[q.key] || ""}
                  onChange={(e) => setField(q.key, e.target.value)}
                />
              </div>
            ))}
          </section>

          {/* אנשי קשר */}
          <section className="card space-y-4">
            <h2 className="text-lg font-semibold text-ink">🌈 אנשי קשר</h2>
            <p className="text-sm text-ink/70">{REFERENCES_QUESTION}</p>
            {refs.map((r, i) => (
              <div key={i} className="space-y-2 rounded-2xl bg-blush/40 p-3">
                <p className="text-sm font-medium text-roseDark">איש קשר {i + 1}</p>
                <input
                  className="field-input"
                  placeholder="שם"
                  value={r.name}
                  onChange={(e) => setRef(i, "name", e.target.value)}
                />
                <input
                  className="field-input"
                  placeholder="מה הם בשבילך"
                  value={r.relation}
                  onChange={(e) => setRef(i, "relation", e.target.value)}
                />
                <input
                  className="field-input"
                  placeholder="טלפון"
                  type="tel"
                  value={r.phone}
                  onChange={(e) => setRef(i, "phone", e.target.value)}
                />
              </div>
            ))}
          </section>

          <button type="submit" className="btn-primary w-full text-lg">
            שליחה
          </button>
          <p className="text-center text-xs text-ink/50">
            לאחר השליחה לא ניתן לערוך את הטופס.
          </p>
        </form>
      </main>
    </div>
  );
}
