-- =====================================================================
--  Matchmaking & Interview Management Platform
--  Schema: tables, enums, indexes, storage buckets
--  Target: Supabase / PostgreSQL 15+
-- =====================================================================

-- ----------------------------------------------------------------------
-- Extensions
-- ----------------------------------------------------------------------
create extension if not exists "pgcrypto";   -- gen_random_uuid()

-- ----------------------------------------------------------------------
-- Enumerated types
-- ----------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'staff_role') then
    create type staff_role as enum ('admin', 'matchmaker');
  end if;

  if not exists (select 1 from pg_type where typname = 'gender_type') then
    -- 'any' lets a question apply to every candidate regardless of gender
    create type gender_type as enum ('male', 'female', 'any');
  end if;

  if not exists (select 1 from pg_type where typname = 'question_input_type') then
    create type question_input_type as enum (
      'text', 'textarea', 'number', 'select', 'multiselect', 'boolean', 'date'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'interview_status') then
    create type interview_status as enum ('scheduled', 'completed', 'cancelled', 'no_show');
  end if;
end$$;

-- ======================================================================
-- 1. STAFF  (1:1 with auth.users)
-- ======================================================================
create table if not exists public.staff (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text         not null,
  email       text         not null unique,
  role        staff_role   not null default 'matchmaker',
  is_active   boolean      not null default true,
  created_at  timestamptz  not null default now(),
  updated_at  timestamptz  not null default now()
);

comment on table public.staff is
  'Application staff. Each row is 1:1 with an auth.users record.';

-- ======================================================================
-- 2. CANDIDATES
-- ======================================================================
create table if not exists public.candidates (
  id              uuid primary key default gen_random_uuid(),
  -- Unguessable token used for the public registration link
  access_token    uuid         not null unique default gen_random_uuid(),
  full_name       text,
  email           text,
  phone           text,
  gender          gender_type,
  date_of_birth   date,
  city            text,
  -- Free-form additional profile fields kept flexible for the coordinator
  profile         jsonb        not null default '{}'::jsonb,
  is_registered   boolean      not null default false,
  registered_at   timestamptz,
  created_at      timestamptz  not null default now(),
  updated_at      timestamptz  not null default now()
);

create index if not exists idx_candidates_access_token on public.candidates (access_token);
create index if not exists idx_candidates_gender        on public.candidates (gender);

comment on table public.candidates is
  'Candidate profiles. access_token authorises anonymous public registration.';

-- ======================================================================
-- 3. QUESTIONS  (dynamic, gender-specific, sortable)
-- ======================================================================
create table if not exists public.questions (
  id            uuid primary key default gen_random_uuid(),
  label         text                 not null,
  help_text     text,
  input_type    question_input_type  not null default 'text',
  -- which gender this question is shown to ('any' = everyone)
  gender        gender_type          not null default 'any',
  -- option list for select / multiselect inputs
  options       jsonb                not null default '[]'::jsonb,
  is_required   boolean              not null default false,
  is_active     boolean              not null default true,
  sort_order    integer              not null default 0,
  created_at    timestamptz          not null default now(),
  updated_at    timestamptz          not null default now()
);

create index if not exists idx_questions_sort   on public.questions (sort_order);
create index if not exists idx_questions_gender  on public.questions (gender);

comment on table public.questions is
  'Admin-controlled dynamic questions that drive the registration form.';

-- ======================================================================
-- 4. ANSWERS  (normalised: one row per answer)
-- ======================================================================
create table if not exists public.answers (
  id            uuid primary key default gen_random_uuid(),
  candidate_id  uuid        not null references public.candidates (id) on delete cascade,
  question_id   uuid        not null references public.questions  (id) on delete cascade,
  value         text,                         -- canonical scalar value
  value_json    jsonb,                        -- used for multiselect / structured answers
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (candidate_id, question_id)
);

create index if not exists idx_answers_candidate on public.answers (candidate_id);
create index if not exists idx_answers_question  on public.answers (question_id);

comment on table public.answers is
  'Normalised candidate answers, one row per (candidate, question).';

-- ======================================================================
-- 5. INTERVIEWS  (slot-based, 15 minutes, no overlap per matchmaker)
-- ======================================================================
create table if not exists public.interviews (
  id            uuid primary key default gen_random_uuid(),
  candidate_id  uuid              not null references public.candidates (id) on delete cascade,
  matchmaker_id uuid              not null references public.staff      (id) on delete cascade,
  slot_start    timestamptz       not null,
  -- fixed 15-minute slot length, generated for convenience
  slot_end      timestamptz       not null generated always as (slot_start + interval '15 minutes') stored,
  status        interview_status  not null default 'scheduled',
  location      text,
  created_at    timestamptz       not null default now(),
  updated_at    timestamptz       not null default now(),
  -- A matchmaker cannot hold two interviews that start at the same slot
  constraint uq_matchmaker_slot unique (matchmaker_id, slot_start)
);

create index if not exists idx_interviews_matchmaker on public.interviews (matchmaker_id);
create index if not exists idx_interviews_candidate  on public.interviews (candidate_id);
create index if not exists idx_interviews_slot       on public.interviews (slot_start);

comment on table public.interviews is
  'Slot-based interviews. 15-min slots, unique per (matchmaker_id, slot_start).';

-- Guard against partial slot overlaps (not just identical starts)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'no_overlapping_interviews'
  ) then
    alter table public.interviews
      add constraint no_overlapping_interviews
      exclude using gist (
        matchmaker_id with =,
        tstzrange(slot_start, slot_start + interval '15 minutes') with &&
      );
  end if;
exception
  -- btree_gist is required for the '=' operator inside a gist exclusion.
  when undefined_object then
    create extension if not exists btree_gist;
    alter table public.interviews
      add constraint no_overlapping_interviews
      exclude using gist (
        matchmaker_id with =,
        tstzrange(slot_start, slot_start + interval '15 minutes') with &&
      );
end$$;

-- ======================================================================
-- 6. BRAINSTORMING NOTES  (private, per matchmaker)
-- ======================================================================
create table if not exists public.brainstorming_notes (
  id            uuid primary key default gen_random_uuid(),
  candidate_id  uuid        not null references public.candidates (id) on delete cascade,
  matchmaker_id uuid        not null references public.staff      (id) on delete cascade,
  body          text        not null default '',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_notes_matchmaker on public.brainstorming_notes (matchmaker_id);
create index if not exists idx_notes_candidate  on public.brainstorming_notes (candidate_id);

comment on table public.brainstorming_notes is
  'Private brainstorming notes. Visible only to the owning matchmaker (and admins).';

-- ======================================================================
-- 7. ADMIN SUMMARIES  (admin-written, per candidate)
-- ======================================================================
create table if not exists public.admin_summaries (
  id            uuid primary key default gen_random_uuid(),
  candidate_id  uuid        not null references public.candidates (id) on delete cascade,
  author_id     uuid        not null references public.staff      (id) on delete set null,
  summary       text        not null default '',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_summaries_candidate on public.admin_summaries (candidate_id);

comment on table public.admin_summaries is
  'Admin-authored candidate summaries. Read by all staff, written only by admins.';

-- ======================================================================
-- 8. THEME SETTINGS  (singleton)
-- ======================================================================
create table if not exists public.theme_settings (
  id              boolean primary key default true,           -- singleton guard
  brand_name      text    not null default 'פלטפורמת שידוכים',
  logo_url        text,                                         -- high-res logo path / public URL
  primary_color   text    not null default '#4F46E5',
  secondary_color text    not null default '#EC4899',
  accent_color    text    not null default '#10B981',
  font_family     text    not null default 'Assistant, system-ui, sans-serif',
  background_color text   not null default '#F9FAFB',
  text_color      text    not null default '#111827',
  extra           jsonb   not null default '{}'::jsonb,
  updated_at      timestamptz not null default now(),
  constraint theme_settings_singleton check (id = true)
);

comment on table public.theme_settings is
  'Singleton branding/theme configuration consumed by the frontend on load.';

-- Ensure the single row exists.
insert into public.theme_settings (id) values (true)
on conflict (id) do nothing;

-- ======================================================================
--  updated_at trigger helper
-- ======================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'staff','candidates','questions','answers','interviews',
    'brainstorming_notes','admin_summaries','theme_settings'
  ]
  loop
    execute format(
      'drop trigger if exists trg_set_updated_at on public.%I;', t);
    execute format(
      'create trigger trg_set_updated_at before update on public.%I
         for each row execute function public.set_updated_at();', t);
  end loop;
end$$;

-- ======================================================================
--  Auth helper: create a staff profile automatically for new auth users
--  (role defaults to matchmaker; promote to admin manually).
-- ======================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.staff (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    new.email,
    coalesce((new.raw_user_meta_data ->> 'role')::staff_role, 'matchmaker')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ======================================================================
--  STORAGE BUCKETS
--   - branding: public bucket for logos / branding assets
--   - candidate-uploads: private bucket for candidate documents
-- ======================================================================
insert into storage.buckets (id, name, public)
values ('branding', 'branding', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('candidate-uploads', 'candidate-uploads', false)
on conflict (id) do nothing;
