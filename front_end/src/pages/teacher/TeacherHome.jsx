import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, GraduationCap, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, Skeleton } from "../../components/ui/index.js";
import { getDashboardStats } from "../../api/teacher.api.js";
import useAuth from "../../hooks/useAuth.js";

function TeacherHome() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getDashboardStats()
      .then((value) => { if (mounted) setStats(value); })
      .catch(() => { if (mounted) setStats(null); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  return (
    <div>
      <section><p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Teacher workspace</p><h2 className="mt-2 text-2xl font-extrabold text-slate-950">Welcome{user?.email ? `, ${user.email.split("@")[0]}` : ""}</h2><p className="mt-2 text-sm text-slate-500">Manage your classes and support student progress.</p></section>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <TeacherStat label="My classes" value={stats?.my_classes} icon={Users} loading={loading} />
        <TeacherStat label="My questions" value={stats?.my_questions} icon={BookOpen} loading={loading} />
        <TeacherStat label="Students" value={stats?.students} icon={GraduationCap} loading={loading} />
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card className="p-5"><span className="flex size-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><Users size={19} /></span><h3 className="mt-4 font-bold text-slate-900">Your classes</h3><p className="mt-1 text-sm leading-6 text-slate-500">Create a class, enroll students, and check topic trends.</p><Link to="/teacher/classes" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-indigo-700">Open classes <ArrowRight size={15} /></Link></Card>
        <Card className="p-5"><span className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><BookOpen size={19} /></span><h3 className="mt-4 font-bold text-slate-900">Question bank</h3><p className="mt-1 text-sm leading-6 text-slate-500">Create focused questions and build practice for your topics.</p><Link to="/teacher/questions" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-indigo-700">Manage questions <ArrowRight size={15} /></Link></Card>
      </div>
    </div>
  );
}

function TeacherStat({ label, value, icon: Icon, loading }) {
  return <Card className="p-5"><div className="flex items-center justify-between"><p className="text-xs font-semibold text-slate-500">{label}</p><span className="flex size-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><Icon size={18} /></span></div>{loading ? <Skeleton className="mt-4 h-8 w-16" /> : <p className="mt-4 text-2xl font-extrabold text-slate-900">{value ?? 0}</p>}</Card>;
}

export default TeacherHome;