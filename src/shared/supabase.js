// =====================================================================
//  Centralised Supabase client.
//  Every component imports the client from here — never instantiate a
//  second client elsewhere (keeps a single auth/session source of truth).
// =====================================================================
import { createClient } from '@supabase/supabase-js';
import { mockSupabase } from './mockClient';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// When real credentials are missing we fall back to an in-memory mock
// client so the full UI can be demoed without a live backend.
// As soon as VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are provided the
// real client takes over (and RLS enforces all access rules).
export const isDemoMode = !supabaseUrl || !supabaseAnonKey;

if (isDemoMode) {
  // eslint-disable-next-line no-console
  console.info(
    '[supabase] DEMO MODE: no credentials found — using in-memory sample ' +
      'data. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY for live data.'
  );
}

export const supabase = isDemoMode
  ? mockSupabase
  : createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });

// Public storage URL helper for branding assets (logos etc.).
export function brandingAssetUrl(path) {
  if (!path) return null;
  // כתובת אינטרנט מלאה / תמונה מוטמעת (data:) / נתיב מקומי — מחזירים כמו שהוא.
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith('data:')) return path;
  if (path.startsWith('/')) return path;
  const { data } = supabase.storage.from('branding').getPublicUrl(path);
  return data?.publicUrl ?? null;
}

export default supabase;
