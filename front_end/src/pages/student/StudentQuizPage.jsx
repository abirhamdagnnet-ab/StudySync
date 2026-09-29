import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle, CircleHelp, RotateCcw, Sparkles, XCircle } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { Badge, Button, Card, EmptyState, Skeleton } from "../../components/ui/index.js";
import { listSubjects, listTopics, listTopicQuestions } from "../../api/catalog.api.js";
import { finishSession, getNextQuestion, startSession, submitAnswer } from "../../api/quiz.api.js";
import { notifyError, notifySuccess } from "../../utils/toast.js";

const difficultyLabels = { 1: "Easy", 2: "Medium", 3: "Hard" };
const difficultyTones = { 1: "green", 2: "amber", 3: "rose" };
const formatOption = (option) => typeof option === "string" ? option : JSON.stringify(option);

function StudentQuizPage() {
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [subjectId, setSubjectId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [starting, setStarting] = useState(false);
  const [loadingNext, setLoadingNext] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [session, setSession] = useState(null);
  const [question, setQuestion] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [summary, setSummary] = useState(null);
  const [exhausted, setExhausted] = useState(false);
  const [searchParams] = useSearchParams();
  const autoStartedTopic = useRef(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([listSubjects(), listTopics()])
      .then(([subjectData, topicData]) => {
        if (!mounted) return;
        setSubjects(subjectData);
        setTopics(topicData);
      })
      .catch(() => {
        if (mounted) {
          setSubjects([]);
          setTopics([]);
        }
      })
      .finally(() => { if (mounted) setLoadingCatalog(false); });
    return () => { mounted = false; };
  }, []);

  const availableTopics = useMemo(
    () => topics.filter((topic) => String(topic.subject_id) === String(subjectId)),
    [topics, subjectId],
  );

  const beginQuiz = useCallback(async (selectedTopicId) => {
    if (!selectedTopicId) return;
    setTopicId(String(selectedTopicId));
    setSubjectId(String(topics.find((topic) => String(topic.id) === String(selectedTopicId))?.subject_id ?? ""));
    setStarting(true);
    try {
      const questionsPage = await listTopicQuestions(selectedTopicId, { page: 1, limit: 1 });
      const newSession = await startSession(selectedTopicId);
      const next = await getNextQuestion(newSession.id);
      if (next.no_more_questions) {
        const result = await finishSession(newSession.id);
        setTotalQuestions(questionsPage.total);
        setAnsweredCount(0);
        setQuestion(null);
        setSummary(result);
        setExhausted(true);
      } else {
        setQuestion(next.question);
        setTotalQuestions(questionsPage.total);
        setAnsweredCount(0);
        setSummary(null);
        setExhausted(false);
      }
      // Switch to the quiz view only after its first question (or summary) is ready.
      setSession(newSession);
    } catch {
      // The API interceptor displays backend errors.
    } finally {
      setStarting(false);
    }
  }, [topics]);

  const requestedTopicId = searchParams.get("topicId");

  useEffect(() => {
    if (loadingCatalog || !requestedTopicId || !topics.length || autoStartedTopic.current === requestedTopicId) return;
    const requestedTopic = topics.find((topic) => String(topic.id) === requestedTopicId);
    if (!requestedTopic) return;
    autoStartedTopic.current = requestedTopicId;
    beginQuiz(requestedTopicId);
  }, [loadingCatalog, requestedTopicId, topics, beginQuiz]);

  const completeSession = async (isExhausted = false) => {
    const result = await finishSession(session.id);
    setSummary(result);
    setExhausted(isExhausted);
    setQuestion(null);
    setFeedback(null);
  };

  const startQuiz = async (event) => {
    event.preventDefault();
    if (!topicId) {
      notifyError("Choose a subject and topic to start.");
      return;
    }

    await beginQuiz(topicId);
  };

  const answerQuestion = async () => {
    if (selectedOption === null || !question || !session) return;
    setSubmitting(true);
    try {
      const result = await submitAnswer(session.id, question.id, question.options[selectedOption]);
      setFeedback(result);
      setAnsweredCount((count) => count + 1);
      if (result.is_correct) notifySuccess("Correct answer!");
      else notifyError("Not quite. Review the explanation and keep going.");
    } catch {
      // The API interceptor displays backend errors.
    } finally {
      setSubmitting(false);
    }
  };

  const nextQuestion = async () => {
    if (!session) return;
    setLoadingNext(true);
    try {
      const next = await getNextQuestion(session.id);
      if (next.no_more_questions) {
        await completeSession(true);
      } else {
        setQuestion(next.question);
        setSelectedOption(null);
        setFeedback(null);
      }
    } catch {
      // The API interceptor displays backend errors.
    } finally {
      setLoadingNext(false);
    }
  };

  const restart = () => {
    setSession(null);
    setQuestion(null);
    setSelectedOption(null);
    setFeedback(null);
    setSummary(null);
    setAnsweredCount(0);
    setExhausted(false);
  };

  if (loadingCatalog) return <SetupSkeleton />;

  if (!session) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="mb-6"><p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Practice session</p><h2 className="mt-2 text-2xl font-extrabold text-slate-950">Choose what to practice</h2><p className="mt-2 text-sm text-slate-500">Your session starts at medium difficulty and adapts as you answer.</p></div>
        {subjects.length === 0 ? <Card><EmptyState icon={<BookOpen size={22} />} title="No subjects available" description="Ask your teacher to add learning content before starting a quiz." /></Card> : (
          <Card className="p-5 sm:p-7"><form onSubmit={startQuiz} className="space-y-5">
            <label className="block text-sm font-semibold text-slate-700">Subject<select required value={subjectId} onChange={(event) => { setSubjectId(event.target.value); setTopicId(""); }} className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"><option value="">Choose a subject</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select></label>
            <label className="block text-sm font-semibold text-slate-700">Topic<select required disabled={!subjectId || availableTopics.length === 0} value={topicId} onChange={(event) => setTopicId(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50 disabled:text-slate-400"><option value="">{subjectId ? "Choose a topic" : "Choose a subject first"}</option>{availableTopics.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}</select></label>
            {subjectId && availableTopics.length === 0 && <p className="text-sm text-amber-700">No topics are available for this subject yet.</p>}
            <div className="flex items-start gap-3 rounded-xl bg-indigo-50 p-4 text-sm text-indigo-900"><Sparkles size={18} className="mt-0.5 shrink-0 text-indigo-600" /><p>Each session shows one question at a time. Your answer and explanation are saved as you go.</p></div>
            <Button type="submit" loading={starting} disabled={!topicId || starting} className="w-full sm:w-auto">Start quiz <ArrowRight size={16} /></Button>
          </form></Card>
        )}
      </div>
    );
  }

  if (summary) {
    const total = Number(summary.summary.total_questions);
    const correct = Number(summary.summary.correct_answers);
    const accuracy = total ? Math.round((correct / total) * 100) : 0;
    const initialDifficulty = Number(session.current_difficulty);
    const finalDifficulty = Number(summary.session.current_difficulty);
    return (
      <div className="mx-auto max-w-2xl">
        <Card className="overflow-hidden">
          <div className="bg-indigo-700 px-6 py-8 text-white sm:px-8"><span className="text-xs font-bold uppercase tracking-widest text-indigo-200">Session complete</span><h2 className="mt-2 text-2xl font-extrabold">{exhausted ? "No more questions" : "Quiz summary"}</h2><p className="mt-2 text-sm leading-6 text-indigo-100">{exhausted ? "You reached the end of the available questions for this topic." : "Here’s how you did in this session."}</p></div>
          <div className="grid gap-3 p-5 sm:grid-cols-3 sm:p-7"><SummaryStat label="Score" value={`${correct} / ${total}`} /><SummaryStat label="Accuracy" value={`${accuracy}%`} /><SummaryStat label="Difficulty" value={`${difficultyLabels[initialDifficulty]} → ${difficultyLabels[finalDifficulty]}`} /></div>
          <div className="flex flex-col gap-3 border-t border-slate-100 p-5 sm:flex-row sm:justify-between sm:px-7"><Link to="/student" className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">Back to dashboard</Link><Button onClick={restart}><RotateCcw size={16} /> Start another quiz</Button></div>
        </Card>
      </div>
    );
  }

  const progressPercent = totalQuestions ? Math.min(100, (answeredCount / totalQuestions) * 100) : 0;
  const difficulty = Number(question?.difficulty);
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 flex items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Quiz in progress</p><h2 className="mt-1 text-lg font-bold text-slate-900">{topics.find((topic) => String(topic.id) === String(topicId))?.name ?? "Topic practice"}</h2></div><Badge tone={difficultyTones[difficulty] ?? "slate"}>{difficultyLabels[difficulty] ?? "Practice"}</Badge></div>
      <div className="mb-5"><div className="mb-2 flex justify-between text-xs font-medium text-slate-500"><span>Question {answeredCount + 1}{totalQuestions ? ` of ${totalQuestions}` : ""}</span><span>{Math.round(progressPercent)}%</span></div><div className="h-2.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-indigo-600 transition-[width] duration-300" style={{ width: `${progressPercent}%` }} /></div></div>

      <Card className="p-5 sm:p-8">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500"><CircleHelp size={15} /> Choose the best answer</div>
        <h3 className="mt-4 text-xl font-bold leading-8 text-slate-950">{question.prompt}</h3>
        <div className="mt-6 space-y-3">
          {question.options.map((option, index) => {
            const selected = selectedOption === index;
            return <button key={`${index}-${formatOption(option)}`} type="button" disabled={Boolean(feedback) || submitting} onClick={() => setSelectedOption(index)} className={`flex min-h-14 w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${selected ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100" : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50"} disabled:cursor-default`} aria-pressed={selected}>
              <span className={`flex size-7 shrink-0 items-center justify-center rounded-lg border text-xs font-bold ${selected ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300 text-slate-500"}`}>{String.fromCharCode(65 + index)}</span><span className="text-sm font-medium text-slate-800">{formatOption(option)}</span>
            </button>;
          })}
        </div>

        {feedback && <div className={`mt-6 rounded-xl border p-4 ${feedback.is_correct ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"}`}>
          <div className="flex items-center gap-2">{feedback.is_correct ? <CheckCircle size={19} className="text-emerald-600" /> : <XCircle size={19} className="text-rose-600" />}<p className={`text-sm font-bold ${feedback.is_correct ? "text-emerald-800" : "text-rose-800"}`}>{feedback.is_correct ? "Correct!" : "Not quite"}</p></div>
          <p className="mt-2 text-sm leading-6 text-slate-700">{feedback.explanation}</p>
        </div>}

        <div className="mt-6 flex justify-end">{feedback ? <Button onClick={nextQuestion} loading={loadingNext}>Next <ArrowRight size={16} /></Button> : <Button onClick={answerQuestion} loading={submitting} disabled={selectedOption === null || submitting}>Submit answer</Button>}</div>
      </Card>
    </div>
  );
}

function SummaryStat({ label, value }) {
  return <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-2 text-xl font-extrabold text-slate-900">{value}</p></div>;
}

function SetupSkeleton() {
  return <Card className="mx-auto max-w-3xl space-y-5 p-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /><Skeleton className="h-11 w-36" /></Card>;
}

export default StudentQuizPage;
