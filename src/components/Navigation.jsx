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

  return (
    <nav className="nav" aria-label="Primary">
      <ul className="nav__links">
        <li>
          <NavLink to="/dashboard" className={linkClass}>
            Dashboard
          </NavLink>
        </li>
        <li>
          <NavLink to="/schedule" className={linkClass}>
            Schedule
          </NavLink>
        </li>
        {isAdmin && (
          <li>
            <NavLink to="/admin" className={linkClass}>
              Admin
            </NavLink>
          </li>
        )}
      </ul>

      <div className="nav__user">
        {staff && (
          <span className="nav__user-name">
            {staff.full_name}
            <span className="nav__user-role">{staff.role}</span>
          </span>
        )}
        <button type="button" className="btn btn--ghost" onClick={handleSignOut}>
          Sign out
        </button>
      </div>
    </nav>
  );
}
