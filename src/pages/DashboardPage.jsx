// =====================================================================
//  DashboardPage — matchmaker (and admin) interview dashboard.
// =====================================================================
import MatchmakerDashboard from '../components/MatchmakerDashboard';

export default function DashboardPage() {
  return (
    <section className="page">
      <h1 className="page__title">Dashboard</h1>
      <MatchmakerDashboard />
    </section>
  );
}
