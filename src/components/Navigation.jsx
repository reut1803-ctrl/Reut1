// =====================================================================
//  Navigation — primary nav bar for authenticated staff.
//  Admin-only links are conditionally rendered from the AppContext role.
// =====================================================================
import { NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '../shared/AppContext';

export default function Navigation() {
  const { staff, isAdmin, signOut } = useApp();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const linkClass = ({ isActive }) =>
    'nav__link' + (isActive ? ' nav__link--active' : '');

  // תרגום התפקיד לעברית לתצוגה
  const roleLabel = staff?.role === 'admin' ? 'מנהלת' : 'שדכן/ית';

  return (
    <nav className="nav" aria-label="ניווט ראשי">
      <ul className="nav__links">
        <li>
          <NavLink to="/dashboard" className={linkClass}>
            לוח ראיונות
          </NavLink>
        </li>
        <li>
          <NavLink to="/schedule" className={linkClass}>
            קביעת ראיון
          </NavLink>
        </li>
        {isAdmin && (
          <li>
            <NavLink to="/admin" className={linkClass}>
              ניהול
            </NavLink>
          </li>
        )}
      </ul>

      <div className="nav__user">
        {staff && (
          <span className="nav__user-name">
            {staff.full_name}
            <span className="nav__user-role">{roleLabel}</span>
          </span>
        )}
        <button type="button" className="btn btn--ghost" onClick={handleSignOut}>
          התנתקות
        </button>
      </div>
    </nav>
  );
}
