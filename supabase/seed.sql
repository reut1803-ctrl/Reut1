-- קובץ זה נוצר אוטומטית ע"י scripts/generate-seed.mjs
-- מריצים אותו ב-Supabase SQL Editor אחרי שהרצת את schema.sql

insert into candidates (id, gender, name, age, height, region, religious_level, study, smoking, traits, about, image_url, is_new, is_previous)
values ('00000000-0000-0000-000a-000000000001', 'male', 'יהודה', 31, 178, 'שפלה', 'חרד"ל', 'עובד ולומד', 'לא מעשן/ת בקביעות', ARRAY['משפחתיות','שאפתנות']::text[], 'בחור/ה נעים/ה, בעל/ת חוש הומור, קרוב/ה למשפחה וחברים.', 'https://picsum.photos/seed/male-12/600/800', true, false)
on conflict (id) do nothing;

insert into candidate_internal_notes (candidate_id, staff_note, admin_note)
values ('00000000-0000-0000-000a-000000000001', 'שיחה עם המשפחה התקדמה יפה, אלעזר מלווה/ת את התיק.', 'לחזור לבדוק המלצות נוספות בשבוע הבא.')
on conflict (candidate_id) do nothing;

insert into candidates (id, gender, name, age, height, region, religious_level, study, smoking, traits, about, image_url, is_new, is_previous)
values ('00000000-0000-0000-000a-000000000002', 'male', 'נתנאל', 33, 184, 'שפלה', 'חרד"ל', 'עובד ולומד', 'לא מעשן/ת בקביעות', ARRAY[]::text[], 'בחור/ה נעים/ה, בעל/ת חוש הומור, קרוב/ה למשפחה וחברים.', 'https://picsum.photos/seed/male-13/600/800', true, false)
on conflict (id) do nothing;

insert into candidate_internal_notes (candidate_id, staff_note, admin_note)
values ('00000000-0000-0000-000a-000000000002', 'שיחה עם המשפחה התקדמה יפה, אלעזר מלווה/ת את התיק.', '')
on conflict (candidate_id) do nothing;

insert into candidates (id, gender, name, age, height, region, religious_level, study, smoking, traits, about, image_url, is_new, is_previous)
values ('00000000-0000-0000-000a-000000000003', 'male', 'עידו', 29, 168, 'שפלה', 'חרד"ל', 'עובד ולומד', 'לא מעשן/ת בקביעות', ARRAY['משפחתיות','שאפתנות','ביטחון עצמי']::text[], 'אווירה חמה, פשוט/ה ואמיתי/ת, מחפש/ת קשר יציב ובריא.', 'https://picsum.photos/seed/male-14/600/800', true, false)
on conflict (id) do nothing;

insert into candidate_internal_notes (candidate_id, staff_note, admin_note)
values ('00000000-0000-0000-000a-000000000003', 'שיחה עם המשפחה התקדמה יפה, אלעזר מלווה/ת את התיק.', 'לחזור לבדוק המלצות נוספות בשבוע הבא.')
on conflict (candidate_id) do nothing;

insert into candidates (id, gender, name, age, height, region, religious_level, study, smoking, traits, about, image_url, is_new, is_previous)
values ('00000000-0000-0000-000a-000000000004', 'male', 'שמעון', 34, 185, 'שרון', 'דתי', 'הסדר', 'לא מעשן/ת', ARRAY['הומור']::text[], 'אווירה חמה, פשוט/ה ואמיתי/ת, מחפש/ת קשר יציב ובריא.', 'https://picsum.photos/seed/male-15/600/800', false, false)
on conflict (id) do nothing;

insert into candidate_internal_notes (candidate_id, staff_note, admin_note)
values ('00000000-0000-0000-000a-000000000004', 'שיחה עם המשפחה התקדמה יפה, רוני מלווה/ת את התיק.', '')
on conflict (candidate_id) do nothing;

insert into candidates (id, gender, name, age, height, region, religious_level, study, smoking, traits, about, image_url, is_new, is_previous)
values ('00000000-0000-0000-000a-000000000005', 'male', 'אריאל', 29, 172, 'דרום', 'תורני', 'ישיבה גבוהה', 'לא מעשן/ת בקביעות', ARRAY['רגישות','שאפתנות','ביטחון עצמי','מנהיגות']::text[], 'רציני/ת, שאפתן/ית, אוהב/ת ללמוד ולהתפתח כל הזמן.', 'https://picsum.photos/seed/male-16/600/800', false, false)
on conflict (id) do nothing;

insert into candidate_internal_notes (candidate_id, staff_note, admin_note)
values ('00000000-0000-0000-000a-000000000005', 'שיחה עם המשפחה התקדמה יפה, אוהד מלווה/ת את התיק.', 'לחזור לבדוק המלצות נוספות בשבוע הבא.')
on conflict (candidate_id) do nothing;

insert into candidates (id, gender, name, age, height, region, religious_level, study, smoking, traits, about, image_url, is_new, is_previous)
values ('00000000-0000-0000-000a-000000000006', 'male', 'בנימין', 25, 176, 'דרום', 'תורני', 'עובד ולומד', 'לא מעשן/ת בקביעות', ARRAY['ביטחון עצמי','מנהיגות']::text[], 'אווירה חמה, פשוט/ה ואמיתי/ת, מחפש/ת קשר יציב ובריא.', 'https://picsum.photos/seed/male-17/600/800', false, false)
on conflict (id) do nothing;

insert into candidate_internal_notes (candidate_id, staff_note, admin_note)
values ('00000000-0000-0000-000a-000000000006', 'שיחה עם המשפחה התקדמה יפה, אוהד מלווה/ת את התיק.', '')
on conflict (candidate_id) do nothing;

insert into candidates (id, gender, name, age, height, region, religious_level, study, smoking, traits, about, image_url, is_new, is_previous)
values ('00000000-0000-0000-000a-000000000007', 'male', 'יוסף', 28, 175, 'שרון', 'דתי', 'עובד', 'לא מעשן/ת', ARRAY['הומור','משפחתיות','ביטחון עצמי','מנהיגות']::text[], 'רציני/ת, שאפתן/ית, אוהב/ת ללמוד ולהתפתח כל הזמן.', 'https://picsum.photos/seed/male-18/600/800', false, true)
on conflict (id) do nothing;

insert into candidate_internal_notes (candidate_id, staff_note, admin_note)
values ('00000000-0000-0000-000a-000000000007', 'שיחה עם המשפחה התקדמה יפה, רוני מלווה/ת את התיק.', 'לחזור לבדוק המלצות נוספות בשבוע הבא.')
on conflict (candidate_id) do nothing;

insert into candidates (id, gender, name, age, height, region, religious_level, study, smoking, traits, about, image_url, is_new, is_previous)
values ('00000000-0000-0000-000a-000000000008', 'male', 'עמיחי', 34, 177, 'שרון', 'דתי', 'הסדר', 'לא מעשן/ת', ARRAY['הומור','שאפתנות','רוחניות','מנהיגות']::text[], 'אווירה חמה, פשוט/ה ואמיתי/ת, מחפש/ת קשר יציב ובריא.', 'https://picsum.photos/seed/male-19/600/800', false, true)
on conflict (id) do nothing;

insert into candidate_internal_notes (candidate_id, staff_note, admin_note)
values ('00000000-0000-0000-000a-000000000008', 'שיחה עם המשפחה התקדמה יפה, רוני מלווה/ת את התיק.', '')
on conflict (candidate_id) do nothing;

insert into candidates (id, gender, name, age, height, region, religious_level, study, smoking, traits, about, image_url, is_new, is_previous)
values ('00000000-0000-0000-000a-000000000009', 'male', 'אלישע', 30, 175, 'שרון', 'דתי', 'הסדר', 'לא מעשן/ת', ARRAY['הומור']::text[], 'בעל/ת ביטחון עצמי, אנרגטי/ת ואוהב/ת אנשים.', 'https://picsum.photos/seed/male-20/600/800', false, true)
on conflict (id) do nothing;

insert into candidate_internal_notes (candidate_id, staff_note, admin_note)
values ('00000000-0000-0000-000a-000000000009', 'שיחה עם המשפחה התקדמה יפה, רוני מלווה/ת את התיק.', 'לחזור לבדוק המלצות נוספות בשבוע הבא.')
on conflict (candidate_id) do nothing;

insert into candidates (id, gender, name, age, height, region, religious_level, study, smoking, traits, about, image_url, is_new, is_previous)
values ('00000000-0000-0000-000a-000000000010', 'male', 'גדי', 23, 168, 'דרום', 'תורני', 'ישיבה גבוהה', 'לא מעשן/ת בקביעות', ARRAY['הומור','רוגע','משפחתיות','ביטחון עצמי','מנהיגות']::text[], 'רציני/ת, שאפתן/ית, אוהב/ת ללמוד ולהתפתח כל הזמן.', 'https://picsum.photos/seed/male-21/600/800', false, true)
on conflict (id) do nothing;

insert into candidate_internal_notes (candidate_id, staff_note, admin_note)
values ('00000000-0000-0000-000a-000000000010', 'שיחה עם המשפחה התקדמה יפה, אוהד מלווה/ת את התיק.', '')
on conflict (candidate_id) do nothing;

insert into candidates (id, gender, name, age, height, region, religious_level, study, smoking, traits, about, image_url, is_new, is_previous)
values ('00000000-0000-0000-000b-000000000001', 'female', 'שירה', 21, 171, 'דרום', 'תורני', 'לומד בישיבה / כולל', 'לא מעשן/ת בקביעות', ARRAY['מנהיגות']::text[], 'רציני/ת, שאפתן/ית, אוהב/ת ללמוד ולהתפתח כל הזמן.', 'https://picsum.photos/seed/female-12/600/800', true, false)
on conflict (id) do nothing;

insert into candidate_internal_notes (candidate_id, staff_note, admin_note)
values ('00000000-0000-0000-000b-000000000001', 'שיחה עם המשפחה התקדמה יפה, אוהד מלווה/ת את התיק.', 'לחזור לבדוק המלצות נוספות בשבוע הבא.')
on conflict (candidate_id) do nothing;

insert into candidates (id, gender, name, age, height, region, religious_level, study, smoking, traits, about, image_url, is_new, is_previous)
values ('00000000-0000-0000-000b-000000000002', 'female', 'תמר', 32, 166, 'צפון', 'חרד"ל', 'לומד בישיבה / כולל', 'לא מעשן/ת בקביעות', ARRAY['רוחניות','ביטחון עצמי','מנהיגות']::text[], 'רציני/ת, שאפתן/ית, אוהב/ת ללמוד ולהתפתח כל הזמן.', 'https://picsum.photos/seed/female-13/600/800', true, false)
on conflict (id) do nothing;

insert into candidate_internal_notes (candidate_id, staff_note, admin_note)
values ('00000000-0000-0000-000b-000000000002', 'שיחה עם המשפחה התקדמה יפה, אלעזר מלווה/ת את התיק.', '')
on conflict (candidate_id) do nothing;

insert into candidates (id, gender, name, age, height, region, religious_level, study, smoking, traits, about, image_url, is_new, is_previous)
values ('00000000-0000-0000-000b-000000000003', 'female', 'נעמי', 34, 158, 'מרכז', 'תורני', 'תואר שני', 'לא מעשן/ת בקביעות', ARRAY['רוגע','מנהיגות']::text[], 'רגוע/ה, קשוב/ה, בעל/ת עולם רוחני עשיר.', 'https://picsum.photos/seed/female-14/600/800', true, false)
on conflict (id) do nothing;

insert into candidate_internal_notes (candidate_id, staff_note, admin_note)
values ('00000000-0000-0000-000b-000000000003', 'שיחה עם המשפחה התקדמה יפה, אוהד מלווה/ת את התיק.', 'לחזור לבדוק המלצות נוספות בשבוע הבא.')
on conflict (candidate_id) do nothing;

insert into candidates (id, gender, name, age, height, region, religious_level, study, smoking, traits, about, image_url, is_new, is_previous)
values ('00000000-0000-0000-000b-000000000004', 'female', 'אביגיל', 31, 163, 'דרום', 'תורני', 'תואר שני', 'לא מעשן/ת בקביעות', ARRAY['רגישות','שאפתנות','רוחניות','ביטחון עצמי']::text[], 'רגוע/ה, קשוב/ה, בעל/ת עולם רוחני עשיר.', 'https://picsum.photos/seed/female-15/600/800', false, false)
on conflict (id) do nothing;

insert into candidate_internal_notes (candidate_id, staff_note, admin_note)
values ('00000000-0000-0000-000b-000000000004', 'שיחה עם המשפחה התקדמה יפה, אוהד מלווה/ת את התיק.', '')
on conflict (candidate_id) do nothing;

insert into candidates (id, gender, name, age, height, region, religious_level, study, smoking, traits, about, image_url, is_new, is_previous)
values ('00000000-0000-0000-000b-000000000005', 'female', 'הדס', 21, 159, 'דרום', 'תורני', 'עובד/ת', 'לא מעשן/ת בקביעות', ARRAY['ביטחון עצמי','מנהיגות']::text[], 'בעל/ת ביטחון עצמי, אנרגטי/ת ואוהב/ת אנשים.', 'https://picsum.photos/seed/female-16/600/800', false, false)
on conflict (id) do nothing;

insert into candidate_internal_notes (candidate_id, staff_note, admin_note)
values ('00000000-0000-0000-000b-000000000005', 'שיחה עם המשפחה התקדמה יפה, אוהד מלווה/ת את התיק.', 'לחזור לבדוק המלצות נוספות בשבוע הבא.')
on conflict (candidate_id) do nothing;

insert into candidates (id, gender, name, age, height, region, religious_level, study, smoking, traits, about, image_url, is_new, is_previous)
values ('00000000-0000-0000-000b-000000000006', 'female', 'יעל', 31, 165, 'שפלה', 'חרד"ל', 'סמינר / מכינה', 'לא מעשן/ת בקביעות', ARRAY['משפחתיות','רגישות','רוחניות','מנהיגות']::text[], 'בחור/ה נעים/ה, בעל/ת חוש הומור, קרוב/ה למשפחה וחברים.', 'https://picsum.photos/seed/female-17/600/800', false, false)
on conflict (id) do nothing;

insert into candidate_internal_notes (candidate_id, staff_note, admin_note)
values ('00000000-0000-0000-000b-000000000006', 'שיחה עם המשפחה התקדמה יפה, אלעזר מלווה/ת את התיק.', '')
on conflict (candidate_id) do nothing;

insert into candidates (id, gender, name, age, height, region, religious_level, study, smoking, traits, about, image_url, is_new, is_previous)
values ('00000000-0000-0000-000b-000000000007', 'female', 'רות', 28, 172, 'מרכז', 'תורני', 'תואר ראשון', 'לא מעשן/ת בקביעות', ARRAY['רוגע','משפחתיות']::text[], 'אווירה חמה, פשוט/ה ואמיתי/ת, מחפש/ת קשר יציב ובריא.', 'https://picsum.photos/seed/female-18/600/800', false, true)
on conflict (id) do nothing;

insert into candidate_internal_notes (candidate_id, staff_note, admin_note)
values ('00000000-0000-0000-000b-000000000007', 'שיחה עם המשפחה התקדמה יפה, אוהד מלווה/ת את התיק.', 'לחזור לבדוק המלצות נוספות בשבוע הבא.')
on conflict (candidate_id) do nothing;

insert into candidates (id, gender, name, age, height, region, religious_level, study, smoking, traits, about, image_url, is_new, is_previous)
values ('00000000-0000-0000-000b-000000000008', 'female', 'עדי', 22, 168, 'מרכז', 'תורני', 'תואר שני', 'לא מעשן/ת בקביעות', ARRAY['רוגע','משפחתיות','רגישות','שאפתנות','ביטחון עצמי','מנהיגות']::text[], 'רגוע/ה, קשוב/ה, בעל/ת עולם רוחני עשיר.', 'https://picsum.photos/seed/female-19/600/800', false, true)
on conflict (id) do nothing;

insert into candidate_internal_notes (candidate_id, staff_note, admin_note)
values ('00000000-0000-0000-000b-000000000008', 'שיחה עם המשפחה התקדמה יפה, אוהד מלווה/ת את התיק.', '')
on conflict (candidate_id) do nothing;

insert into candidates (id, gender, name, age, height, region, religious_level, study, smoking, traits, about, image_url, is_new, is_previous)
values ('00000000-0000-0000-000b-000000000009', 'female', 'מיכל', 31, 163, 'שפלה', 'חרד"ל', 'תואר שני', 'לא מעשן/ת בקביעות', ARRAY['שאפתנות','רוחניות']::text[], 'רגוע/ה, קשוב/ה, בעל/ת עולם רוחני עשיר.', 'https://picsum.photos/seed/female-20/600/800', false, true)
on conflict (id) do nothing;

insert into candidate_internal_notes (candidate_id, staff_note, admin_note)
values ('00000000-0000-0000-000b-000000000009', 'שיחה עם המשפחה התקדמה יפה, אלעזר מלווה/ת את התיק.', 'לחזור לבדוק המלצות נוספות בשבוע הבא.')
on conflict (candidate_id) do nothing;

insert into candidates (id, gender, name, age, height, region, religious_level, study, smoking, traits, about, image_url, is_new, is_previous)
values ('00000000-0000-0000-000b-000000000010', 'female', 'אורית', 26, 162, 'שרון', 'דתי', 'תואר ראשון', 'לא מעשן/ת', ARRAY['הומור','משפחתיות','שאפתנות']::text[], 'אווירה חמה, פשוט/ה ואמיתי/ת, מחפש/ת קשר יציב ובריא.', 'https://picsum.photos/seed/female-21/600/800', false, true)
on conflict (id) do nothing;

insert into candidate_internal_notes (candidate_id, staff_note, admin_note)
values ('00000000-0000-0000-000b-000000000010', 'שיחה עם המשפחה התקדמה יפה, רוני מלווה/ת את התיק.', '')
on conflict (candidate_id) do nothing;


