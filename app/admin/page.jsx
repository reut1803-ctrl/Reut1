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
import LogViewer from "../../components/LogViewer";
import PopupEditor from "../../components/PopupEditor";
import PopupNotice from "../../components/PopupNotice";
import Logo from "../../components/Logo";
import { useData, useUser } from "../../lib/useData";
import { setCurrentUser, addCandidate, updateCandidate, deleteCandidate, displayRep } from "../../lib/store";

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
    if (data.viewerPassword && pw === data.viewerPassword) {
      setCurrentUser({ role: "viewer" });
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
  // לשונית משנה במסך המועמדים: "new" = 5 החדשים; "previous" = השאר. ברירת מחדל - חדשים.
  const [candView, setCandView] = useState("new");

  if (!data) return <main className="p-8 text-center text-ink/50">טוען…</main>;
  if (!user) return <Login data={data} />;

  const isAdmin = user.role === "admin";
  const isViewer = user.role === "viewer";
  const myRep = data.reps.find((r) => r.id === user.repId);
  // נציג בחופשה / קריאה בלבד - יכול לצפות אך לא לבצע פעולות
  const myReadOnly = !!myRep?.readOnly;

  // נציגים בחופשה (readOnly) "נקברים" - לא מוצגים כמדור נפרד, והמועמדים שלהם עוברים למחליף/ה.
  const visibleReps = data.reps.filter((r) => !r.readOnly);
  const visibleRepIds = new Set(visibleReps.map((r) => r.id));

  // מועמד "מנוהל על ידי" - הנציג המשויך, או נציג/ה שמכסה את הנציג המשויך (Co-Management).
  const managedByMe = (c) => {
    if (!user.repId) return false;
    if (c.assignedRep === user.repId) return true;
    const owner = data.reps.find((r) => r.id === c.assignedRep);
    return !!(owner && (owner.coveredBy || []).includes(user.repId));
  };
  // צפייה במידע רגיש/הקלטות: מנהלת, צופה, או מי שמנהל את המועמד (כולל מחליף/ה)
  const canSeeSensitiveOf = (c) => isAdmin || isViewer || managedByMe(c);
  // עריכה/כתיבה: מנהלת, או מי שמנהל את המועמד ואינו במצב קריאה בלבד
  const canEditOf = (c) => isAdmin || (managedByMe(c) && !myReadOnly);

  // הסתרה נקודתית - כרטיס שהמנהלת הסתירה מנציג/ה מסוים/ת (חל על נציגים בלבד).
  const hiddenFromMe = (c) =>
    !isAdmin && !isViewer && !!user.repId && (c.hiddenFrom || []).includes(user.repId);
  // כרטיס מוגבל - גלוי למנהלת, לצופה, ולנציג המנהל (כולל מחליף/ה). כרטיס מוסתר נקודתית - לא נראה לאותו/ה נציג/ה.
  const canViewCandidate = (c) =>
    !hiddenFromMe(c) && (!c.restricted || isAdmin || isViewer || managedByMe(c));

  // חיפוש מועמדים לפי שם, מקום, עדה, עיסוק או טלפון.
  const term = search.trim().toLowerCase();
  const matchSearch = (c) =>
    !term ||
    [c.fullName, c.location, c.community, c.work, c.degree, c.phone]
      .some((v) => (v || "").toString().toLowerCase().includes(term));

  // 5 המועמדים האחרונים שהצטרפו (מבין אלה שהמשתמש/ת רשאי/ת לראות) - לפי מועד ההוספה.
  const viewableSorted = data.candidates
    .filter((c) => canViewCandidate(c))
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  const newIds = new Set(viewableSorted.slice(0, 5).map((c) => c.id));
  const newCands = viewableSorted.filter((c) => newIds.has(c.id) && matchSearch(c));

  // "ללא שיוך" כולל מועמדים ללא נציג, נציג שנמחק, או נציג בחופשה ללא מחליף/ה (כדי שלא ייעלמו לעולם).
  // בתצוגת "קודמים" מחריגים את 5 החדשים (הם מופיעים בלשונית "חדשים").
  const unassigned = data.candidates.filter((c) => {
    const dr = displayRep(c, data.reps);
    return (!dr || !visibleRepIds.has(dr.id)) && (term || !newIds.has(c.id)) && matchSearch(c) && canViewCandidate(c);
  });

  async function handleAdd(form) {
    // נציג שמוסיף מועמד - משויך אליו אוטומטית אם לא נבחר אחרת.
    const payload = { ...form };
    if (!isAdmin && !payload.assignedRep) payload.assignedRep = user.repId;
    await addCandidate(payload); // נזרק שגיאה אם נכשל - העורך יציג הודעה והמידע יישמר
    setAddingCand(false);
  }

  // צופה רואה רק את המועמדים (קריאה בלבד); שאר הלשוניות מוסתרות ממנו.
  const tabs = [{ id: "candidates", icon: "👤", label: "מועמדים" }];
  if (!isViewer) {
    tabs.push({ id: "matches", icon: "💞", label: "התאמות" });
    tabs.push({ id: "tasks", icon: "📝", label: "משימות" });
  }
  if (isAdmin) tabs.push({ id: "manage", icon: "⚙️", label: "ניהול" });

  return (
    <div>
      <PopupNotice popup={data.popup} role={user.role} />
      <Header>
        <span className="text-sm text-ink/70">
          {isAdmin ? "מנהלת" : isViewer ? "👁️ צפייה בלבד" : `${myRep?.name} · ${myRep?.institution}`}
        </span>
        <button className="btn-soft !px-3 !py-1.5 text-sm" onClick={() => setCurrentUser(null)}>יציאה</button>
      </Header>

      <main className="mx-auto max-w-3xl px-4 py-5 pb-28">
        {tab === "candidates" && (
          <div className="space-y-6">
            {isViewer && (
              <div className="rounded-2xl bg-amber-100 px-4 py-3 text-center text-sm font-semibold text-amber-800">
                👁️ מצב צפייה בלבד — ניתן לצפות במועמדים אך לא לערוך, להוסיף או למחוק.
              </div>
            )}
            {myReadOnly && (
              <div className="rounded-2xl bg-amber-100 px-4 py-3 text-center text-sm font-semibold text-amber-800">
                🔒 את/ה במצב חופשה / קריאה בלבד — אפשר לצפות אך לא לבצע פעולות.
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <input
                className="field-input flex-1"
                type="search"
                placeholder="🔍 חיפוש מועמד (שם, מקום, עדה...)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {!isViewer && !myReadOnly && (
                <button className="btn-primary whitespace-nowrap" onClick={() => setAddingCand(true)}>+ הוספת מועמד</button>
              )}
            </div>

            {/* לשוניות משנה: מועמדים חדשים / מועמדים קודמים */}
            <div className="flex gap-2">
              <button
                onClick={() => setCandView("new")}
                className={`flex-1 rounded-2xl px-4 py-2.5 text-sm font-bold transition ${candView === "new" ? "bg-rose text-white" : "bg-blush text-roseDark"}`}
              >✨ מועמדים חדשים</button>
              <button
                onClick={() => setCandView("previous")}
                className={`flex-1 rounded-2xl px-4 py-2.5 text-sm font-bold transition ${candView === "previous" ? "bg-rose text-white" : "bg-blush text-roseDark"}`}
              >מועמדים קודמים</button>
            </div>

            {/* מועמדים חדשים - 5 האחרונים שהצטרפו (בחיפוש מציגים את כל התוצאות) */}
            {candView === "new" && !term && (
              <section className="space-y-3">
                <div className="rounded-2xl bg-blush px-4 py-2">
                  <p className="font-bold text-roseDark">✨ המצטרפים החדשים</p>
                  <p className="text-xs text-ink/60">חמשת המועמדים האחרונים שהצטרפו למאגר.</p>
                </div>
                {newCands.length === 0 && <p className="text-sm text-ink/40">אין מועמדים חדשים.</p>}
                <div className="grid gap-3 sm:grid-cols-2">
                  {newCands.map((c) => (
                    <CandidateCard
                      key={c.id}
                      candidate={c}
                      openQuestions={data.openQuestions}
                      reps={data.reps}
                      canEdit={canEditOf(c)}
                      canSeeSensitive={canSeeSensitiveOf(c)}
                      currentRepId={user.repId || "admin"}
                      isAdmin={isAdmin}
                      onUpdate={updateCandidate}
                      onDelete={isAdmin ? deleteCandidate : undefined}
                    />
                  ))}
                </div>
              </section>
            )}

            {(candView === "previous" || term) && visibleReps.map((rep) => {
              const cands = data.candidates.filter((c) => displayRep(c, data.reps)?.id === rep.id && (term || !newIds.has(c.id)) && matchSearch(c) && canViewCandidate(c));
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
                        canEdit={canEditOf(c)}
                        canSeeSensitive={canSeeSensitiveOf(c)}
                        currentRepId={user.repId || "admin"}
                        isAdmin={isAdmin}
                        onUpdate={updateCandidate}
                        onDelete={isAdmin ? deleteCandidate : undefined}
                      />
                    ))}
                  </div>
                </section>
              );
            })}

            {/* מועמדים ללא שיוך נציג (בתצוגת קודמים או בחיפוש) */}
            {(candView === "previous" || term) && unassigned.length > 0 && (
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
                      currentRepId={user.repId || "admin"}
                      isAdmin={isAdmin}
                      onUpdate={updateCandidate}
                      onDelete={isAdmin ? deleteCandidate : undefined}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {tab === "matches" && <MatchesPanel data={data} user={user} readOnly={myReadOnly} />}
        {tab === "tasks" && <TasksPanel data={data} user={user} readOnly={myReadOnly} />}
        {tab === "manage" && isAdmin && (
          <div className="space-y-8">
            <RepsManager data={data} />
            <LogViewer data={data} />
            <PopupEditor data={data} />
            <QuestionsEditor data={data} />
          </div>
        )}
      </main>

      {addingCand && (
        <Modal title="הוספת מועמד" onClose={() => setAddingCand(false)}>
          <CandidateEditor
            openQuestions={data.openQuestions}
            reps={data.reps}
            isAdmin={isAdmin}
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
