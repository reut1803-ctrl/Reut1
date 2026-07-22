-- מאגר שידוכים - סכמת מסד נתונים והרשאות (RLS)
-- מריצים את כל הקובץ הזה פעם אחת ב-Supabase: SQL Editor -> New query -> להדביק -> Run

-- ---------- פרופילי משתמשים ----------
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  phone text,
  role text not null default 'viewer' check (role in ('admin', 'staff', 'viewer')),
  notifications_enabled boolean not null default true,
  terms_accepted boolean not null default false,
  created_at timestamptz not null default now()
);

alter table profiles add column if not exists email text;
alter table profiles add column if not exists terms_accepted boolean not null default false;

alter table profiles enable row level security;

-- פונקציית עזר שבודקת אם המשתמש הנוכחי הוא מנהלת/צוות, בלי לגרום לרקורסיה ב-RLS
create or replace function auth_role() returns text
language sql security definer stable
set search_path = public
as $$
  select role from profiles where id = auth.uid()
$$;

drop policy if exists "profiles_select_own_or_staff" on profiles;
create policy "profiles_select_own_or_staff" on profiles
  for select using (id = auth.uid() or auth_role() in ('staff', 'admin'));

drop policy if exists "profiles_update_own" on profiles;
create policy "profiles_update_own" on profiles
  for update using (id = auth.uid());

-- מנהלת יכולה לעדכן את הפרופיל וההרשאה של כל אחת (מסך "ניהול צוות")
drop policy if exists "profiles_update_admin" on profiles;
create policy "profiles_update_admin" on profiles
  for update using (auth_role() = 'admin') with check (auth_role() = 'admin');

-- יצירת פרופיל אוטומטית בהרשמה חדשה (ברירת מחדל: צופה)
create or replace function handle_new_user() returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name', 'viewer');
  return new;
end;
$$;

-- למשתמשות שכבר נרשמו לפני העדכון הזה - למלא את האימייל שלהן
update profiles set email = auth.users.email
from auth.users
where profiles.id = auth.users.id and profiles.email is null;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ---------- מועמדים/כרטיסיות ----------
create table if not exists candidates (
  id uuid primary key default gen_random_uuid(),
  gender text not null check (gender in ('male', 'female')),
  name text not null,
  age int not null,
  height int not null,
  region text not null,
  religious_level text not null,
  study text,
  smoking text,
  traits text[] not null default '{}',
  about text,
  image_url text,
  is_new boolean not null default false,
  is_previous boolean not null default false,
  created_at timestamptz not null default now()
);

alter table candidates enable row level security;

drop policy if exists "candidates_select_authenticated" on candidates;
create policy "candidates_select_authenticated" on candidates
  for select using (auth.uid() is not null);

drop policy if exists "candidates_write_admin" on candidates;
create policy "candidates_write_admin" on candidates
  for all using (auth_role() = 'admin') with check (auth_role() = 'admin');

-- מידע רגיש (הערות פנימיות) - גלוי רק לצוות ולמנהלת, לא לצופות
create table if not exists candidate_internal_notes (
  candidate_id uuid primary key references candidates (id) on delete cascade,
  staff_note text,
  admin_note text,
  updated_at timestamptz not null default now()
);

alter table candidate_internal_notes enable row level security;

drop policy if exists "internal_notes_staff_admin" on candidate_internal_notes;
create policy "internal_notes_staff_admin" on candidate_internal_notes
  for all using (auth_role() in ('staff', 'admin')) with check (auth_role() in ('staff', 'admin'));

-- ---------- מועדפים ----------
create table if not exists favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  candidate_id uuid not null references candidates (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, candidate_id)
);

alter table favorites enable row level security;

drop policy if exists "favorites_own" on favorites;
create policy "favorites_own" on favorites
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- התראות ----------
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  text text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table notifications enable row level security;

drop policy if exists "notifications_own" on notifications;
create policy "notifications_own" on notifications
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- שאלון ההתאמות ----------
create table if not exists wizard_answers (
  user_id uuid primary key references auth.users (id) on delete cascade,
  age_min int not null default 21,
  age_max int not null default 30,
  height_min int not null default 160,
  height_max int not null default 185,
  torah_level text not null default 'לא משנה',
  regions text[] not null default '{}',
  education text not null default 'לא משנה',
  smoking text not null default 'לא משנה',
  traits text[] not null default '{}',
  completed boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table wizard_answers enable row level security;

drop policy if exists "wizard_answers_own" on wizard_answers;
create policy "wizard_answers_own" on wizard_answers
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- משפך התאמות (Pipeline) - לצוות ולמנהלת בלבד ----------
create table if not exists pipeline_status (
  candidate_id uuid primary key references candidates (id) on delete cascade,
  status text not null default 'בבירורים',
  updated_by uuid references auth.users (id),
  updated_at timestamptz not null default now()
);

alter table pipeline_status enable row level security;

drop policy if exists "pipeline_status_staff_admin" on pipeline_status;
create policy "pipeline_status_staff_admin" on pipeline_status
  for all using (auth_role() in ('staff', 'admin')) with check (auth_role() in ('staff', 'admin'));

-- ---------- הצעות שידוך (התאמה בין שני מועמדים) - לצוות ולמנהלת בלבד ----------
create table if not exists proposals (
  id uuid primary key default gen_random_uuid(),
  male_candidate_id uuid not null references candidates (id) on delete cascade,
  female_candidate_id uuid not null references candidates (id) on delete cascade,
  rationale text,
  stage text not null default 'בבירורים',
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table proposals enable row level security;

drop policy if exists "proposals_staff_admin" on proposals;
create policy "proposals_staff_admin" on proposals
  for all using (auth_role() in ('staff', 'admin')) with check (auth_role() in ('staff', 'admin'));

-- ---------- משימות צוות - לצוות ולמנהלת בלבד ----------
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  due_date date,
  done boolean not null default false,
  assignee_id uuid references auth.users (id),
  candidate_id uuid references candidates (id) on delete set null,
  created_by uuid references auth.users (id),
  pushed_by_admin boolean not null default false,
  seen_by_assignee boolean not null default false,
  created_at timestamptz not null default now()
);

alter table tasks enable row level security;

drop policy if exists "tasks_staff_admin" on tasks;
create policy "tasks_staff_admin" on tasks
  for all using (auth_role() in ('staff', 'admin')) with check (auth_role() in ('staff', 'admin'));

-- ---------- הגדרות כלליות (תקנון + טיפ יומי) - שורה יחידה ----------
create table if not exists app_settings (
  id int primary key default 1,
  terms_text text not null default 'נהלי עבודה וסודיות - צוות השידוכים

1. כל מידע אישי על מועמדים ומועמדות (שמות, טלפונים, תמונות, הקלטות) חסוי ואסור בשיתוף מחוץ לצוות.
2. אין להעביר פרטי קשר של מועמד/ת לצד שלישי ללא אישור מפורש מהמנהלת.
3. יש לעדכן סטטוס ותיעוד בכרטיס המועמד/ת באופן שוטף ומיידי לאחר כל שיחה או פגישה.
4. פנייה למועמדים תיעשה בשפה מכבדת ורגישה בכל שלב בתהליך.

באישור התיבה למטה, הנך מאשר/ת שקראת את הנהלים ומתחייב/ת לפעול לפיהם.',
  daily_tip text not null default 'טיפ השבוע: בשיחה ראשונה עם מועמד/ת חדש/ה, התחילו בשאלות פתוחות על התחביבים והיומיום שלהם לפני שעוברים לשאלות על ציפיות מבן/בת הזוג - זה בונה אמון ומוציא תשובות אמיתיות יותר.',
  updated_at timestamptz not null default now(),
  check (id = 1)
);

insert into app_settings (id) values (1) on conflict (id) do nothing;

alter table app_settings enable row level security;

drop policy if exists "app_settings_select_staff_admin" on app_settings;
create policy "app_settings_select_staff_admin" on app_settings
  for select using (auth_role() in ('staff', 'admin'));

drop policy if exists "app_settings_update_admin" on app_settings;
create policy "app_settings_update_admin" on app_settings
  for update using (auth_role() = 'admin') with check (auth_role() = 'admin');

-- ---------- תמונות מועמדים (Storage) ----------
insert into storage.buckets (id, name, public)
values ('candidate-photos', 'candidate-photos', true)
on conflict (id) do nothing;

drop policy if exists "candidate_photos_public_read" on storage.objects;
create policy "candidate_photos_public_read" on storage.objects
  for select using (bucket_id = 'candidate-photos');

drop policy if exists "candidate_photos_admin_write" on storage.objects;
create policy "candidate_photos_admin_write" on storage.objects
  for insert with check (bucket_id = 'candidate-photos' and auth_role() = 'admin');
