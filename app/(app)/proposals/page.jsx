"use client";

import { useEffect, useMemo, useState } from "react";
import { Heart, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/supabase/AuthProvider";
import { fetchCandidates, fetchProposals, createProposal, updateProposalStage } from "@/lib/queries";
import { PIPELINE_STATUSES } from "@/lib/data";

export default function ProposalsPage() {
  const { supabase, user, profile } = useAuth();
  const [males, setMales] = useState([]);
  const [females, setFemales] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [maleId, setMaleId] = useState("");
  const [femaleId, setFemaleId] = useState("");
  const [rationale, setRationale] = useState("");
  const [loading, setLoading] = useState(true);

  const canAccess = profile?.role === "staff" || profile?.role === "admin";

  useEffect(() => {
    if (!canAccess) return;
    Promise.all([fetchCandidates(supabase, "male"), fetchCandidates(supabase, "female"), fetchProposals(supabase)]).then(
      ([m, f, p]) => {
        setMales(m);
        setFemales(f);
        setProposals(p);
        setLoading(false);
      }
    );
  }, [supabase, canAccess]);

  const canCreate = maleId && femaleId;

  const submit = async () => {
    if (!canCreate) return;
    await createProposal(supabase, { maleId, femaleId, rationale, userId: user.id });
    setProposals(await fetchProposals(supabase));
    setMaleId("");
    setFemaleId("");
    setRationale("");
  };

  const changeStage = async (id, stage) => {
    setProposals((prev) => prev.map((p) => (p.id === id ? { ...p, stage } : p)));
    await updateProposalStage(supabase, id, stage);
  };

  if (!canAccess) {
    return <p className="px-1 py-10 text-center text-sm text-muted">אזור זה זמין לצוות בלבד</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="px-1 text-lg font-extrabold text-ink">הצעות שידוך</h1>

      <div className="card flex flex-col gap-3 p-4">
        <p className="flex items-center gap-1.5 text-sm font-bold text-ink">
          <Heart size={16} className="text-pink-500" />
          הצעת התאמה חדשה
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Select label="בחור" value={maleId} onChange={setMaleId} options={males} />
          <Select label="בחורה" value={femaleId} onChange={setFemaleId} options={females} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted">הרציונל - למה זה מתאים?</label>
          <textarea
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            rows={2}
            className="w-full rounded-2xl border border-black/10 bg-white p-3 text-sm outline-none focus:border-pink-400"
          />
        </div>
        <button onClick={submit} disabled={!canCreate} className="btn-pink w-full disabled:opacity-40">
          יצירת הצעה
        </button>
      </div>

      {loading ? (
        <div className="card py-10 text-center text-sm text-muted">טוען...</div>
      ) : proposals.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 py-10 text-center">
          <Sparkles size={22} className="text-pink-300" />
          <p className="text-sm text-muted">עדיין אין הצעות שידוך</p>
        </div>
      ) : (
        proposals.map((p) => (
          <div key={p.id} className="card p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-bold text-ink">
                {p.male?.name} ↔ {p.female?.name}
              </p>
            </div>
            {p.rationale && <p className="mb-3 text-xs leading-relaxed text-muted">{p.rationale}</p>}
            <div className="flex flex-wrap gap-1.5">
              {PIPELINE_STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => changeStage(p.id, s)}
                  className={`pill border transition ${
                    p.stage === s ? "border-mint-500 bg-mint-500 text-white" : "border-black/10 bg-white text-muted"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-muted">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-black/10 bg-white p-3 text-sm outline-none focus:border-pink-400"
      >
        <option value="">בחירה...</option>
        {options.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}
