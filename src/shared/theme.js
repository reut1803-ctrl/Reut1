// =====================================================================
//  Theme helpers — translate a theme_settings row into CSS custom
//  properties on :root so the whole app restyles from the database.
// =====================================================================

export const DEFAULT_THEME = {
  brand_name: 'Matchmaking Platform',
  logo_url: null,
  primary_color: '#4F46E5',
  secondary_color: '#EC4899',
  accent_color: '#10B981',
  font_family: 'Inter, system-ui, sans-serif',
  background_color: '#F9FAFB',
  text_color: '#111827',
};

/** Write theme values into CSS variables consumed by index.css. */
export function applyTheme(theme) {
  if (typeof document === 'undefined') return;
  const t = { ...DEFAULT_THEME, ...(theme || {}) };
  const root = document.documentElement;
  root.style.setProperty('--color-primary', t.primary_color);
  root.style.setProperty('--color-secondary', t.secondary_color);
  root.style.setProperty('--color-accent', t.accent_color);
  root.style.setProperty('--color-bg', t.background_color);
  root.style.setProperty('--color-text', t.text_color);
  root.style.setProperty('--font-family', t.font_family);
  document.body.style.fontFamily = t.font_family;
  if (t.brand_name) document.title = t.brand_name;
}
