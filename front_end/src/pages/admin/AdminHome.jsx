import { useEffect, useState } from "react";
import { BarChart3, ClipboardList, FileText, GraduationCap, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge, Card, EmptyState, Skeleton, Table } from "../../components/ui/index.js";
import { getDashboardStats } from "../../api/admin.api.js";

function AdminHome() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getDashboardStats()
      .then((data) => { if (mounted) setStats(data); })
      .catch(() => { if (mounted) setStats(null); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const statCards = [
    { label: "Total users", value: stats?.total_users, icon: Users, tone: "indigo" },
    { label: "Students", value: stats?.students, icon: GraduationCap, tone: "emerald" },
    { label: "Teachers", value: stats?.teachers, icon: Users, tone: "amber" },
    { label: "Questions", value: stats?.total_questions, icon: FileText, tone: "violet" },
    { label: "Quiz sessions", value: stats?.total_quiz_sessions, icon: ClipboardList, tone: "rose" },
  ];
  const userColumns = [
    { key: "email", header: "Recent users", render: (user) => <div><p className="font-semibold text-slate-800">{user.email}</p><p className="mt-1 text-xs text-slate-500">Joined {new Date(user.created_at).toLocaleDateString()}</p></div> },
    { key: "role", header: "Role", render: (user) => <Badge tone={user.role === "admin" ? "violet" : user.role === "teacher" ? "indigo" : "slate"} className="capitalize">{user.role}</Badge> },
  ];

  return (
    <div>
      <section className="mb-6"><p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Administration</p><h2 className="mt-2 text-2xl font-extrabold text-slate-950">Platform overview</h2><p className="mt-2 text-sm text-slate-500">A snapshot of accounts and learning content.</p></section>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {statCards.map((stat) => <StatCard key={stat.label} {...stat} loading={loading} />)}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card className="p-5 sm:p-6">
          <div className="mb-5 flex items-start justify-between"><div><h3 className="font-bold text-slate-900">Questions per topic</h3><p className="mt-1 text-xs text-slate-500">Question library distribution</p></div><span className="flex size-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700"><BarChart3 size={18} /></span></div>
          {loading ? <ChartSkeleton /> : stats?.questions_per_topic?.length ? (
            <div className="h-72 w-full" aria-label="Questions per topic bar chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.questions_per_topic} margin={{ top: 8, right: 8, left: -18, bottom: 4 }}>
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="topic_name" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} interval={0} angle={-22} textAnchor="end" height={56} />
                  <YAxis allowDecimals={false} tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: "#eef2ff" }} contentStyle={{ borderRadius: 12, borderColor: "#e2e8f0", fontSize: 12 }} />
                  <Bar dataKey="question_count" name="Questions" fill="#4f46e5" radius={[6, 6, 0, 0]} maxBarSize={42} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <EmptyState title="No topic data yet" description="Create topics and questions to see the distribution." />}
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-start justify-between px-5 py-5"><div><h3 className="font-bold text-slate-900">Recent users</h3><p className="mt-1 text-xs text-slate-500">Latest accounts created</p></div><Link to="/admin/users" className="text-xs font-semibold text-indigo-700 hover:text-indigo-900">Manage users</Link></div>
          {loading ? <TableSkeleton rows={5} /> : <Table columns={userColumns} data={stats?.recent_users ?? []} emptyTitle="No users yet" emptyDescription="New accounts will appear here." />}
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, tone, loading }) {
  const tones = { indigo: "bg-indigo-50 text-indigo-700", emerald: "bg-emerald-50 text-emerald-700", amber: "bg-amber-50 text-amber-700", violet: "bg-violet-50 text-violet-700", rose: "bg-rose-50 text-rose-700" };
  return <Card className="p-4"><div className="flex items-center justify-between gap-2"><p className="text-xs font-semibold text-slate-500">{label}</p><span className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}><Icon size={18} /></span></div>{loading ? <Skeleton className="mt-4 h-8 w-20" /> : <p className="mt-4 text-2xl font-extrabold text-slate-900">{value ?? 0}</p>}</Card>;
}

function TableSkeleton({ rows }) {
  return <div className="space-y-4 px-5 pb-5">{Array.from({ length: rows }, (_, index) => <div key={index} className="flex items-center gap-3"><Skeleton className="h-9 flex-1" /><Skeleton className="h-6 w-16" /></div>)}</div>;
}

function ChartSkeleton() {
  const heights = [46, 72, 56, 88, 63, 79, 52];
  return <div className="flex h-72 items-end gap-4 px-4 pb-6">{heights.map((height, index) => <span key={index} className="flex-1 animate-pulse rounded-t-md bg-slate-200" style={{ height: `${height}%` }} />)}</div>;
}

export default AdminHome;