// =====================================================================
//  RegisterPage — public, token-gated candidate registration.
//  Reached via /register/:token. The candidate is resolved from their
//  unique access_token (no staff login required).
// =====================================================================
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { candidatesApi } from '../shared/api';
import RegistrationForm from '../components/RegistrationForm';

export default function RegisterPage() {
  const { token } = useParams();
  const [candidate, setCandidate] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | notfound

  useEffect(() => {
    let active = true;
    candidatesApi
      .getByToken(token)
      .then((c) => {
        if (!active) return;
        setCandidate(c);
        setStatus('ready');
      })
      .catch(() => active && setStatus('notfound'));
    return () => {
      active = false;
    };
  }, [token]);

  if (status === 'loading') {
    return <div className="page-loading">טוען את טופס ההרשמה שלך…</div>;
  }

  if (status === 'notfound') {
    return (
      <div className="card card--centered">
        <h2>הקישור לא נמצא</h2>
        <p>קישור ההרשמה אינו תקין או שפג תוקפו.</p>
      </div>
    );
  }

  return (
    <div className="register-page">
      <RegistrationForm candidate={candidate} />
    </div>
  );
}
