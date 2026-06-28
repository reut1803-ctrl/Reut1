// =====================================================================
//  AdminControlPanel — CRUD for theme/branding and questions.
//  Two tabs: Branding (theme_settings singleton) and Questions.
// =====================================================================
import { useEffect, useState } from 'react';
import { useApp } from '../shared/AppContext';
import { supabase } from '../shared/supabase';
import { themeApi, questionsApi } from '../shared/api';

// ---------------------------------------------------------- Branding tab
function BrandingPanel() {
  const { theme, refreshTheme } = useApp();
  const [form, setForm] = useState(theme);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);

  useEffect(() => setForm(theme), [theme]);

  const set = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const save = async () => {
    setStatus('saving');
    setError(null);
    try {
      await themeApi.update({
        brand_name: form.brand_name,
        logo_url: form.logo_url,
        primary_color: form.primary_color,
        secondary_color: form.secondary_color,
        accent_color: form.accent_color,
        font_family: form.font_family,
        background_color: form.background_color,
        text_color: form.text_color,
      });
      await refreshTheme();
      setStatus('saved');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  };

  // Upload a high-res logo to the public `branding` bucket.
  const uploadLogo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus('uploading');
    setError(null);
    try {
      const path = `logo-${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage
        .from('branding')
        .upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      setForm((prev) => ({ ...prev, logo_url: path }));
      setStatus('idle');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  };

  return (
    <div className="card">
      <h3>מיתוג ועיצוב</h3>

      <div className="field">
        <label className="field__label">שם המותג</label>
        <input className="input" value={form.brand_name || ''} onChange={set('brand_name')} />
      </div>

      <div className="field">
        <label className="field__label">לוגו (ברזולוציה גבוהה)</label>
        <input type="file" accept="image/*" onChange={uploadLogo} />
        <input
          className="input"
          placeholder="נתיב קובץ או כתובת אינטרנט מלאה"
          value={form.logo_url || ''}
          onChange={set('logo_url')}
        />
      </div>

      <div className="grid-2">
        <ColorField label="צבע ראשי" value={form.primary_color} onChange={set('primary_color')} />
        <ColorField label="צבע משני" value={form.secondary_color} onChange={set('secondary_color')} />
        <ColorField label="צבע הדגשה" value={form.accent_color} onChange={set('accent_color')} />
        <ColorField label="צבע רקע" value={form.background_color} onChange={set('background_color')} />
        <ColorField label="צבע טקסט" value={form.text_color} onChange={set('text_color')} />
      </div>

      <div className="field">
        <label className="field__label">גופן</label>
        <input className="input" value={form.font_family || ''} onChange={set('font_family')} />
      </div>

      {error && <p className="form-error">{error}</p>}
      <button type="button" className="btn btn--primary" onClick={save} disabled={status === 'saving'}>
        {status === 'saving' ? 'שומר…' : 'שמירת המיתוג'}
      </button>
      {status === 'saved' && <span className="form-ok"> נשמר ✓</span>}
    </div>
  );
}

function ColorField({ label, value, onChange }) {
  return (
    <div className="field field--color">
      <label className="field__label">{label}</label>
      <div className="field__color-row">
        <input type="color" value={value || '#000000'} onChange={onChange} />
        <input className="input" value={value || ''} onChange={onChange} />
      </div>
    </div>
  );
}

// --------------------------------------------------------- Questions tab
const EMPTY_Q = {
  label: '',
  input_type: 'text',
  gender: 'any',
  options: [],
  is_required: false,
  is_active: true,
  sort_order: 0,
};

// תוויות בעברית לסוגי השדה ולמגדר (הערך הנשמר נשאר באנגלית עבור מסד הנתונים)
const INPUT_TYPE_LABELS = {
  text: 'טקסט קצר',
  textarea: 'טקסט ארוך',
  number: 'מספר',
  select: 'בחירה אחת',
  multiselect: 'בחירה מרובה',
  boolean: 'כן / לא',
  date: 'תאריך',
};
const GENDER_LABELS = { any: 'כולם', female: 'נשים', male: 'גברים' };

function QuestionsPanel() {
  const [questions, setQuestions] = useState([]);
  const [editing, setEditing] = useState(EMPTY_Q);
  const [error, setError] = useState(null);

  const load = () =>
    questionsApi.listAll().then(setQuestions).catch((e) => setError(e.message));

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    setError(null);
    try {
      const payload = {
        ...editing,
        options:
          typeof editing.options === 'string'
            ? editing.options.split('\n').map((s) => s.trim()).filter(Boolean)
            : editing.options,
        sort_order: Number(editing.sort_order) || 0,
      };
      if (editing.id) {
        await questionsApi.update(editing.id, payload);
      } else {
        await questionsApi.create(payload);
      }
      setEditing(EMPTY_Q);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const edit = (q) =>
    setEditing({ ...q, options: (q.options || []).join('\n') });

  const remove = async (id) => {
    await questionsApi.remove(id);
    await load();
  };

  const move = async (q, delta) => {
    await questionsApi.update(q.id, { sort_order: (q.sort_order || 0) + delta });
    await load();
  };

  return (
    <div className="card">
      <h3>שאלות</h3>
      {error && <p className="form-error">{error}</p>}

      <table className="table">
        <thead>
          <tr>
            <th>סדר</th>
            <th>שאלה</th>
            <th>סוג</th>
            <th>מיועד ל</th>
            <th>פעיל</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {questions.map((q) => (
            <tr key={q.id}>
              <td>
                <button className="btn btn--ghost btn--sm" onClick={() => move(q, -10)}>↑</button>
                {q.sort_order}
                <button className="btn btn--ghost btn--sm" onClick={() => move(q, 10)}>↓</button>
              </td>
              <td>{q.label}</td>
              <td>{INPUT_TYPE_LABELS[q.input_type] || q.input_type}</td>
              <td>{GENDER_LABELS[q.gender] || q.gender}</td>
              <td>{q.is_active ? '✓' : '—'}</td>
              <td>
                <button className="btn btn--ghost btn--sm" onClick={() => edit(q)}>עריכה</button>
                <button className="btn btn--ghost btn--sm" onClick={() => remove(q.id)}>מחיקה</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h4>{editing.id ? 'עריכת שאלה' : 'שאלה חדשה'}</h4>
      <div className="field">
        <label className="field__label">נוסח השאלה</label>
        <input
          className="input"
          value={editing.label}
          onChange={(e) => setEditing({ ...editing, label: e.target.value })}
        />
      </div>

      <div className="grid-2">
        <div className="field">
          <label className="field__label">סוג השדה</label>
          <select
            className="input"
            value={editing.input_type}
            onChange={(e) => setEditing({ ...editing, input_type: e.target.value })}
          >
            {['text', 'textarea', 'number', 'select', 'multiselect', 'boolean', 'date'].map((t) => (
              <option key={t} value={t}>{INPUT_TYPE_LABELS[t]}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="field__label">מיועד ל</label>
          <select
            className="input"
            value={editing.gender}
            onChange={(e) => setEditing({ ...editing, gender: e.target.value })}
          >
            {['any', 'female', 'male'].map((g) => (
              <option key={g} value={g}>{GENDER_LABELS[g]}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="field__label">סדר הופעה</label>
          <input
            className="input"
            type="number"
            value={editing.sort_order}
            onChange={(e) => setEditing({ ...editing, sort_order: e.target.value })}
          />
        </div>
        <div className="field field--inline">
          <label className="field__label">
            <input
              type="checkbox"
              checked={editing.is_required}
              onChange={(e) => setEditing({ ...editing, is_required: e.target.checked })}
            />{' '}
            חובה
          </label>
          <label className="field__label">
            <input
              type="checkbox"
              checked={editing.is_active}
              onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })}
            />{' '}
            פעיל
          </label>
        </div>
      </div>

      {['select', 'multiselect'].includes(editing.input_type) && (
        <div className="field">
          <label className="field__label">אפשרויות (אחת בכל שורה)</label>
          <textarea
            className="input"
            rows={4}
            value={
              typeof editing.options === 'string'
                ? editing.options
                : (editing.options || []).join('\n')
            }
            onChange={(e) => setEditing({ ...editing, options: e.target.value })}
          />
        </div>
      )}

      <button type="button" className="btn btn--primary" onClick={save}>
        {editing.id ? 'עדכון השאלה' : 'הוספת שאלה'}
      </button>
      {editing.id && (
        <button type="button" className="btn btn--ghost" onClick={() => setEditing(EMPTY_Q)}>
          ביטול
        </button>
      )}
    </div>
  );
}

export default function AdminControlPanel() {
  const [tab, setTab] = useState('branding');
  return (
    <div className="admin">
      <div className="tabs">
        <button
          className={'tab' + (tab === 'branding' ? ' tab--active' : '')}
          onClick={() => setTab('branding')}
        >
          מיתוג ועיצוב
        </button>
        <button
          className={'tab' + (tab === 'questions' ? ' tab--active' : '')}
          onClick={() => setTab('questions')}
        >
          שאלות
        </button>
      </div>
      {tab === 'branding' ? <BrandingPanel /> : <QuestionsPanel />}
    </div>
  );
}
