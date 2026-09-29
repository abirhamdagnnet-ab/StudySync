import { useEffect, useState } from "react";
import { BarChart3, TrendingDown } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge, Card, EmptyState, Skeleton, Table } from "../../components/ui/index.js";
import { getClassTrends, listClasses } from "../../api/teacher.api.js";

const columns = [
  { key: "topic_name", header: "Topic", render: (row) => <span className="font-semibold text-slate-800">{row.topic_name}</span> },
  { key: "attempts_count", header: "Attempts" },
  { key: "students_count", header: "Students" },
  { key: "average_accuracy", header: "Average accuracy", render: (row) => <Badge tone={Number(row.average_accuracy) < 60 ? "rose" : Number(row.average_accuracy) < 80 ? "amber" : "green"}>{row.average_accuracy}%</Badge> },
];

function TeacherTrendsPage() {
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState("");
  const [topics, setTopics] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingTrends, setLoadingTrends] = useState(false);

  useEffect(() => {
    let mounted = true;
    listClasses()
      .then((data) => {
        if (!mounted) return;
        setClasses(data);
        setClassId(data[0] ? String(data[0].id) : "");
      })
      .finally(() => { if (mounted) setLoadingClasses(false); });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!classId) {
      setTopics([]);
      return undefined;
    }
    let mounted = true;
    setLoadingTrends(true);
    getClassTrends(classId)
      .then((data) => { if (mounted) setTopics(data); })
      .catch(() => { if (mounted) setTopics([]); })
      .finally(() => { if (mounted) setLoadingTrends(false); });
    return () => { mounted = false; };
  }, [classId]);

  return (
    <div>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Teacher analytics</p><h2 className="mt-2 text-2xl font-extrabold text-slate-950">Class trends</h2><p className="mt-2 text-sm text-slate-500">Weakest topics and average accuracy across your students.</p></div>
        {loadingClasses ? <Skeleton className="h-11 w-56" /> : classes.length > 0 && <label className="text-xs font-semibold text-slate-600">Class<select value={classId} onChange={(event) => setClassId(event.target.value)} className="mt-1 block min-h-10 min-w-56 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100">{classes.map((classroom) => <option key={classroom.id} value={classroom.id}>{classroom.name}</option>)}</select></label>}
      </div>
      {loadingClasses ? <Card className="p-6"><Skeleton className="h-80 w-full" /></Card> : !classes.length ? <Card><EmptyState icon={<BarChart3 size={22} />} title="No classes yet" description="Create a class and enroll students to see trends." /></Card> : loadingTrends ? <Card className="p-6"><Skeleton className="h-80 w-full" /></Card> : !topics.length ? <Card><EmptyState icon={<TrendingDown size={22} />} title="No topic data yet" description="Students need at least three attempts on a topic before it appears here." /></Card> : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
          <Card className="p-5 sm:p-6"><div className="mb-5"><h3 className="font-bold text-slate-900">Average accuracy by topic</h3><p className="mt-1 text-xs text-slate-500">Sorted weakest first</p></div><div className="h-80 w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={topics} margin={{ top: 8, right: 8, left: -18, bottom: 8 }}><CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="topic_name" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} interval={0} angle={-22} textAnchor="end" height={60} /><YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} /><Tooltip cursor={{ fill: "#eef2ff" }} formatter={(value) => [`${value}%`, "Accuracy"]} contentStyle={{ borderRadius: 12, borderColor: "#e2e8f0", fontSize: 12 }} /><Bar dataKey="average_accuracy" name="Average accuracy" fill="#4f46e5" radius={[6, 6, 0, 0]} maxBarSize={46} /></BarChart></ResponsiveContainer></div></Card>
          <Card className="overflow-hidden"><div className="border-b border-slate-100 px-5 py-4"><h3 className="font-bold text-slate-900">Topic breakdown</h3><p className="mt-1 text-xs text-slate-500">Accuracy averaged across students who attempted each topic</p></div><Table columns={columns} data={topics} /></Card>
        </div>
      )}
    </div>
  );
}

export default TeacherTrendsPage;