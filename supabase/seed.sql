-- =====================================================================
--  Seed data (optional) — run with the service-role key.
--  Provides a starter question set and a default theme.
-- =====================================================================

-- Default theme (updates the singleton row)
update public.theme_settings set
  brand_name      = 'לב אל לב — שידוכים בקהילה',
  primary_color   = '#6D28D9',
  secondary_color = '#DB2777',
  accent_color    = '#059669',
  font_family     = 'Inter, system-ui, sans-serif',
  background_color = '#FBF7FF',
  text_color      = '#1F2937'
where id = true;

-- שאלות פתיחה לדוגמה (בעברית)
insert into public.questions (label, input_type, gender, options, is_required, sort_order)
values
  ('שם מלא',            'text',        'any',    '[]'::jsonb, true, 10),
  ('תאריך לידה',        'date',        'any',    '[]'::jsonb, true, 20),
  ('עיר מגורים',        'text',        'any',    '[]'::jsonb, true, 30),
  ('עיסוק',             'text',        'any',    '[]'::jsonb, false, 40),
  ('רמת דתיות',         'select',      'any',
     '["חילוני","מסורתי","דתי","חרדי"]'::jsonb, false, 50),
  ('ספרי על עצמך',      'textarea',    'any',    '[]'::jsonb, false, 60),
  ('טווח גילאים מועדף', 'text',        'any',    '[]'::jsonb, false, 70),
  ('כיסוי ראש',         'select',      'female',
     '["כן","לא","פתוחה לדבר על זה"]'::jsonb, false, 80),
  ('זקן',               'select',      'male',
     '["מגולח","מעוצב","מלא"]'::jsonb, false, 90)
on conflict do nothing;

-- מועמדת לדוגמה עם קישור הרשמה מוכן לשימוש
insert into public.candidates (full_name, gender)
values ('מועמדת לדוגמה', 'female')
on conflict do nothing;
