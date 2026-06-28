// =====================================================================
//  In-memory mock Supabase client — DEMO MODE ONLY.
//  Activated automatically when real Supabase credentials are absent
//  (see supabase.js). Lets the full UI run with sample data so the
//  platform can be demoed without a live backend. NOT used in
//  production — RLS and the real DB take over once env vars are set.
// =====================================================================

// ----------------------------------------------------------- sample data
const now = new Date();
function at(hourOffset, h, m) {
  const d = new Date(now);
  d.setDate(d.getDate() + hourOffset);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

const ADMIN = {
  id: 'staff-admin',
  full_name: 'ראות — רכזת קהילה',
  email: 'reut@example.com',
  role: 'admin',
  is_active: true,
};

const theme = {
  id: true,
  brand_name: 'לב אל לב — שידוכים בקהילה',
  logo_url: '/logo.svg',
  primary_color: '#6D28D9',
  secondary_color: '#DB2777',
  accent_color: '#059669',
  font_family: 'Inter, system-ui, sans-serif',
  background_color: '#FBF7FF',
  text_color: '#1F2937',
  extra: {},
};

const questions = [
  { id: 'q1', label: 'שם מלא', input_type: 'text', gender: 'any', options: [], is_required: true, is_active: true, sort_order: 10 },
  { id: 'q2', label: 'תאריך לידה', input_type: 'date', gender: 'any', options: [], is_required: true, is_active: true, sort_order: 20 },
  { id: 'q3', label: 'עיר מגורים', input_type: 'text', gender: 'any', options: [], is_required: true, is_active: true, sort_order: 30 },
  { id: 'q4', label: 'רמת דתיות', input_type: 'select', gender: 'any', options: ['חילוני', 'מסורתי', 'דתי', 'חרדי'], is_required: false, is_active: true, sort_order: 40 },
  { id: 'q5', label: 'ספרי על עצמך', input_type: 'textarea', gender: 'any', options: [], is_required: false, is_active: true, sort_order: 50 },
  { id: 'q6', label: 'כיסוי ראש', input_type: 'select', gender: 'female', options: ['כן', 'לא', 'פתוחה לדבר על זה'], is_required: false, is_active: true, sort_order: 60 },
  { id: 'q7', label: 'זקן', input_type: 'select', gender: 'male', options: ['מגולח', 'מעוצב', 'מלא'], is_required: false, is_active: true, sort_order: 70 },
];

const candidates = [
  { id: 'c1', access_token: 'demo-token-1', full_name: 'מירי כהן', email: 'miri@example.com', phone: '050-1111111', gender: 'female', city: 'ירושלים', is_registered: true, registered_at: at(-3, 10, 0), created_at: at(-5, 9, 0), profile: {} },
  { id: 'c2', access_token: 'demo-token-2', full_name: 'יוסי לוי', email: 'yossi@example.com', phone: '052-2222222', gender: 'male', city: 'תל אביב', is_registered: true, registered_at: at(-2, 14, 0), created_at: at(-4, 11, 0), profile: {} },
  { id: 'c3', access_token: 'demo-token-3', full_name: 'נועה אברהם', email: 'noa@example.com', phone: '054-3333333', gender: 'female', city: 'חיפה', is_registered: false, registered_at: null, created_at: at(-1, 8, 0), profile: {} },
];

const answers = [
  { id: 'a1', candidate_id: 'c1', question_id: 'q3', value: 'ירושלים', value_json: null, question: questions[2] },
  { id: 'a2', candidate_id: 'c1', question_id: 'q4', value: 'דתי', value_json: null, question: questions[3] },
  { id: 'a3', candidate_id: 'c1', question_id: 'q5', value: 'אוהבת טיולים, מוזיקה וקריאה. מחפשת קשר רציני ומשמעותי.', value_json: null, question: questions[4] },
  { id: 'a4', candidate_id: 'c1', question_id: 'q6', value: 'פתוחה לדבר על זה', value_json: null, question: questions[5] },
];

const interviews = [
  { id: 'i1', candidate_id: 'c1', matchmaker_id: 'staff-admin', slot_start: at(0, 10, 0), status: 'scheduled', candidate: candidates[0], matchmaker: ADMIN },
  { id: 'i2', candidate_id: 'c2', matchmaker_id: 'staff-admin', slot_start: at(0, 10, 30), status: 'scheduled', candidate: candidates[1], matchmaker: ADMIN },
  { id: 'i3', candidate_id: 'c3', matchmaker_id: 'staff-admin', slot_start: at(-1, 11, 0), status: 'completed', candidate: candidates[2], matchmaker: ADMIN },
];

const brainstorming_notes = [
  { id: 'n1', candidate_id: 'c1', matchmaker_id: 'staff-admin', body: 'התרשמות מצוינת מהראיון — בוגרת, חמה ועם ערכים ברורים. לבדוק התאמה עם מועמד #4.', created_at: at(-3, 12, 0) },
];

const admin_summaries = [
  { id: 's1', candidate_id: 'c1', author_id: 'staff-admin', summary: 'מועמדת איכותית. מומלץ לקדם להצעות בשבוע הקרוב.', author: { full_name: 'ראות — רכזת קהילה' }, created_at: at(-2, 9, 0) },
];

const store = {
  theme_settings: [theme],
  staff: [ADMIN],
  questions,
  candidates,
  answers,
  interviews,
  brainstorming_notes,
  admin_summaries,
};

// ------------------------------------------------------- query builder
function uid() {
  return 'demo-' + Math.random().toString(36).slice(2, 10);
}

class Query {
  constructor(table) {
    this.table = table;
    this.filters = [];
    this._single = false;
    this._pending = null; // mutation result rows
    this._op = 'select';
  }

  // filter helpers ----------------------------------------------------
  eq(col, val) { this.filters.push((r) => r[col] === val); return this; }
  in(col, vals) { this.filters.push((r) => vals.includes(r[col])); return this; }
  gte(col, val) { this.filters.push((r) => r[col] >= val); return this; }
  lt(col, val) { this.filters.push((r) => r[col] < val); return this; }
  order() { return this; }
  select() { return this; }
  single() { this._single = true; return this; }

  // mutations ---------------------------------------------------------
  insert(rows) {
    this._op = 'insert';
    const arr = Array.isArray(rows) ? rows : [rows];
    const created = arr.map((r) => ({ id: uid(), created_at: new Date().toISOString(), ...r }));
    store[this.table] = [...(store[this.table] || []), ...created];
    this._pending = created;
    return this;
  }

  upsert(rows) {
    this._op = 'upsert';
    const arr = Array.isArray(rows) ? rows : [rows];
    const created = arr.map((r) => ({ id: uid(), ...r }));
    store[this.table] = [...(store[this.table] || []), ...created];
    this._pending = created;
    return this;
  }

  update(patch) {
    this._op = 'update';
    this._patch = patch;
    return this;
  }

  delete() { this._op = 'delete'; return this; }

  // resolution --------------------------------------------------------
  _rows() {
    let rows = [...(store[this.table] || [])];
    for (const f of this.filters) rows = rows.filter(f);
    return rows;
  }

  _resolve() {
    let data;
    if (this._op === 'insert' || this._op === 'upsert') {
      data = this._pending;
    } else if (this._op === 'update') {
      const matched = this._rows();
      matched.forEach((r) => Object.assign(r, this._patch));
      data = matched;
    } else if (this._op === 'delete') {
      const keep = (store[this.table] || []).filter(
        (r) => !this.filters.every((f) => f(r))
      );
      store[this.table] = keep;
      data = [];
    } else {
      data = this._rows();
    }
    if (this._single) data = data[0] ?? null;
    return { data, error: null };
  }

  then(resolve) { resolve(this._resolve()); }
}

// ------------------------------------------------------------- auth
let session = {
  user: { id: ADMIN.id, email: ADMIN.email },
  access_token: 'demo-access-token',
};
const listeners = new Set();

const auth = {
  async getSession() { return { data: { session } }; },
  async signInWithPassword() {
    session = { user: { id: ADMIN.id, email: ADMIN.email }, access_token: 'demo' };
    listeners.forEach((cb) => cb('SIGNED_IN', session));
    return { data: { session }, error: null };
  },
  async signOut() {
    session = null;
    listeners.forEach((cb) => cb('SIGNED_OUT', null));
    return { error: null };
  },
  onAuthStateChange(cb) {
    listeners.add(cb);
    return { data: { subscription: { unsubscribe: () => listeners.delete(cb) } } };
  },
};

// ----------------------------------------------------------- storage
const storage = {
  from() {
    return {
      getPublicUrl: (path) => ({ data: { publicUrl: path } }),
      async upload(path) { return { data: { path }, error: null }; },
    };
  },
};

export const mockSupabase = {
  from: (table) => new Query(table),
  auth,
  storage,
};

export default mockSupabase;
