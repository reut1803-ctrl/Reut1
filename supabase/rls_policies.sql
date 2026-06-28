-- =====================================================================
--  Row Level Security (RLS) policies
--  Rules:
--    * matchmakers  -> read/write ONLY their own interviews & notes
--    * admins       -> full read/write on every table
--    * public/anon  -> registration (via access_token) + branding read
--  NOTE: the service-role key bypasses RLS entirely and is used by the
--        server / edge functions for privileged public flows.
-- =====================================================================

-- ----------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER so they can read public.staff
-- without being blocked by the staff table's own RLS).
-- ----------------------------------------------------------------------
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.staff
    where id = auth.uid() and is_active
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.staff
    where id = auth.uid() and is_active and role = 'admin'
  );
$$;

-- ----------------------------------------------------------------------
-- Enable RLS on all application tables
-- ----------------------------------------------------------------------
alter table public.staff               enable row level security;
alter table public.candidates          enable row level security;
alter table public.questions           enable row level security;
alter table public.answers             enable row level security;
alter table public.interviews          enable row level security;
alter table public.brainstorming_notes enable row level security;
alter table public.admin_summaries     enable row level security;
alter table public.theme_settings      enable row level security;

-- ======================================================================
--  STAFF
--   * a staff member can read their own row
--   * admins can read/write every staff row
-- ======================================================================
drop policy if exists staff_select_self    on public.staff;
drop policy if exists staff_select_admin   on public.staff;
drop policy if exists staff_admin_all      on public.staff;
drop policy if exists staff_update_self    on public.staff;

create policy staff_select_self on public.staff
  for select using (id = auth.uid());

create policy staff_select_admin on public.staff
  for select using (public.is_admin());

create policy staff_update_self on public.staff
  for update using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.staff s where s.id = auth.uid()));

create policy staff_admin_all on public.staff
  for all using (public.is_admin()) with check (public.is_admin());

-- ======================================================================
--  CANDIDATES
--   * any active staff member may read candidates
--   * admins have full write
--   * matchmakers may read (needed for dashboards) but not delete
--   * public registration is handled via the service-role key (RLS bypassed)
-- ======================================================================
drop policy if exists candidates_staff_read on public.candidates;
drop policy if exists candidates_admin_all  on public.candidates;
drop policy if exists candidates_mm_update  on public.candidates;

create policy candidates_staff_read on public.candidates
  for select using (public.is_staff());

create policy candidates_mm_update on public.candidates
  for update using (public.is_staff()) with check (public.is_staff());

create policy candidates_admin_all on public.candidates
  for all using (public.is_admin()) with check (public.is_admin());

-- ======================================================================
--  QUESTIONS
--   * all staff may read
--   * only admins may write (admin-controlled via UI)
-- ======================================================================
drop policy if exists questions_staff_read on public.questions;
drop policy if exists questions_admin_all  on public.questions;

create policy questions_staff_read on public.questions
  for select using (public.is_staff());

create policy questions_admin_all on public.questions
  for all using (public.is_admin()) with check (public.is_admin());

-- ======================================================================
--  ANSWERS
--   * all staff may read
--   * admins full write; public submission via service-role
-- ======================================================================
drop policy if exists answers_staff_read on public.answers;
drop policy if exists answers_admin_all  on public.answers;

create policy answers_staff_read on public.answers
  for select using (public.is_staff());

create policy answers_admin_all on public.answers
  for all using (public.is_admin()) with check (public.is_admin());

-- ======================================================================
--  INTERVIEWS
--   * matchmakers: read/write ONLY rows where matchmaker_id = auth.uid()
--   * admins: full access
-- ======================================================================
drop policy if exists interviews_mm_select on public.interviews;
drop policy if exists interviews_mm_insert on public.interviews;
drop policy if exists interviews_mm_update on public.interviews;
drop policy if exists interviews_mm_delete on public.interviews;
drop policy if exists interviews_admin_all on public.interviews;

create policy interviews_mm_select on public.interviews
  for select using (matchmaker_id = auth.uid());

create policy interviews_mm_insert on public.interviews
  for insert with check (matchmaker_id = auth.uid());

create policy interviews_mm_update on public.interviews
  for update using (matchmaker_id = auth.uid())
              with check (matchmaker_id = auth.uid());

create policy interviews_mm_delete on public.interviews
  for delete using (matchmaker_id = auth.uid());

create policy interviews_admin_all on public.interviews
  for all using (public.is_admin()) with check (public.is_admin());

-- ======================================================================
--  BRAINSTORMING NOTES
--   * matchmakers: read/write ONLY their own notes
--   * admins: full access
-- ======================================================================
drop policy if exists notes_mm_select on public.brainstorming_notes;
drop policy if exists notes_mm_insert on public.brainstorming_notes;
drop policy if exists notes_mm_update on public.brainstorming_notes;
drop policy if exists notes_mm_delete on public.brainstorming_notes;
drop policy if exists notes_admin_all on public.brainstorming_notes;

create policy notes_mm_select on public.brainstorming_notes
  for select using (matchmaker_id = auth.uid());

create policy notes_mm_insert on public.brainstorming_notes
  for insert with check (matchmaker_id = auth.uid());

create policy notes_mm_update on public.brainstorming_notes
  for update using (matchmaker_id = auth.uid())
              with check (matchmaker_id = auth.uid());

create policy notes_mm_delete on public.brainstorming_notes
  for delete using (matchmaker_id = auth.uid());

create policy notes_admin_all on public.brainstorming_notes
  for all using (public.is_admin()) with check (public.is_admin());

-- ======================================================================
--  ADMIN SUMMARIES
--   * all staff may read
--   * only admins may write
-- ======================================================================
drop policy if exists summaries_staff_read on public.admin_summaries;
drop policy if exists summaries_admin_all  on public.admin_summaries;

create policy summaries_staff_read on public.admin_summaries
  for select using (public.is_staff());

create policy summaries_admin_all on public.admin_summaries
  for all using (public.is_admin()) with check (public.is_admin());

-- ======================================================================
--  THEME SETTINGS
--   * readable by EVERYONE incl. anon (branding loads before login)
--   * writable only by admins
-- ======================================================================
drop policy if exists theme_public_read on public.theme_settings;
drop policy if exists theme_admin_write on public.theme_settings;

create policy theme_public_read on public.theme_settings
  for select using (true);

create policy theme_admin_write on public.theme_settings
  for all using (public.is_admin()) with check (public.is_admin());

-- ======================================================================
--  STORAGE POLICIES
--   branding bucket: public read, admin write
--   candidate-uploads bucket: staff read, service-role write
-- ======================================================================
drop policy if exists branding_public_read on storage.objects;
drop policy if exists branding_admin_write on storage.objects;
drop policy if exists uploads_staff_read   on storage.objects;

create policy branding_public_read on storage.objects
  for select using (bucket_id = 'branding');

create policy branding_admin_write on storage.objects
  for all using (bucket_id = 'branding' and public.is_admin())
          with check (bucket_id = 'branding' and public.is_admin());

create policy uploads_staff_read on storage.objects
  for select using (bucket_id = 'candidate-uploads' and public.is_staff());
