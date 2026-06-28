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
      <h1 className="page__title">קביעת ראיון</h1>

      <div className="card">
        <div className="field">
          <label className="field__label" htmlFor="cand">מועמד/ת</label>
          <select
            id="cand"
            className="input"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            <option value="">— בחירת מועמד/ת —</option>
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name || c.email || c.id.slice(0, 8)}
                {c.is_registered ? '' : ' (טרם נרשם/ה)'}
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
              `נקבע ראיון ל${selected?.full_name || 'מועמד/ת'} בתאריך ${slot.toLocaleString('he-IL')}.`
            )
          }
        />
      </div>
    </section>
  );
}
