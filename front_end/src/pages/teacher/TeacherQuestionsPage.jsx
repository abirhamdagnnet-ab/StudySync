import { useEffect, useMemo, useState } from "react";
import { Minus, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Badge, Button, Card, EmptyState, Input, Modal, Skeleton, Table } from "../../components/ui/index.js";
import { listTopics, listQuestions, listTopicQuestions, createQuestion, updateQuestion, deleteQuestion } from "../../api/catalog.api.js";
import useAuth from "../../hooks/useAuth.js";
import { notifyPromise } from "../../utils/toast.js";

const emptyForm = { topic_id: "", prompt: "", options: ["", ""], correct_index: "0", difficulty: "2", explanation: "" };
const backendMessage = (error) => error.response?.data?.message || "Could not save question";

function TeacherQuestionsPage() {
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [topicFilter, setTopicFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadQuestions = async () => {
    const params = { page: 1, limit: 100 };
    if (difficultyFilter !== "all") params.difficulty = Number(difficultyFilter);
    const result = topicFilter === "all"
      ? await listQuestions(params)
      : await listTopicQuestions(topicFilter, params);
    setQuestions(result.items);
  };

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.all([listTopics(), loadQuestions()])
      .then(([topicData]) => { if (mounted) setTopics(topicData); })
      .catch(() => { if (mounted) setQuestions([]); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [topicFilter, difficultyFilter]);

  const filteredQuestions = useMemo(() => questions.filter((question) =>
    `${question.prompt} ${topics.find((topic) => String(topic.id) === String(question.topic_id))?.name ?? ""}`
      .toLowerCase().includes(search.trim().toLowerCase()),
  ), [questions, topics, search]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, topic_id: topics[0] ? String(topics[0].id) : "" });
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (question) => {
    const options = question.options.map((option) => String(option));
    const correctIndex = options.findIndex((option) => option === String(question.correct_answer));
    setEditing(question);
    setForm({
      topic_id: String(question.topic_id),
      prompt: question.prompt,
      options,
      correct_index: String(Math.max(correctIndex, 0)),
      difficulty: String(question.difficulty),
      explanation: question.explanation,
    });
    setFormError("");
    setModalOpen(true);
  };

  const submit = async (event) => {
    event.preventDefault();
    const options = form.options.map((option) => option.trim());
    if (options.length < 2 || options.length > 6 || options.some((option) => !option)) {
      setFormError("Add between 2 and 6 non-empty answer options.");
      return;
    }
    const payload = {
      topic_id: form.topic_id,
      prompt: form.prompt.trim(),
      options,
      correct_answer: options[Number(form.correct_index)],
      difficulty: Number(form.difficulty),
      explanation: form.explanation.trim(),
    };
    setSubmitting(true);
    try {
      const request = editing ? updateQuestion(editing.id, payload) : createQuestion(payload);
      await notifyPromise(request, {
        loading: editing ? "Updating question..." : "Creating question...",
        success: editing ? "Question updated" : "Question created",
        error: backendMessage,
      });
      setModalOpen(false);
      await loadQuestions();
    } catch {
      // notifyPromise displays the backend error.
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      await notifyPromise(deleteQuestion(deleteTarget.id), {
        loading: "Deleting question...",
        success: "Question deleted",
        error: backendMessage,
      });
      setDeleteTarget(null);
      await loadQuestions();
    } catch {
      // notifyPromise displays the backend error.
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { key: "prompt", header: "Question", render: (question) => <div className="max-w-xl"><p className="line-clamp-2 font-semibold text-slate-800">{question.prompt}</p><p className="mt-1 text-xs text-slate-500">{topics.find((topic) => String(topic.id) === String(question.topic_id))?.name ?? `Topic ${question.topic_id}`}</p></div> },
    { key: "difficulty", header: "Level", render: (question) => <Badge tone={question.difficulty === 3 ? "rose" : question.difficulty === 2 ? "amber" : "green"}>Level {question.difficulty}</Badge> },
    { key: "actions", header: "Actions", render: (question) => String(question.created_by) === String(user?.id) ? <div className="flex items-center justify-end gap-1"><button type="button" onClick={() => openEdit(question)} aria-label="Edit question" className="rounded-lg p-2 text-slate-500 hover:bg-indigo-50 hover:text-indigo-700"><Pencil size={16} /></button><button type="button" onClick={() => setDeleteTarget(question)} aria-label="Delete question" className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-700"><Trash2 size={16} /></button></div> : <span className="text-xs text-slate-400">View only</span> },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Question bank</p><h2 className="mt-2 text-2xl font-extrabold text-slate-950">Questions</h2><p className="mt-2 text-sm text-slate-500">Create practice questions and maintain your own content.</p></div><Button onClick={openCreate} disabled={!topics.length}><Plus size={16} /> Add question</Button></div>
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center"><Input aria-label="Search questions" placeholder="Search question text or topic..." icon={<Search size={16} />} value={search} onChange={(event) => setSearch(event.target.value)} className="flex-1" /><select aria-label="Filter by topic" value={topicFilter} onChange={(event) => setTopicFilter(event.target.value)} className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700"><option value="all">All topics</option>{topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}</select><select aria-label="Filter by difficulty" value={difficultyFilter} onChange={(event) => setDifficultyFilter(event.target.value)} className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700"><option value="all">All levels</option><option value="1">Level 1</option><option value="2">Level 2</option><option value="3">Level 3</option></select></div>
        {loading ? <QuestionSkeleton /> : <Table columns={columns} data={filteredQuestions} emptyTitle="No questions found" emptyDescription={topics.length ? "Change your filters or add a new question." : "Create a topic before adding questions."} />}
      </Card>

      <Modal open={modalOpen} onClose={() => !submitting && setModalOpen(false)} title={editing ? "Edit question" : "Create question"} className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <form onSubmit={submit} className="space-y-4">
          <label className="block text-sm font-medium text-slate-700">Topic<select required value={form.topic_id} onChange={(event) => setForm({ ...form, topic_id: event.target.value })} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100">{topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}</select></label>
          <label className="block text-sm font-medium text-slate-700">Question prompt<textarea required maxLength={5000} rows={3} value={form.prompt} onChange={(event) => setForm({ ...form, prompt: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" /></label>
          <div><div className="mb-2 flex items-center justify-between"><label className="text-sm font-medium text-slate-700">Answer options <span className="text-xs font-normal text-slate-400">2 to 6</span></label><Button type="button" variant="secondary" className="min-h-8 px-2.5 text-xs" disabled={form.options.length >= 6} onClick={() => setForm({ ...form, options: [...form.options, ""] })}><Plus size={14} /> Add option</Button></div><div className="space-y-2">{form.options.map((option, index) => <div key={index} className="flex items-center gap-2"><Input aria-label={`Option ${index + 1}`} placeholder={`Option ${index + 1}`} value={option} onChange={(event) => setForm({ ...form, options: form.options.map((value, optionIndex) => optionIndex === index ? event.target.value : value) })} /><button type="button" aria-label={`Remove option ${index + 1}`} disabled={form.options.length <= 2} onClick={() => { const options = form.options.filter((_value, optionIndex) => optionIndex !== index); const oldCorrect = Number(form.correct_index); setForm({ ...form, options, correct_index: String(oldCorrect === index ? 0 : oldCorrect > index ? oldCorrect - 1 : oldCorrect) }); }} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-30"><Minus size={16} /></button></div>)}</div></div>
          <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium text-slate-700">Correct answer<select value={form.correct_index} onChange={(event) => setForm({ ...form, correct_index: event.target.value })} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100">{form.options.map((option, index) => <option key={index} value={index}>{option.trim() || `Option ${index + 1}`}</option>)}</select></label><label className="block text-sm font-medium text-slate-700">Difficulty<select value={form.difficulty} onChange={(event) => setForm({ ...form, difficulty: event.target.value })} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"><option value="1">Level 1 · Introductory</option><option value="2">Level 2 · Intermediate</option><option value="3">Level 3 · Advanced</option></select></label></div>
          <label className="block text-sm font-medium text-slate-700">Explanation<textarea required maxLength={10000} rows={3} value={form.explanation} onChange={(event) => setForm({ ...form, explanation: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" /></label>
          {formError && <p role="alert" className="text-sm text-rose-600">{formError}</p>}
          <div className="flex justify-end gap-2 pt-2"><Button variant="secondary" disabled={submitting} onClick={() => setModalOpen(false)}>Cancel</Button><Button type="submit" loading={submitting}>{editing ? "Save changes" : "Create question"}</Button></div>
        </form>
      </Modal>

      <Modal open={Boolean(deleteTarget)} onClose={() => !submitting && setDeleteTarget(null)} title="Delete question?">
        <p className="text-sm leading-6 text-slate-600">Delete “{deleteTarget?.prompt}”? This cannot be undone.</p><div className="mt-6 flex justify-end gap-2"><Button variant="secondary" disabled={submitting} onClick={() => setDeleteTarget(null)}>Cancel</Button><Button variant="danger" loading={submitting} onClick={remove}>Delete question</Button></div>
      </Modal>
    </div>
  );
}

function QuestionSkeleton() {
  return <div className="space-y-4 p-5">{Array.from({ length: 6 }, (_, index) => <div key={index} className="flex items-center gap-4"><Skeleton className="h-10 flex-1" /><Skeleton className="h-7 w-20" /><Skeleton className="h-8 w-14" /></div>)}</div>;
}

export default TeacherQuestionsPage;