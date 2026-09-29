import { useEffect, useState } from "react";
import { Target } from "lucide-react";
import { Card, Skeleton } from "../../components/ui/index.js";
import { getWeakTopics } from "../../api/student.api.js";
import WeakTopicList from "./WeakTopicList.jsx";

function StudentWeakTopicsPage() {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getWeakTopics()
      .then((rows) => { if (mounted) setTopics(rows); })
      .catch(() => { if (mounted) setTopics([]); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  return (
    <div>
      <section className="mb-6"><p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Focused practice</p><h2 className="mt-2 text-2xl font-extrabold text-slate-950">Weak topics</h2><p className="mt-2 text-sm text-slate-500">Topics are ranked by your latest accuracy. Practice or ask the AI assistant for help.</p></section>
      <Card className="overflow-hidden"><div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4"><span className="flex size-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700"><Target size={18} /></span><div><h3 className="font-bold text-slate-900">Your review list</h3><p className="mt-1 text-xs text-slate-500">Topics require at least three attempts to appear.</p></div></div>{loading ? <div className="space-y-4 p-5">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-16 w-full" />)}</div> : <WeakTopicList topics={topics} />}</Card>
    </div>
  );
}

export default StudentWeakTopicsPage;