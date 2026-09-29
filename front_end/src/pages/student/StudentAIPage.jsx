import { useEffect, useState } from "react";
import { ArrowLeft, Bot, Sparkles } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { Badge, Button, Card, Skeleton } from "../../components/ui/index.js";
import { explainWeakTopic } from "../../api/student.api.js";

function StudentAIPage() {
  const [searchParams] = useSearchParams();
  const topicId = searchParams.get("topicId");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(Boolean(topicId));
  const [requestKey, setRequestKey] = useState(0);

  useEffect(() => {
    if (!topicId) {
      setResult(null);
      setLoading(false);
      return undefined;
    }
    let mounted = true;
    setLoading(true);
    explainWeakTopic(topicId)
      .then((data) => { if (mounted) setResult(data); })
      .catch((error) => { if (mounted) setResult({ error: error.response?.data?.message || error.message || "The assistant could not respond right now." }); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [topicId, requestKey]);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700"><Bot size={22} /></span><div><p className="text-xs font-bold uppercase tracking-widest text-indigo-600">StudySync AI</p><h2 className="mt-1 text-2xl font-extrabold text-slate-950">Study assistant</h2></div></div>
      {!topicId ? <Card className="p-6 sm:p-8"><span className="flex size-11 items-center justify-center rounded-xl bg-violet-50 text-violet-700"><Sparkles size={21} /></span><h3 className="mt-4 text-lg font-bold text-slate-900">Get help with a topic</h3><p className="mt-2 text-sm leading-6 text-slate-600">Choose “Explain with AI” from your weak topics to get an explanation based on your recent incorrect answers, with two simple examples.</p><Link to="/student/weak-topics" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 hover:text-indigo-900"><ArrowLeft size={15} /> Browse weak topics</Link></Card> : loading ? <Card className="space-y-4 p-6"><Skeleton className="h-7 w-48" /><Skeleton className="h-20 w-full" /><Skeleton className="h-40 w-full" /></Card> : result?.error ? <Card className="p-6"><p className="text-sm text-rose-700">{result.error}</p><Button variant="secondary" className="mt-4" onClick={() => setRequestKey((value) => value + 1)}>Try again</Button></Card> : result?.has_data === false ? <Card className="p-6"><Badge tone="slate">Not enough data</Badge><h3 className="mt-4 text-lg font-bold text-slate-900">Start with a few questions</h3><p className="mt-2 text-sm leading-6 text-slate-600">{result.message}</p><Link to={`/student/quiz?topicId=${encodeURIComponent(topicId)}`} className="mt-5 inline-flex min-h-10 items-center justify-center rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700">Practice this topic</Link></Card> : <Card className="p-6 sm:p-8"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><Badge tone="indigo">{result.topic_name}</Badge><h3 className="mt-3 text-lg font-bold text-slate-900">A clearer way to think about it</h3><p className="mt-1 text-xs text-slate-500">Based on {result.recent_attempts} recent attempts · {result.accuracy}% accuracy</p></div><Button variant="secondary" className="self-start" onClick={() => setRequestKey((value) => value + 1)}><Sparkles size={15} /> Explain again</Button></div><div className="mt-6 whitespace-pre-wrap text-sm leading-7 text-slate-700">{result.answer}</div><div className="mt-7 border-t border-slate-100 pt-5"><Link to={`/student/quiz?topicId=${encodeURIComponent(topicId)}`} className="inline-flex min-h-10 items-center justify-center rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700">Practice this topic</Link></div></Card>}
    </div>
  );
}

export default StudentAIPage;
