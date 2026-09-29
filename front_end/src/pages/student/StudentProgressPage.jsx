import { useEffect, useState } from "react";
import { Activity, BarChart3, Target } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, EmptyState, Skeleton } from "../../components/ui/index.js";
import { getProgress, getWeakTopics } from "../../api/student.api.js";
import WeakTopicList from "./WeakTopicList.jsx";

function StudentProgressPage() {
  const [progress, setProgress] = useState(null);
  const [weakTopics, setWeakTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    Promise.all([getProgress(), getWeakTopics()])
      .then(([progressData, weakTopicData]) => {
        if (mounted) {
          setProgress(progressData);
          setWeakTopics(weakTopicData);
        }
      })
      .catch(() => { if (mounted) setProgress({ topics: [], accuracy_over_time: [] }); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const accuracyHistory = (progress?.accuracy_over_time ?? []).map((entry) => ({
    ...entry,
    day: new Date(entry.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    accuracy: Number(entry.accuracy),
  }));
  const topicAbilities = (progress?.topics ?? []).map((topic) => ({ ...topic, ability_score: Number(topic.ability_score) }));

  return (
    <div className="space-y-6">
      <section><p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Your learning</p><h2 className="mt-2 text-2xl font-extrabold text-slate-950">Progress</h2><p className="mt-2 text-sm text-slate-500">See how your accuracy and topic ability are changing over time.</p></section>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-5 sm:p-6"><div className="mb-5 flex items-start gap-3"><span className="flex size-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700"><Activity size={18} /></span><div><h3 className="font-bold text-slate-900">Accuracy over time</h3><p className="mt-1 text-xs text-slate-500">Daily percentage of correct answers</p></div></div>
          {loading ? <ChartSkeleton /> : accuracyHistory.length ? <div className="h-72"><ResponsiveContainer width="100%" height="100%"><LineChart data={accuracyHistory} margin={{ top: 8, right: 12, left: -18, bottom: 4 }}><CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="day" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} /><YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} /><Tooltip formatter={(value) => [`${value}%`, "Accuracy"]} contentStyle={{ borderRadius: 12, borderColor: "#e2e8f0", fontSize: 12 }} /><Line type="monotone" dataKey="accuracy" stroke="#4f46e5" strokeWidth={3} dot={{ r: 3, fill: "#4f46e5", strokeWidth: 0 }} activeDot={{ r: 5 }} /></LineChart></ResponsiveContainer></div> : <ChartEmpty icon={<Activity size={21} />} label="Accuracy history appears after your first quiz." />}
        </Card>
        <Card className="p-5 sm:p-6"><div className="mb-5 flex items-start gap-3"><span className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><BarChart3 size={18} /></span><div><h3 className="font-bold text-slate-900">Ability by topic</h3><p className="mt-1 text-xs text-slate-500">Adaptive score from 0 to 100</p></div></div>
          {loading ? <ChartSkeleton /> : topicAbilities.length ? <div className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={topicAbilities} margin={{ top: 8, right: 8, left: -18, bottom: 8 }}><CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="topic_name" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} interval={0} angle={-22} textAnchor="end" height={58} /><YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} /><Tooltip formatter={(value) => [value, "Ability score"]} contentStyle={{ borderRadius: 12, borderColor: "#e2e8f0", fontSize: 12 }} /><Bar dataKey="ability_score" name="Ability score" radius={[6, 6, 0, 0]} maxBarSize={42}>{topicAbilities.map((topic) => <Cell key={topic.topic_id} fill={topic.ability_score < 50 ? "#f43f5e" : topic.ability_score < 75 ? "#f59e0b" : "#10b981"} />)}</Bar></BarChart></ResponsiveContainer></div> : <ChartEmpty icon={<Target size={21} />} label="Ability scores appear after your first quiz." />}
        </Card>
      </div>
      <Card className="overflow-hidden"><div className="border-b border-slate-100 px-5 py-4"><h3 className="font-bold text-slate-900">Topics to revisit</h3><p className="mt-1 text-xs text-slate-500">Ranked from weakest recent accuracy</p></div>{loading ? <ListSkeleton /> : <WeakTopicList topics={weakTopics.slice(0, 5)} />}</Card>
    </div>
  );
}

function ChartSkeleton() {
  return <div className="flex h-72 items-end gap-4 px-4 pb-6">{[45, 70, 55, 88, 62, 78, 52].map((height, index) => <span key={index} className="flex-1 animate-pulse rounded-t-md bg-slate-200" style={{ height: `${height}%` }} />)}</div>;
}

function ChartEmpty({ icon, label }) {
  return <div className="flex h-72 flex-col items-center justify-center text-center text-slate-400"><span className="flex size-11 items-center justify-center rounded-xl bg-slate-100">{icon}</span><p className="mt-3 text-sm">{label}</p></div>;
}

function ListSkeleton() {
  return <div className="space-y-4 p-5">{Array.from({ length: 3 }, (_, index) => <div key={index} className="flex gap-3"><Skeleton className="size-8" /><Skeleton className="h-12 flex-1" /></div>)}</div>;
}

export default StudentProgressPage;