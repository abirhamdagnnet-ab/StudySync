import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Badge, Button, Card, EmptyState, Input, Modal, Skeleton, Table } from "../../components/ui/index.js";
import * as catalogApi from "../../api/catalog.api.js";
import { notifyPromise } from "../../utils/toast.js";

const configs = {
  subjects: {
    title: "Subjects",
    singular: "subject",
    description: "Organize the main areas of study in the catalog.",
    columns: [
      { key: "name", header: "Subject", render: (row) => <span className="font-semibold text-slate-800">{row.name}</span> },
      { key: "description", header: "Description", className: "hidden md:table-cell", cellClassName: "hidden md:table-cell text-slate-500", render: (row) => row.description || "—" },
    ],
    empty: "No subjects yet",
  },
  topics: {
    title: "Topics",
    singular: "topic",
    description: "Group questions into focused learning topics.",
    columns: [
      { key: "name", header: "Topic", render: (row) => <span className="font-semibold text-slate-800">{row.name}</span> },
      { key: "subject_name", header: "Subject", render: (row) => <Badge tone="indigo">{row.subject_name || `Subject ${row.subject_id}`}</Badge> },
      { key: "description", header: "Description", className: "hidden lg:table-cell", cellClassName: "hidden lg:table-cell text-slate-500", render: (row) => row.description || "—" },
    ],
    empty: "No topics yet",
  },
  questions: {
    title: "Questions",
    singular: "question",
    description: "Maintain the question bank used by adaptive quizzes.",
    columns: [
      { key: "prompt", header: "Question", render: (row) => <div className="max-w-lg"><p className="line-clamp-2 font-semibold text-slate-800">{row.prompt}</p><p className="mt-1 text-xs text-slate-500">{row.topic_name || `Topic ${row.topic_id}`}</p></div> },
      { key: "difficulty", header: "Difficulty", render: (row) => <Badge tone={row.difficulty === 3 ? "rose" : row.difficulty === 2 ? "amber" : "green"}>Level {row.difficulty}</Badge> },
      { key: "correct_answer", header: "Answer", className: "hidden md:table-cell", cellClassName: "hidden md:table-cell text-slate-600", render: (row) => formatOption(row.correct_answer) },
    ],
    empty: "No questions yet",
  },
};

const blankForm = {
  name: "",
  description: "",
  subject_id: "",
  topic_id: "",
  prompt: "",
  optionsText: "",
  correct_answer: "",
  difficulty: "2",
  explanation: "",
};

const backendMessage = (error, fallback) => error.response?.data?.message || fallback;
const formatOption = (value) => typeof value === "string" ? value : JSON.stringify(value);

function AdminCatalogPage({ entity }) {
  const config = configs[entity];
  const [rows, setRows] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [topicFilter, setTopicFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(blankForm);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (entity === "subjects") {
        setRows(await catalogApi.listSubjects());
        return;
      }
      if (entity === "topics") {
        const [topicData, subjectData] = await Promise.all([catalogApi.listTopics(), catalogApi.listSubjects()]);
        setSubjects(subjectData);
        setRows(topicData.map((topic) => ({ ...topic, subject_name: subjectData.find((subject) => String(subject.id) === String(topic.subject_id))?.name })));
        return;
      }
      const [questionData, topicData, subjectData] = await Promise.all([
        catalogApi.listQuestions({ page: 1, limit: 100 }),
        catalogApi.listTopics(),
        catalogApi.listSubjects(),
      ]);
      setTopics(topicData.map((topic) => ({ ...topic, subject_name: subjectData.find((subject) => String(subject.id) === String(topic.subject_id))?.name })));
      setRows(questionData.items.map((question) => ({ ...question, topic_name: topicData.find((topic) => String(topic.id) === String(question.topic_id))?.name })));
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [entity]);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredRows = useMemo(() => rows.filter((row) => {
    const searchValue = entity === "questions" ? `${row.prompt} ${row.topic_name}` : `${row.name} ${row.description ?? ""} ${row.subject_name ?? ""}`;
    const matchesSearch = searchValue.toLowerCase().includes(search.trim().toLowerCase());
    const matchesSubject = entity !== "topics" || subjectFilter === "all" || String(row.subject_id) === subjectFilter;
    const matchesTopic = entity !== "questions" || topicFilter === "all" || String(row.topic_id) === topicFilter;
    const matchesDifficulty = entity !== "questions" || difficultyFilter === "all" || String(row.difficulty) === difficultyFilter;
    return matchesSearch && matchesSubject && matchesTopic && matchesDifficulty;
  }), [rows, search, entity, subjectFilter, topicFilter, difficultyFilter]);

  const openCreate = () => {
    setEditTarget(false);
    setForm({ ...blankForm, subject_id: subjects[0] ? String(subjects[0].id) : "", topic_id: topics[0] ? String(topics[0].id) : "" });
    setFormError("");
  };

  const openEdit = (row) => {
    setEditTarget(row);
    setForm({
      ...blankForm,
      name: row.name ?? "",
      description: row.description ?? "",
      subject_id: String(row.subject_id ?? subjects[0]?.id ?? ""),
      topic_id: String(row.topic_id ?? topics[0]?.id ?? ""),
      prompt: row.prompt ?? "",
      optionsText: row.options?.map(formatOption).join("\n") ?? "",
      correct_answer: row.correct_answer === undefined ? "" : formatOption(row.correct_answer),
      difficulty: String(row.difficulty ?? 2),
      explanation: row.explanation ?? "",
    });
    setFormError("");
  };

  const submitForm = async (event) => {
    event.preventDefault();
    setFormError("");
    let payload;

    if (entity === "subjects") {
      payload = { name: form.name.trim(), description: form.description.trim() || null };
    } else if (entity === "topics") {
      payload = { subject_id: form.subject_id, name: form.name.trim(), description: form.description.trim() || null };
    } else {
      const options = form.optionsText.split("\n").map((option) => option.trim()).filter(Boolean);
      if (options.length < 2 || options.length > 6) {
        setFormError("Enter between 2 and 6 options, one per line.");
        return;
      }
      if (!options.includes(form.correct_answer.trim())) {
        setFormError("Correct answer must exactly match one of the options.");
        return;
      }
      payload = {
        topic_id: form.topic_id,
        prompt: form.prompt.trim(),
        options,
        correct_answer: form.correct_answer.trim(),
        difficulty: Number(form.difficulty),
        explanation: form.explanation.trim(),
      };
    }

    const action = editTarget
      ? entity === "subjects" ? catalogApi.updateSubject(editTarget.id, payload) : entity === "topics" ? catalogApi.updateTopic(editTarget.id, payload) : catalogApi.updateQuestion(editTarget.id, payload)
      : entity === "subjects" ? catalogApi.createSubject(payload) : entity === "topics" ? catalogApi.createTopic(payload) : catalogApi.createQuestion(payload);
    setSubmitting(true);
    try {
      await notifyPromise(action, {
        loading: `${editTarget ? "Saving" : "Creating"} ${config.singular}...`,
        success: `${config.singular[0].toUpperCase()}${config.singular.slice(1)} ${editTarget ? "updated" : "created"}`,
        error: (error) => backendMessage(error, `Could not save ${config.singular}`),
      });
      setEditTarget(null);
      await loadData();
    } catch {
      // notifyPromise displays the backend error.
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const action = entity === "subjects" ? catalogApi.deleteSubject(deleteTarget.id) : entity === "topics" ? catalogApi.deleteTopic(deleteTarget.id) : catalogApi.deleteQuestion(deleteTarget.id);
    setSubmitting(true);
    try {
      await notifyPromise(action, {
        loading: `Deleting ${config.singular}...`,
        success: `${config.singular[0].toUpperCase()}${config.singular.slice(1)} deleted`,
        error: (error) => backendMessage(error, `Could not delete ${config.singular}`),
      });
      setDeleteTarget(null);
      await loadData();
    } catch {
      // notifyPromise displays the backend error.
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    ...config.columns,
    { key: "actions", header: "Actions", render: (row) => <div className="flex items-center justify-end gap-1"><button type="button" onClick={() => openEdit(row)} aria-label={`Edit ${config.singular}`} className="rounded-lg p-2 text-slate-500 hover:bg-indigo-50 hover:text-indigo-700"><Pencil size={16} /></button><button type="button" onClick={() => setDeleteTarget(row)} aria-label={`Delete ${config.singular}`} className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-700"><Trash2 size={16} /></button></div> },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Learning catalog</p><h2 className="mt-2 text-2xl font-extrabold text-slate-950">{config.title}</h2><p className="mt-2 text-sm text-slate-500">{config.description}</p></div>
        <Button onClick={openCreate}><Plus size={16} /> Add {config.singular}</Button>
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center">
          <Input aria-label={`Search ${config.title.toLowerCase()}`} placeholder={`Search ${config.title.toLowerCase()}...`} icon={<Search size={16} />} value={search} onChange={(event) => setSearch(event.target.value)} className="flex-1" />
          {entity === "topics" && <FilterSelect label="Filter by subject" value={subjectFilter} onChange={setSubjectFilter}><option value="all">All subjects</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</FilterSelect>}
          {entity === "questions" && <><FilterSelect label="Filter by topic" value={topicFilter} onChange={setTopicFilter}><option value="all">All topics</option>{topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}</FilterSelect><FilterSelect label="Filter by difficulty" value={difficultyFilter} onChange={setDifficultyFilter}><option value="all">All levels</option><option value="1">Level 1</option><option value="2">Level 2</option><option value="3">Level 3</option></FilterSelect></>}
          <span className="whitespace-nowrap text-xs font-medium text-slate-500">{filteredRows.length} records</span>
        </div>
        {loading ? <CatalogSkeleton /> : <Table columns={columns} data={filteredRows} emptyTitle={config.empty} emptyDescription={`Create a ${config.singular} or change your filters.`} />}
      </Card>

      <Modal open={editTarget !== null} onClose={() => !submitting && setEditTarget(null)} title={`${editTarget ? "Edit" : "Add"} ${config.singular}`} className={entity === "questions" ? "max-h-[90vh] max-w-2xl overflow-y-auto" : ""}>
        <form className="space-y-4" onSubmit={submitForm}>
          {entity === "subjects" && <><Input label="Name" required maxLength={120} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /><Input label="Description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></>}
          {entity === "topics" && <><SelectField label="Subject" required value={form.subject_id} onChange={(value) => setForm({ ...form, subject_id: value })}>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</SelectField><Input label="Name" required maxLength={120} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /><Input label="Description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></>}
          {entity === "questions" && <><SelectField label="Topic" required value={form.topic_id} onChange={(value) => setForm({ ...form, topic_id: value })}>{topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.subject_name ? `${topic.subject_name} · ` : ""}{topic.name}</option>)}</SelectField><TextArea label="Question prompt" required value={form.prompt} onChange={(event) => setForm({ ...form, prompt: event.target.value })} /><TextArea label="Options (one per line)" required value={form.optionsText} onChange={(event) => setForm({ ...form, optionsText: event.target.value })} rows={4} /><Input label="Correct answer (must exactly match an option)" required value={form.correct_answer} onChange={(event) => setForm({ ...form, correct_answer: event.target.value })} /><SelectField label="Difficulty" value={form.difficulty} onChange={(value) => setForm({ ...form, difficulty: value })}><option value="1">Level 1</option><option value="2">Level 2</option><option value="3">Level 3</option></SelectField><TextArea label="Explanation" required value={form.explanation} onChange={(event) => setForm({ ...form, explanation: event.target.value })} rows={3} /></>}
          {formError && <p role="alert" className="text-sm text-rose-600">{formError}</p>}
          <div className="flex justify-end gap-2 pt-2"><Button variant="secondary" disabled={submitting} onClick={() => setEditTarget(null)}>Cancel</Button><Button type="submit" loading={submitting}>{editTarget ? "Save changes" : `Create ${config.singular}`}</Button></div>
        </form>
      </Modal>

      <Modal open={Boolean(deleteTarget)} onClose={() => !submitting && setDeleteTarget(null)} title={`Delete ${config.singular}?`}>
        <p className="text-sm leading-6 text-slate-600">This action may be blocked if the {config.singular} is still in use. Delete <strong className="text-slate-800">{deleteTarget?.name || deleteTarget?.prompt}</strong>?</p>
        <div className="mt-6 flex justify-end gap-2"><Button variant="secondary" disabled={submitting} onClick={() => setDeleteTarget(null)}>Cancel</Button><Button variant="danger" loading={submitting} onClick={confirmDelete}>Delete</Button></div>
      </Modal>
    </div>
  );
}

function FilterSelect({ label, value, onChange, children }) {
  return <select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100">{children}</select>;
}

function SelectField({ label, value, onChange, required, children }) {
  return <label className="block text-sm font-medium text-slate-700">{label}<select required={required} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100">{children}</select></label>;
}

function TextArea({ label, rows = 3, ...props }) {
  return <label className="block text-sm font-medium text-slate-700">{label}<textarea rows={rows} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" {...props} /></label>;
}

function CatalogSkeleton() {
  return <div className="space-y-4 p-5">{Array.from({ length: 6 }, (_, index) => <div key={index} className="flex items-center gap-4"><Skeleton className="h-8 flex-1" /><Skeleton className="h-7 w-24" /><Skeleton className="h-8 w-16" /></div>)}</div>;
}

export default AdminCatalogPage;