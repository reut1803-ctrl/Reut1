// =====================================================================
//  MatchmakerDashboard — list of the signed-in matchmaker's interviews
//  plus a candidate profile panel with private brainstorming notes and
//  read-only admin summaries.
// =====================================================================
import { useEffect, useState } from 'react';
import { useApp } from '../shared/AppContext';
import {
  interviewsApi,
  answersApi,
  notesApi,
  summariesApi,
} from '../shared/api';

function CandidateProfile({ candidate }) {
  const { staff } = useApp();
  const [answers, setAnswers] = useState([]);
  const [notes, setNotes] = useState([]);
  const [summaries, setSummaries] = useState([]);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (!candidate) return;
    answersApi.listForCandidate(candidate.id).then(setAnswers).catch(() => {});
    notesApi.listForCandidate(candidate.id).then(setNotes).catch(() => {});
    summariesApi
      .listForCandidate(candidate.id)
      .then(setSummaries)
      .catch(() => {});
  }, [candidate]);

  const addNote = async () => {
    if (!draft.trim()) return;
    const note = await notesApi.create({
      candidateId: candidate.id,
      matchmakerId: staff.id,
      body: draft.trim(),
    });
    setNotes((prev) => [note, ...prev]);
    setDraft('');
  };

  if (!candidate) {
    return <p className="muted">Select an interview to view the candidate.</p>;
  }

  return (
    <div className="profile">
      <h3 className="profile__name">{candidate.full_name || 'Candidate'}</h3>
      <p className="muted">
        {candidate.gender} · {candidate.city || '—'}
      </p>

      <section className="profile__section">
        <h4>Answers</h4>
        {answers.length === 0 && <p className="muted">No answers yet.</p>}
        <dl className="answers">
          {answers.map((a) => (
            <div className="answers__row" key={a.id}>
              <dt>{a.question?.label || 'Question'}</dt>
              <dd>
                {a.value ??
                  (a.value_json ? JSON.stringify(a.value_json) : '—')}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="profile__section">
        <h4>Admin summaries</h4>
        {summaries.length === 0 && <p className="muted">None.</p>}
        {summaries.map((s) => (
          <blockquote className="summary" key={s.id}>
            {s.summary}
            <footer>— {s.author?.full_name || 'Admin'}</footer>
          </blockquote>
        ))}
      </section>

      <section className="profile__section">
        <h4>My private notes</h4>
        <div className="note-composer">
          <textarea
            className="input"
            rows={3}
            placeholder="Add a private brainstorming note…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button type="button" className="btn btn--primary" onClick={addNote}>
            Add note
          </button>
        </div>
        {notes.map((n) => (
          <div className="note" key={n.id}>
            <p>{n.body}</p>
            <time className="muted">
              {new Date(n.created_at).toLocaleString()}
            </time>
          </div>
        ))}
      </section>
    </div>
  );
}

export default function MatchmakerDashboard() {
  const [interviews, setInterviews] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    interviewsApi
      .listMine()
      .then(setInterviews)
      .catch((err) => setError(err.message));
  }, []);

  const setStatus = async (id, status) => {
    const updated = await interviewsApi.updateStatus(id, status);
    setInterviews((prev) =>
      prev.map((iv) => (iv.id === id ? { ...iv, status: updated.status } : iv))
    );
  };

  return (
    <div className="dashboard">
      <div className="dashboard__list card">
        <h2>My interviews</h2>
        {error && <p className="form-error">{error}</p>}
        {interviews.length === 0 && (
          <p className="muted">No interviews scheduled yet.</p>
        )}
        <ul className="interview-list">
          {interviews.map((iv) => (
            <li
              key={iv.id}
              className={
                'interview-list__item' +
                (selected?.id === iv.candidate?.id
                  ? ' interview-list__item--active'
                  : '')
              }
            >
              <button
                type="button"
                className="interview-list__select"
                onClick={() => setSelected(iv.candidate)}
              >
                <span className="interview-list__time">
                  {new Date(iv.slot_start).toLocaleString([], {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
                <span className="interview-list__name">
                  {iv.candidate?.full_name || 'Candidate'}
                </span>
                <span className={`badge badge--${iv.status}`}>{iv.status}</span>
              </button>
              <div className="interview-list__actions">
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => setStatus(iv.id, 'completed')}
                >
                  Done
                </button>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => setStatus(iv.id, 'no_show')}
                >
                  No-show
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="dashboard__detail card">
        <CandidateProfile candidate={selected} />
      </div>
    </div>
  );
}
