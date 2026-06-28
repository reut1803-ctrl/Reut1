-- =====================================================================
--  Seed data (optional) — run with the service-role key.
--  Provides a starter question set and a default theme.
-- =====================================================================

-- Default theme (updates the singleton row)
update public.theme_settings set
  brand_name      = 'Heart2Heart Matchmaking',
  primary_color   = '#6D28D9',
  secondary_color = '#DB2777',
  accent_color    = '#059669',
  font_family     = 'Inter, system-ui, sans-serif',
  background_color = '#FBF7FF',
  text_color      = '#1F2937'
where id = true;

-- Starter questions
insert into public.questions (label, input_type, gender, options, is_required, sort_order)
values
  ('Full name',              'text',        'any',    '[]'::jsonb, true, 10),
  ('Date of birth',          'date',        'any',    '[]'::jsonb, true, 20),
  ('City',                   'text',        'any',    '[]'::jsonb, true, 30),
  ('Occupation',             'text',        'any',    '[]'::jsonb, false, 40),
  ('Level of observance',    'select',      'any',
     '["Secular","Traditional","Religious","Orthodox"]'::jsonb, false, 50),
  ('Tell us about yourself', 'textarea',    'any',    '[]'::jsonb, false, 60),
  ('Preferred age range',    'text',        'any',    '[]'::jsonb, false, 70),
  ('Head covering preference','select',     'female',
     '["Yes","No","Open to discuss"]'::jsonb, false, 80),
  ('Beard',                  'select',      'male',
     '["Clean shaven","Trimmed","Full beard"]'::jsonb, false, 90)
on conflict do nothing;

-- A sample candidate with a ready-to-use registration link token
insert into public.candidates (full_name, gender)
values ('Sample Candidate', 'female')
on conflict do nothing;
