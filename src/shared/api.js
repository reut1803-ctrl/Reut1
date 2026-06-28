// =====================================================================
//  Data-access layer.
//  Thin, typed-by-convention wrappers around supabase select/insert/update.
//  Keeping queries here means components stay declarative and the table
//  shape lives in one place.
// =====================================================================
import { supabase } from './supabase';

// ---------------------------------------------------------------- Theme
export const themeApi = {
  /** Load the singleton theme_settings row (readable by anon). */
  async get() {
    const { data, error } = await supabase
      .from('theme_settings')
      .select('*')
      .eq('id', true)
      .single();
    if (error) throw error;
    return data;
  },

  /** Admin-only update of branding/theme. */
  async update(patch) {
    const { data, error } = await supabase
      .from('theme_settings')
      .update(patch)
      .eq('id', true)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

// ------------------------------------------------------------- Questions
export const questionsApi = {
  /** All active questions ordered for display. */
  async listActive() {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return data;
  },

  /** Active questions filtered for a candidate's gender (incl. 'any'). */
  async listForGender(gender) {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('is_active', true)
      .in('gender', gender ? [gender, 'any'] : ['any'])
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return data;
  },

  /** Admin: every question regardless of status. */
  async listAll() {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return data;
  },

  async create(question) {
    const { data, error } = await supabase
      .from('questions')
      .insert(question)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, patch) {
    const { data, error } = await supabase
      .from('questions')
      .update(patch)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async remove(id) {
    const { error } = await supabase.from('questions').delete().eq('id', id);
    if (error) throw error;
  },
};

// ------------------------------------------------------------ Candidates
export const candidatesApi = {
  async list() {
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getByToken(token) {
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .eq('access_token', token)
      .single();
    if (error) throw error;
    return data;
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async create(candidate) {
    const { data, error } = await supabase
      .from('candidates')
      .insert(candidate)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, patch) {
    const { data, error } = await supabase
      .from('candidates')
      .update(patch)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

// --------------------------------------------------------------- Answers
export const answersApi = {
  async listForCandidate(candidateId) {
    const { data, error } = await supabase
      .from('answers')
      .select('*, question:questions(*)')
      .eq('candidate_id', candidateId);
    if (error) throw error;
    return data;
  },

  /**
   * Upsert a batch of answers (one row per question).
   * `entries` = [{ question_id, value, value_json }]
   */
  async saveBatch(candidateId, entries) {
    const rows = entries.map((e) => ({
      candidate_id: candidateId,
      question_id: e.question_id,
      value: e.value ?? null,
      value_json: e.value_json ?? null,
    }));
    const { data, error } = await supabase
      .from('answers')
      .upsert(rows, { onConflict: 'candidate_id,question_id' })
      .select();
    if (error) throw error;
    return data;
  },
};

// ------------------------------------------------------------ Interviews
export const interviewsApi = {
  /** Interviews for the signed-in matchmaker (RLS scopes the rows). */
  async listMine() {
    const { data, error } = await supabase
      .from('interviews')
      .select('*, candidate:candidates(*)')
      .order('slot_start', { ascending: true });
    if (error) throw error;
    return data;
  },

  /** All interviews (admin view). */
  async listAll() {
    const { data, error } = await supabase
      .from('interviews')
      .select('*, candidate:candidates(*), matchmaker:staff(*)')
      .order('slot_start', { ascending: true });
    if (error) throw error;
    return data;
  },

  /** Booked slots for a matchmaker on a given day (for the scheduler grid). */
  async bookedSlots(matchmakerId, dayStartISO, dayEndISO) {
    const { data, error } = await supabase
      .from('interviews')
      .select('id, slot_start, status')
      .eq('matchmaker_id', matchmakerId)
      .gte('slot_start', dayStartISO)
      .lt('slot_start', dayEndISO);
    if (error) throw error;
    return data;
  },

  async book({ candidateId, matchmakerId, slotStart, location }) {
    const { data, error } = await supabase
      .from('interviews')
      .insert({
        candidate_id: candidateId,
        matchmaker_id: matchmakerId,
        slot_start: slotStart,
        location,
      })
      .select()
      .single();
    if (error) throw error; // unique/exclusion violation => slot taken
    return data;
  },

  async updateStatus(id, status) {
    const { data, error } = await supabase
      .from('interviews')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async cancel(id) {
    const { error } = await supabase.from('interviews').delete().eq('id', id);
    if (error) throw error;
  },
};

// --------------------------------------------------- Brainstorming notes
export const notesApi = {
  /** Private notes for the signed-in matchmaker on a candidate. */
  async listForCandidate(candidateId) {
    const { data, error } = await supabase
      .from('brainstorming_notes')
      .select('*')
      .eq('candidate_id', candidateId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async create({ candidateId, matchmakerId, body }) {
    const { data, error } = await supabase
      .from('brainstorming_notes')
      .insert({ candidate_id: candidateId, matchmaker_id: matchmakerId, body })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, body) {
    const { data, error } = await supabase
      .from('brainstorming_notes')
      .update({ body })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async remove(id) {
    const { error } = await supabase
      .from('brainstorming_notes')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};

// ----------------------------------------------------- Admin summaries
export const summariesApi = {
  async listForCandidate(candidateId) {
    const { data, error } = await supabase
      .from('admin_summaries')
      .select('*, author:staff(full_name)')
      .eq('candidate_id', candidateId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async create({ candidateId, authorId, summary }) {
    const { data, error } = await supabase
      .from('admin_summaries')
      .insert({ candidate_id: candidateId, author_id: authorId, summary })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, summary) {
    const { data, error } = await supabase
      .from('admin_summaries')
      .update({ summary })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};
