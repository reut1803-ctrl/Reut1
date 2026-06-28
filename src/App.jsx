// =====================================================================
//  App — top-level routing & layout.
// =====================================================================
import { Routes, Route, Navigate } from 'react-router-dom';
import { useApp } from './shared/AppContext';
import Header from './components/Header';
import Navigation from './components/Navigation';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import SchedulePage from './pages/SchedulePage';
import AdminPage from './pages/AdminPage';

// Guard for any authenticated staff route.
function RequireStaff({ children }) {
  const { isAuthenticated, loading } = useApp();
  if (loading) return <div className="page-loading">טוען…</div>;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

// Guard for admin-only routes.
function RequireAdmin({ children }) {
  const { isAdmin, loading } = useApp();
  if (loading) return <div className="page-loading">טוען…</div>;
  return isAdmin ? children : <Navigate to="/dashboard" replace />;
}

export default function App() {
  const { isAuthenticated } = useApp();

  return (
    <div className="app-shell">
      <Header />
      {isAuthenticated && <Navigation />}

      <main className="app-main">
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register/:token" element={<RegisterPage />} />

          {/* Staff routes */}
          <Route
            path="/dashboard"
            element={
              <RequireStaff>
                <DashboardPage />
              </RequireStaff>
            }
          />
          <Route
            path="/schedule"
            element={
              <RequireStaff>
                <SchedulePage />
              </RequireStaff>
            }
          />

          {/* Admin routes */}
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminPage />
              </RequireAdmin>
            }
          />

          {/* Defaults */}
          <Route
            path="/"
            element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
