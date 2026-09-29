import { useCallback, useEffect, useState } from "react";
import { BookOpen, Plus, UserPlus, UserRoundX, Users } from "lucide-react";
import { Badge, Button, Card, EmptyState, Input, Modal, Skeleton } from "../../components/ui/index.js";
import { createClass, listClasses, listClassStudents, addStudent, removeStudent } from "../../api/teacher.api.js";
import { listSubjects } from "../../api/catalog.api.js";
import { notifyPromise } from "../../utils/toast.js";

const backendMessage = (error) => error.response?.data?.message || "The request could not be completed.";

function TeacherClassesPage() {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [manageClass, setManageClass] = useState(null);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [classForm, setClassForm] = useState({ name: "", subject_id: "" });
  const [studentEmail, setStudentEmail] = useState("");
  const [classError, setClassError] = useState("");
  const [studentError, setStudentError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [classRows, subjectRows] = await Promise.all([listClasses(), listSubjects()]);
      const classesWithStudents = await Promise.all(classRows.map(async (classroom) => ({
        ...classroom,
        students: await listClassStudents(classroom.id),
      })));
      setClasses(classesWithStudents);
      setSubjects(subjectRows);
    } catch {
      setClasses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const openCreate = () => {
    setClassForm({ name: "", subject_id: subjects[0] ? String(subjects[0].id) : "" });
    setClassError("");
    setCreateOpen(true);
  };

  const submitClass = async (event) => {
    event.preventDefault();
    if (!classForm.name.trim() || !classForm.subject_id) {
      setClassError("Enter a class name and choose a subject.");
      return;
    }
    setSubmitting(true);
    try {
      await notifyPromise(createClass({ ...classForm, name: classForm.name.trim() }), {
        loading: "Creating class...",
        success: "Class created",
        error: backendMessage,
      });
      setCreateOpen(false);
      await loadData();
    } catch {
      // notifyPromise displays the backend error.
    } finally {
      setSubmitting(false);
    }
  };

  const submitStudent = async (event) => {
    event.preventDefault();
    setStudentError("");
    if (!studentEmail.trim()) {
      setStudentError("Enter the student's email address.");
      return;
    }
    setSubmitting(true);
    try {
      await notifyPromise(addStudent(manageClass.id, studentEmail.trim()), {
        loading: "Adding student...",
        success: "Student added to class",
        error: backendMessage,
      });
      setStudentEmail("");
      await loadData();
    } catch {
      // notifyPromise displays the backend error.
    } finally {
      setSubmitting(false);
    }
  };

  const confirmRemoveStudent = async () => {
    if (!removeTarget || !manageClass) return;
    setSubmitting(true);
    try {
      await notifyPromise(removeStudent(manageClass.id, removeTarget.id), {
        loading: "Removing student...",
        success: "Student removed from class",
        error: backendMessage,
      });
      setRemoveTarget(null);
      await loadData();
    } catch {
      // notifyPromise displays the backend error.
    } finally {
      setSubmitting(false);
    }
  };

  const selectedClass = classes.find((classroom) => String(classroom.id) === String(manageClass?.id)) ?? manageClass;

  return (
    <div>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Teacher workspace</p><h2 className="mt-2 text-2xl font-extrabold text-slate-950">Classes</h2><p className="mt-2 text-sm text-slate-500">Create classes and manage student enrollment.</p></div><Button onClick={openCreate} disabled={!subjects.length}><Plus size={16} /> Create class</Button></div>
      {loading ? <ClassSkeleton /> : classes.length ? <div className="grid gap-4 xl:grid-cols-2">{classes.map((classroom) => {
        const subject = subjects.find((item) => String(item.id) === String(classroom.subject_id));
        return <Card key={classroom.id} className="p-5 transition hover:shadow-md">
          <div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700"><BookOpen size={19} /></span><div className="min-w-0"><h3 className="truncate font-bold text-slate-900">{classroom.name}</h3><p className="mt-1 text-sm text-slate-500">{subject?.name ?? "Subject"}</p></div></div><Badge tone="slate">{classroom.students.length} students</Badge></div>
          <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4"><div className="flex items-center gap-2 text-xs text-slate-500"><Users size={15} /> Student roster</div><Button variant="secondary" className="min-h-9 px-3 text-xs" onClick={() => { setManageClass(classroom); setStudentEmail(""); setStudentError(""); }}>Manage students</Button></div>
        </Card>;
      })}</div> : <Card><EmptyState icon={<BookOpen size={22} />} title="No classes yet" description="Create a class for a subject, then invite students by email." action={<Button onClick={openCreate} disabled={!subjects.length}><Plus size={16} /> Create your first class</Button>} /></Card>}

      <Modal open={createOpen} onClose={() => !submitting && setCreateOpen(false)} title="Create a class">
        <form className="space-y-4" onSubmit={submitClass}><Input label="Class name" required maxLength={120} placeholder="e.g. Biology Period 2" value={classForm.name} onChange={(event) => setClassForm({ ...classForm, name: event.target.value })} /><label className="block text-sm font-medium text-slate-700">Subject<select required value={classForm.subject_id} onChange={(event) => setClassForm({ ...classForm, subject_id: event.target.value })} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100">{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select></label>{classError && <p role="alert" className="text-sm text-rose-600">{classError}</p>}<div className="flex justify-end gap-2 pt-2"><Button variant="secondary" disabled={submitting} onClick={() => setCreateOpen(false)}>Cancel</Button><Button type="submit" loading={submitting}>Create class</Button></div></form>
      </Modal>

      <Modal open={Boolean(manageClass)} onClose={() => !submitting && setManageClass(null)} title={`Students · ${selectedClass?.name ?? "Class"}`} className="max-h-[90vh] overflow-y-auto">
        <form onSubmit={submitStudent} className="flex flex-col gap-2 sm:flex-row sm:items-end"><Input className="flex-1" label="Add student by email" type="email" required placeholder="student@example.com" value={studentEmail} error={studentError} onChange={(event) => { setStudentEmail(event.target.value); setStudentError(""); }} /><Button type="submit" loading={submitting}><UserPlus size={16} /> Add student</Button></form>
        <div className="mt-6"><h3 className="mb-3 text-sm font-bold text-slate-800">Enrolled students</h3>{selectedClass?.students?.length ? <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">{selectedClass.students.map((student) => <li key={student.id} className="flex items-center justify-between gap-3 px-3 py-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800">{student.email}</p><p className="mt-0.5 text-xs text-slate-500">{student.is_active ? "Active account" : "Inactive account"}</p></div><button type="button" onClick={() => setRemoveTarget(student)} aria-label={`Remove ${student.email}`} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><UserRoundX size={17} /></button></li>)}</ul> : <EmptyState icon={<Users size={21} />} title="No students enrolled" description="Add a student using their account email." />}</div>
      </Modal>

      <Modal open={Boolean(removeTarget)} onClose={() => !submitting && setRemoveTarget(null)} title="Remove student?">
        <p className="text-sm leading-6 text-slate-600">Remove <strong className="text-slate-800">{removeTarget?.email}</strong> from <strong className="text-slate-800">{selectedClass?.name}</strong>?</p><div className="mt-6 flex justify-end gap-2"><Button variant="secondary" disabled={submitting} onClick={() => setRemoveTarget(null)}>Cancel</Button><Button variant="danger" loading={submitting} onClick={confirmRemoveStudent}>Remove student</Button></div>
      </Modal>
    </div>
  );
}

function ClassSkeleton() {
  return <div className="grid gap-4 xl:grid-cols-2">{Array.from({ length: 4 }, (_, index) => <Card key={index} className="space-y-4 p-5"><Skeleton className="h-10 w-2/3" /><Skeleton className="h-5 w-1/3" /><Skeleton className="h-10 w-full" /></Card>)}</div>;
}

export default TeacherClassesPage;