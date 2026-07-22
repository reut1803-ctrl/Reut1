"use client";

import { useEffect, useMemo, useState } from "react";
import { Users, Heart, ListTodo, TrendingUp } from "lucide-react";
import { useAuth } from "@/lib/supabase/AuthProvider";
import { fetchCandidates, fetchProposals, fetchTasks } from "@/lib/queries";
import { PIPELINE_STATUSES } from "@/lib/data";

export default function DashboardPage() {
  const { supabase, profile } = useAuth();
  const [males, setMales] = useState([]);
  const [females, setFemales] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.role !== "admin") return;
    Promise.all([
      fetchCandidates(supabase, "male"),
      fetchCandidates(supabase, "female"),
      fetchProposals(supabase),
      fetchTasks(supabase),
    ]).then(([m, f, p, t]) => {
      setMales(m);
      setFemales(f);
      setProposals(p);
      setTasks(t);
      setLoading(false);
    });
  }, [supabase, profile]);

  const stageCounts = useMemo(() => {
    const counts = Object.fromEntries(PIPELINE_STATUSES.map((s) => [s, 0]));
    proposals.forEach((p) => {
      if (counts[p.stage] != null) counts[p.stage] += 1;
    });
    return counts;
  }, [proposals]);

  const openTasks = tasks.filter((t) => !t.done).length;

  if (profile?.role !== "admin") {
    return <p className="px-1 py-10 text-center text-sm text-muted">אזור זה זמין למנהלת בלבד</p>;
  }

  if (loading) return <div className="card py-10 text-center text-sm text-muted">טוען נתונים...</div>;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="px-1 text-lg font-extrabold text-ink">דאשבורד</h1>

      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={Users} label="מועמדים פעילים" value={males.length + females.length} />
        <StatCard icon={Heart} label="הצעות שידוך פתוחות" value={proposals.length} />
        <StatCard icon={ListTodo} label="משימות פתוחות" value={openTasks} />
        <StatCard icon={TrendingUp} label="בשלב מתקדם" value={stageCounts["מתקדם"] ?? 0} />
      </div>

      <div className="card p-4">
        <p className="mb-3 text-sm font-bold text-ink">הצעות שידוך לפי שלב</p>
        <div className="flex flex-col gap-2">
          {PIPELINE_STATUSES.map((stage) => {
            const count = stageCounts[stage] ?? 0;
            const pct = proposals.length ? Math.round((count / proposals.length) * 100) : 0;
            return (
              <div key={stage}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-muted">{stage}</span>
                  <span className="font-bold text-ink">{count}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-pink-50">
                  <div className="h-full rounded-full bg-bordeaux-500" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="card p-4">
      <Icon size={18} className="mb-2 text-bordeaux-500" />
      <p className="text-xl font-extrabold text-ink">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
