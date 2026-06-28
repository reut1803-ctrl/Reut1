// =====================================================================
//  SchedulePage — pick a candidate, then book a 15-min interview slot.
// =====================================================================
import { useEffect, useState } from 'react';
import { useApp } from '../shared/AppContext';
import { candidatesApi } from '../shared/api';
import Scheduler from '../components/Scheduler';

export default function SchedulePage() {
  const { staff } = useApp();
  const [candidates, setCandidates] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [message, setMessage] = useState(null);

  useEffect(() => {
    candidatesApi.list().then(setCandidates).catch(() => {});
  }, []);

  const selected = candidates.find((c) => c.id === selectedId) || null;

  return (
    <section className="page">
      <h1 className="page__title">Schedule an interview</h1>

      <div className="card">
        <div className="field">
          <label className="field__label" htmlFor="cand">Candidate</label>
          <select
            id="cand"
            className="input"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            <option value="">— Select a candidate —</option>
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name || c.email || c.id.slice(0, 8)}
                {c.is_registered ? '' : ' (not registered)'}
              </option>
            ))}
          </select>
        </div>

        {message && <p className="form-ok">{message}</p>}

        <Scheduler
          matchmakerId={staff?.id}
          candidate={selected}
          onBooked={(slot) =>
            setMessage(
              `Booked ${selected?.full_name || 'candidate'} for ${slot.toLocaleString()}.`
            )
          }
        />
      </div>
    </section>
  );
}
