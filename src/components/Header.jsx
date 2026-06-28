// =====================================================================
//  Header — prominent, high-impact branding area.
//
//  Requirements honoured:
//   * Large, centered logo (NOT a tiny icon).
//   * Flexible height/width ratio so the logo keeps its original
//     proportions and is never cropped (object-fit: contain).
//   * Logo path is fetched dynamically from theme_settings (via context),
//     resolved through the public `branding` storage bucket when needed.
// =====================================================================
import { useApp } from '../shared/AppContext';
import { brandingAssetUrl } from '../shared/supabase';

export default function Header() {
  const { theme } = useApp();
  const logoSrc = brandingAssetUrl(theme?.logo_url);

  return (
    <header className="app-header" role="banner">
      <div className="app-header__logo-area">
        {logoSrc ? (
          <img
            className="app-header__logo"
            src={logoSrc}
            alt={theme?.brand_name || 'Brand logo'}
          />
        ) : (
          // Graceful fallback when no logo has been configured yet.
          <span className="app-header__brand-text">
            {theme?.brand_name || 'Matchmaking Platform'}
          </span>
        )}
      </div>
      {theme?.brand_name && logoSrc && (
        <p className="app-header__tagline">{theme.brand_name}</p>
      )}
    </header>
  );
}
