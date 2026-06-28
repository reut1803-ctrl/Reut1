// =====================================================================
//  RegistrationForm — dynamically generated from the questions table.
//  Renders the correct input per question.input_type and filters by the
//  candidate's gender. Saves one normalised row per answer.
// =====================================================================
import { useEffect, useMemo, useState } from 'react';
import { questionsApi, candidatesApi, answersApi } from '../shared/api';

function FieldInput({ question, value, onChange }) {
  const common = {
    id: `q_${question.id}`,
    value: value ?? '',
    required: question.is_required,
    onChange: (e) => onChange(question.id, e.target.value),
  };

  switch (question.input_type) {
    case 'textarea':
      return <textarea className="input" rows={4} {...common} />;
    case 'number':
      return <input className="input" type="number" {...common} />;
    case 'date':
      return <input className="input" type="date" {...common} />;
    case 'boolean':
      return (
        <input
          id={`q_${question.id}`}
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(question.id, e.target.checked)}
        />
      );
    case 'select':
      return (
        <select className="input" {...common}>
          <option value="">— Select —</option>
          {(question.options || []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    case 'multiselect':
      return (
        <div className="checkbox-group">
          {(question.options || []).map((opt) => {
            const arr = Array.isArray(value) ? value : [];
            const checked = arr.includes(opt);
            return (
              <label key={opt} className="checkbox-group__item">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    const next = checked
                      ? arr.filter((v) => v !== opt)
                      : [...arr, opt];
                    onChange(question.id, next);
                  }}
                />
                {opt}
              </label>
            );
          })}
        </div>
      );
    default:
      return <input className="input" type="text" {...common} />;
  }
}

export default function RegistrationForm({ candidate, onSubmitted }) {
  const [questions, setQuestions] = useState([]);
  const [values, setValues] = useState({});
  const [gender, setGender] = useState(candidate?.gender || 'any');
  const [status, setStatus] = useState('idle'); // idle | loading | saving | done | error
  const [error, setError] = useState(null);

  // Load questions appropriate to the candidate's gender.
  useEffect(() => {
    let active = true;
    setStatus('loading');
    questionsApi
      .listForGender(gender)
      .then((rows) => active && (setQuestions(rows), setStatus('idle')))
      .catch((err) => active && (setError(err.message), setStatus('error')));
    return () => {
      active = false;
    };
  }, [gender]);

  const handleChange = (questionId, value) =>
    setValues((prev) => ({ ...prev, [questionId]: value }));

  const multiselectIds = useMemo(
    () =>
      new Set(
        questions.filter((q) => q.input_type === 'multiselect').map((q) => q.id)
      ),
    [questions]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('saving');
    setError(null);
    try {
      // 1. mark candidate registered + persist gender.
      await candidatesApi.update(candidate.id, {
        gender,
        is_registered: true,
        registered_at: new Date().toISOString(),
      });

      // 2. normalise answers — one row per question.
      const entries = questions.map((q) => {
        if (multiselectIds.has(q.id)) {
          return { question_id: q.id, value_json: values[q.id] ?? [] };
        }
        return { question_id: q.id, value: stringify(values[q.id]) };
      });
      await answersApi.saveBatch(candidate.id, entries);

      setStatus('done');
      onSubmitted?.();
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  };

  if (status === 'done') {
    return (
      <div className="card card--centered">
        <h2>Thank you! 🎉</h2>
        <p>Your registration has been received.</p>
      </div>
    );
  }

  return (
    <form className="card registration-form" onSubmit={handleSubmit}>
      <h2 className="registration-form__title">Registration</h2>

      <div className="field">
        <label className="field__label" htmlFor="gender">
          I am
        </label>
        <select
          id="gender"
          className="input"
          value={gender}
          onChange={(e) => setGender(e.target.value)}
        >
          <option value="female">Female</option>
          <option value="male">Male</option>
          <option value="any">Prefer not to say</option>
        </select>
      </div>

      {status === 'loading' && <p>Loading questions…</p>}

      {questions.map((q) => (
        <div className="field" key={q.id}>
          <label className="field__label" htmlFor={`q_${q.id}`}>
            {q.label}
            {q.is_required && <span className="field__required"> *</span>}
          </label>
          {q.help_text && <p className="field__help">{q.help_text}</p>}
          <FieldInput
            question={q}
            value={values[q.id]}
            onChange={handleChange}
          />
        </div>
      ))}

      {error && <p className="form-error">{error}</p>}

      <button
        type="submit"
        className="btn btn--primary"
        disabled={status === 'saving'}
      >
        {status === 'saving' ? 'Submitting…' : 'Submit registration'}
      </button>
    </form>
  );
}

function stringify(v) {
  if (v === undefined || v === null) return null;
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  return String(v);
}
