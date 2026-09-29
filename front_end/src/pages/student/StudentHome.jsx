import { useEffect, useState } from "react";
import { ArrowRight, BarChart3, BookOpen, CircleHelp, Sparkles, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge, Button, Card, EmptyState, Skeleton, Table } from "../../components/ui/index.js";
import { getProgress, getWeakTopics } from "../../api/student.api.js";
import useAuth from "../../hooks/useAuth.js";

function StudentHome() {
	const { user } = useAuth();
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
			.catch(() => {
				if (mounted) {
					setProgress({ topics: [], accuracy_over_time: [] });
					setWeakTopics([]);
				}
			})
			.finally(() => { if (mounted) setLoading(false); });
		return () => { mounted = false; };
	}, []);

	const topicColumns = [
		{ key: "topic_name", header: "Topic", render: (topic) => <span className="font-semibold text-slate-800">{topic.topic_name}</span> },
		{ key: "ability_score", header: "Ability score", render: (topic) => <div className="flex items-center gap-3"><span className="w-9 font-bold text-slate-800">{Math.round(Number(topic.ability_score))}</span><div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-600" style={{ width: `${Math.min(100, Math.max(0, Number(topic.ability_score)))}%` }} /></div></div> },
		{ key: "accuracy", header: "Accuracy", render: (topic) => `${Math.round(Number(topic.accuracy))}%` },
	];

	return (
		<div className="space-y-6">
			<section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
				<div><p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Student workspace</p><h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">Welcome{user?.email ? `, ${user.email.split("@")[0]}` : ""}</h2><p className="mt-2 text-sm text-slate-500">Your progress, your pace. Choose a topic and start practicing.</p></div>
				<Link to="/student/quiz" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700">Start quiz <ArrowRight size={16} /></Link>
			</section>

			<div className="grid gap-4 sm:grid-cols-3">
				<Stat icon={<BarChart3 size={18} />} label="Topics tracked" value={progress?.topics?.length ?? 0} change="Ability scores" loading={loading} />
				<Stat icon={<CircleHelp size={18} />} label="Questions answered" value={progress?.topics?.reduce((sum, topic) => sum + Number(topic.attempts_count), 0) ?? 0} change="Across your topics" loading={loading} />
				<Stat icon={<Target size={18} />} label="Weak topics" value={weakTopics.length} change="Based on recent answers" loading={loading} />
			</div>

			<div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.8fr)]">
				<Card className="overflow-hidden"><div className="border-b border-slate-100 px-5 py-4"><h3 className="font-bold text-slate-900">Ability by topic</h3><p className="mt-1 text-xs text-slate-500">Your current ability score and quiz accuracy</p></div>{loading ? <TopicSkeleton /> : progress?.topics?.length ? <Table columns={topicColumns} data={progress.topics} /> : <EmptyState icon={<BookOpen size={22} />} title="No progress yet" description="Start a quiz to build your topic ability scores." />}</Card>
				<Card className="overflow-hidden"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h3 className="font-bold text-slate-900">Topics to revisit</h3><p className="mt-1 text-xs text-slate-500">Weakest recent accuracy</p></div><span className="flex size-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><Target size={18} /></span></div>{loading ? <TopicSkeleton rows={3} /> : weakTopics.length ? <div className="divide-y divide-slate-100">{weakTopics.slice(0, 5).map((topic) => <div key={topic.topic_id} className="flex items-center justify-between gap-3 px-5 py-4"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800">{topic.topic_name}</p><p className="mt-1 text-xs text-slate-500">{topic.attempts_count} recent attempts</p></div><Badge tone="rose">{Math.round(Number(topic.accuracy))}%</Badge></div>)}</div> : <EmptyState icon={<Sparkles size={21} />} title="You’re all caught up" description="A topic appears here after at least three recent answers." />}</Card>
			</div>
		</div>
	);
}

function Stat({ icon, label, value, change, loading }) {
	return <Card className="p-5"><div className="flex items-center justify-between"><p className="text-xs font-semibold text-slate-500">{label}</p><span className="flex size-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">{icon}</span></div>{loading ? <Skeleton className="mt-4 h-8 w-16" /> : <p className="mt-4 text-2xl font-extrabold text-slate-900">{value}</p>}<p className="mt-1 text-xs text-slate-500">{change}</p></Card>;
}

function TopicSkeleton({ rows = 5 }) {
	return <div className="space-y-4 p-5">{Array.from({ length: rows }, (_, index) => <div key={index} className="flex items-center gap-3"><Skeleton className="h-8 flex-1" /><Skeleton className="h-6 w-12" /><Skeleton className="h-6 w-12" /></div>)}</div>;
}

export default StudentHome;
