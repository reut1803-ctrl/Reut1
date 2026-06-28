// =====================================================================
//  AdminPage — admin-only control panel (branding + questions).
// =====================================================================
import AdminControlPanel from '../components/AdminControlPanel';

export default function AdminPage() {
  return (
    <section className="page">
      <h1 className="page__title">לוח ניהול</h1>
      <AdminControlPanel />
    </section>
  );
}
