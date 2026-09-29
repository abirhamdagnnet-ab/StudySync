import { Bot, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge, EmptyState } from "../../components/ui/index.js";

const accuracyTone = (accuracy) => {
  if (Number(accuracy) < 50) return { badge: "rose", bar: "bg-rose-500", label: "Needs focus" };
  if (Number(accuracy) < 75) return { badge: "amber", bar: "bg-amber-500", label: "Improving" };
  return { badge: "green", bar: "bg-emerald-500", label: "On track" };
};

function WeakTopicList({ topics, emptyTitle = "No weak topics yet", emptyDescription = "Complete a few quiz attempts and topics to revisit will appear here." }) {
  if (!topics?.length) return <EmptyState title={emptyTitle} description={emptyDescription} />;

  return (
    <ol className="divide-y divide-slate-100">
      {topics.map((topic, index) => {
        const accuracy = Math.max(0, Math.min(100, Number(topic.accuracy) || 0));
        const tone = accuracyTone(accuracy);
        return (
          <li key={topic.topic_id} className="flex flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:px-5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">{index + 1}</span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-slate-900">{topic.topic_name}</h3><Badge tone={tone.badge}>{tone.label}</Badge></div>
              <p className="mt-1 text-xs text-slate-500">Based on {topic.attempts_count} recent attempts</p>
              <div className="mt-3 flex items-center gap-3"><div className="h-2 min-w-24 flex-1 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${accuracy}%` }} /></div><span className="w-11 text-right text-xs font-bold text-slate-700">{Math.round(accuracy)}%</span></div>
            </div>
            <div className="flex shrink-0 gap-2 sm:justify-end">
              <Link to={`/student/quiz?topicId=${encodeURIComponent(topic.topic_id)}`} className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700"><Play size={14} /> Practice</Link>
              <Link to={`/student/assistant?topicId=${encodeURIComponent(topic.topic_id)}`} className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"><Bot size={14} /> Explain with AI</Link>
            </div>
            <span className="sr-only">Ranked weak topic {index + 1} of {topics.length}</span>
          </li>
        );
      })}
    </ol>
  );
}

export default WeakTopicList;