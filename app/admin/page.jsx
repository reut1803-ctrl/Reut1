"use client";

import { useState } from "react";
import Header from "../../components/Header";
import Modal from "../../components/Modal";
import CandidateCard from "../../components/CandidateCard";
import CandidateEditor from "../../components/CandidateEditor";
import MatchesPanel from "../../components/MatchesPanel";
import TasksPanel from "../../components/TasksPanel";
import QuestionsEditor from "../../components/QuestionsEditor";
import RepsManager from "../../components/RepsManager";
import Logo from "../../components/Logo";
import { useData, useUser } from "../../lib/useData";
import { setCurrentUser, addCandidate, updateCandidate, deleteCandidate } from "../../lib/store";

function Login({ data }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function tryLogin(e) {
    e.preventDefault();
    const pw = password.trim();
    if (!pw) return;
    if (pw === data.adminPassword) {
      setCurrentUser({ role: "admin" });
      return;
    }
    const rep = data.reps.find((r) => r.password && r.password === pw);
    if (rep) {
      setCurrentUser({ role: "rep", repId: rep.id });
      return;
    }
    setError("סיסמה שגויה, נסי שוב");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <form onSubmit={tryLogin} className="w-full max-w-sm space-y-4 text-center">
        <div className="mb-2 flex justify-center">
          <Logo className="h-24 w-auto" />
        </div>
        <h1 className="text-2xl font-bold text-roseDark">כניסת צוות</h1>
        <p className="text-sm text-ink/60">הקלד/י את הסיסמה שלך</p>
        {error && (
          <div className="rounded-2xl bg-rose/10 px-4 py-3 text-sm font-medium text-roseDark">{error}</div>
        )}
        <input
          className="field-input text-center"
          type="password"
          placeholder="הקלד/י את הסיסמה שלך"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(""); }}
        />
        <button type="submit" className="btn-primary w-full">כניסה</button>
      </form>
    </main>
  );
}

export default function AdminPage() {
  const data = useData();
  const user = useUser();
  const [tab, setTab] = useState("candidates");
  const [addingCand, setAddingCand] = useState(false);
  const [search, setSearch] = useState("");

  if (!data) return <main className="p-8 text-center text-ink/50">טוען…</main>;
  if (!user) return <Login data={data} />;

  const isAdmin = user.role === "admin";
  const myRep = data.reps.find((r) => r.id === user.repId);

  // כל הנציגים רואים את כל המועמדים (כדי לאפשר התאמות).
  // מידע רגיש, בירורים וטלפון אישי מוסתרים ממי שאינו הנציג של המועמד או המנהלת.
  const repsToShow = data.reps;

  // חיפוש מועמדים לפי שם, מקום, עדה, עיסוק או טלפון.
  const term = search.trim().toLowerCase();
  const matchSearch = (c) =>
    !term ||
    [c.fullName, c.location, c.community, c.work, c.degree, c.phone]
      .some((v) => (v || "").toString().toLowerCase().includes(term));

  const unassigned = data.candidates.filter((c) => !c.assignedRep && matchSearch(c));

  async function handleAdd(form) {
    // נציג שמוסיף מועמד - משויך אליו אוטומטית אם לא נבחר אחרת.
    const payload = { ...form };
    if (!isAdmin && !payload.assignedRep) payload.assignedRep = user.repId;
    await addCandidate(payload); // נזרק שגיאה אם נכשל - העורך יציג הודעה והמידע יישמר
    setAddingCand(false);
  }

  const tabs = [
    { id: "candidates", icon: "👤", label: "מועמדים" },
    { id: "matches", icon: "💞", label: "התאמות" },
    { id: "tasks", icon: "📝", label: "משימות" },
  ];
  if (isAdmin) tabs.push({ id: "manage", icon: "⚙️", label: "ניהול" });

  return (
    <div>
      <Header>
        <span className="text-sm text-ink/70">
          {isAdmin ? "מנהלת" : `${myRep?.name} · ${myRep?.institution}`}
        </span>
        <button className="btn-soft !px-3 !py-1.5 text-sm" onClick={() => setCurrentUser(null)}>יציאה</button>
      </Header>

      <main className="mx-auto max-w-3xl px-4 py-5 pb-28">
        {tab === "candidates" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <input
                className="field-input flex-1"
                type="search"
                placeholder="🔍 חיפוש מועמד (שם, מקום, עדה...)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button className="btn-primary whitespace-nowrap" onClick={() => setAddingCand(true)}>+ הוספת מועמד</button>
            </div>

            {repsToShow.map((rep) => {
              const cands = data.candidates.filter((c) => c.assignedRep === rep.id && matchSearch(c));
              if (term && cands.length === 0) return null;
              return (
                <section key={rep.id} className="space-y-3">
                  {/* בראש העמודה: שם הנציג ושם המוסד */}
                  <div className="rounded-2xl bg-blush px-4 py-2">
                    <p className="font-bold text-roseDark">{rep.name}</p>
                    <p className="text-xs text-ink/60">{rep.institution}</p>
                  </div>
                  {cands.length === 0 && <p className="text-sm text-ink/40">אין מועמדים משויכים.</p>}
                  <div className="grid gap-3 sm:grid-cols-2">
                    {cands.map((c) => (
                      <CandidateCard
                        key={c.id}
                        candidate={c}
                        openQuestions={data.openQuestions}
                        reps={data.reps}
                        canEdit={isAdmin || c.assignedRep === user.repId}
                        canSeeSensitive={isAdmin || c.assignedRep === user.repId}
                        onUpdate={updateCandidate}
                        onDelete={isAdmin ? deleteCandidate : undefined}
                      />
                    ))}
                  </div>
                </section>
              );
            })}

            {/* מועמדים ללא שיוך נציג */}
            {unassigned.length > 0 && (
              <section className="space-y-3">
                <div className="rounded-2xl bg-sand px-4 py-2">
                  <p className="font-bold text-ink">ללא שיוך נציג</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {unassigned.map((c) => (
                    <CandidateCard
                      key={c.id}
                      candidate={c}
                      openQuestions={data.openQuestions}
                      reps={data.reps}
                      canEdit={isAdmin}
                      canSeeSensitive={isAdmin}
                      onUpdate={updateCandidate}
                      onDelete={isAdmin ? deleteCandidate : undefined}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {tab === "matches" && <MatchesPanel data={data} user={user} />}
        {tab === "tasks" && <TasksPanel data={data} user={user} />}
        {tab === "manage" && isAdmin && (
          <div className="space-y-8">
            <RepsManager data={data} />
            <QuestionsEditor data={data} />
          </div>
        )}
      </main>

      {addingCand && (
        <Modal title="הוספת מועמד" onClose={() => setAddingCand(false)}>
          <CandidateEditor
            openQuestions={data.openQuestions}
            reps={data.reps}
            onSave={handleAdd}
            onCancel={() => setAddingCand(false)}
          />
        </Modal>
      )}

      {/* ניווט קבוע בתחתית העמוד - קטגוריות הפעולה */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-sand bg-cream/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-stretch justify-around">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition ${tab === t.id ? "text-rose" : "text-ink/50"}`}
            >
              <span className="text-2xl leading-none">{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
