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
        <h1 className="text-2xl font-bold text-roseDark">כניסת צוות ניהול</h1>
        <p className="text-sm text-ink/60">הקלידי את הסיסמה שלך כדי להיכנס</p>
        {error && (
          <div className="rounded-2xl bg-rose/10 px-4 py-3 text-sm font-medium text-roseDark">{error}</div>
        )}
        <input
          className="field-input text-center"
          type="password"
          placeholder="סיסמה"
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

  if (!data) return <main className="p-8 text-center text-ink/50">טוען…</main>;
  if (!user) return <Login data={data} />;

  const isAdmin = user.role === "admin";
  const myRep = data.reps.find((r) => r.id === user.repId);

  // אילו נציגים מציגים: מנהלת רואה את כולם, נציג רואה את עצמו.
  const repsToShow = isAdmin ? data.reps : data.reps.filter((r) => r.id === user.repId);
  const unassigned = data.candidates.filter((c) => !c.assignedRep);

  function handleAdd(form) {
    // נציג שמוסיף מועמד - משויך אליו אוטומטית אם לא נבחר אחרת.
    const payload = { ...form };
    if (!isAdmin && !payload.assignedRep) payload.assignedRep = user.repId;
    addCandidate(payload);
    setAddingCand(false);
  }

  const tabs = [
    { id: "candidates", label: "👤 מועמדים" },
    { id: "matches", label: "💞 התאמות" },
    { id: "tasks", label: "📝 משימות" },
  ];
  if (isAdmin) tabs.push({ id: "manage", label: "⚙️ ניהול" });

  return (
    <div>
      <Header>
        <span className="text-sm text-ink/70">
          {isAdmin ? "מנהלת" : `${myRep?.name} · ${myRep?.institution}`}
        </span>
        <button className="btn-soft !px-3 !py-1.5 text-sm" onClick={() => setCurrentUser(null)}>יציאה</button>
      </Header>

      <main className="mx-auto max-w-3xl px-4 py-5 pb-28">
        {/* טאבים */}
        <div className="mb-5 flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${tab === t.id ? "bg-rose text-white shadow-soft" : "bg-blush text-roseDark"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "candidates" && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <button className="btn-primary" onClick={() => setAddingCand(true)}>+ הוספת מועמד</button>
            </div>

            {repsToShow.map((rep) => {
              const cands = data.candidates.filter((c) => c.assignedRep === rep.id);
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

            {/* מועמדים ללא שיוך - מנהלת בלבד */}
            {isAdmin && unassigned.length > 0 && (
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
                      canEdit={true}
                      canSeeSensitive={true}
                      onUpdate={updateCandidate}
                      onDelete={deleteCandidate}
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
    </div>
  );
}
