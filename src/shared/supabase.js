// =====================================================================
//  Centralised Supabase client.
//  Every component imports the client from here — never instantiate a
//  second client elsewhere (keeps a single auth/session source of truth).
// =====================================================================
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Fail loudly during development rather than silently mis-configuring.
  // eslint-disable-next-line no-console
  console.error(
    '[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. ' +
      'Copy .env.example to .env and fill in your project credentials.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Public storage URL helper for branding assets (logos etc.).
export function brandingAssetUrl(path) {
  if (!path) return null;
  // Already an absolute URL? return as-is.
  if (/^https?:\/\//i.test(path)) return path;
  const { data } = supabase.storage.from('branding').getPublicUrl(path);
  return data?.publicUrl ?? null;
}

export default supabase;
