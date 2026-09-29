import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Search, UserCheck, UserRoundX } from "lucide-react";
import { Badge, Button, Card, EmptyState, Input, Modal, Skeleton, Table } from "../../components/ui/index.js";
import { createUser, listUsers, updateUserStatus } from "../../api/admin.api.js";
import { notifyPromise } from "../../utils/toast.js";

const pageSize = 8;
const backendMessage = (error, fallback) => error.response?.data?.message || fallback;

function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", password: "", role: "teacher" });
  const [formError, setFormError] = useState("");

  const refreshUsers = async () => {
    setLoading(true);
    try {
      setUsers(await listUsers());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    listUsers()
      .then((data) => { if (mounted) setUsers(data); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const filteredUsers = useMemo(() => users.filter((user) => {
    const matchesSearch = `${user.email} ${user.role}`.toLowerCase().includes(search.trim().toLowerCase());
    return matchesSearch && (roleFilter === "all" || user.role === roleFilter);
  }), [users, search, roleFilter]);
  const pageCount = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const visibleUsers = filteredUsers.slice((page - 1) * pageSize, page * pageSize);

  const submitNewUser = async (event) => {
    event.preventDefault();
    setFormError("");
    if (newUser.password.length < 8) {
      setFormError("Password must be at least 8 characters.");
      return;
    }
    setSubmitting(true);
    try {
      await notifyPromise(createUser(newUser), {
        loading: "Creating user...",
        success: "User created successfully",
        error: (error) => backendMessage(error, "Could not create user"),
      });
      setAddOpen(false);
      setNewUser({ email: "", password: "", role: "teacher" });
      await refreshUsers();
    } catch {
      // notifyPromise displays the backend error.
    } finally {
      setSubmitting(false);
    }
  };

  const confirmStatusChange = async () => {
    if (!statusTarget) return;
    setSubmitting(true);
    try {
      await notifyPromise(updateUserStatus(statusTarget.id, !statusTarget.is_active), {
        loading: statusTarget.is_active ? "Deactivating user..." : "Activating user...",
        success: statusTarget.is_active ? "User deactivated" : "User activated",
        error: (error) => backendMessage(error, "Could not update user status"),
      });
      setStatusTarget(null);
      await refreshUsers();
    } catch {
      // notifyPromise displays the backend error.
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { key: "email", header: "User", render: (user) => <div><p className="font-semibold text-slate-800">{user.email}</p><p className="mt-1 text-xs text-slate-500">ID {user.id}</p></div> },
    { key: "role", header: "Role", render: (user) => <Badge tone={user.role === "admin" ? "violet" : user.role === "teacher" ? "indigo" : "slate"} className="capitalize">{user.role}</Badge> },
    { key: "is_active", header: "Status", render: (user) => <Badge tone={user.is_active ? "green" : "rose"}>{user.is_active ? "Active" : "Inactive"}</Badge> },
    { key: "created_at", header: "Joined", className: "hidden md:table-cell", cellClassName: "hidden md:table-cell text-slate-500", render: (user) => new Date(user.created_at).toLocaleDateString() },
    { key: "action", header: "Action", render: (user) => <button type="button" onClick={() => setStatusTarget(user)} className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold transition ${user.is_active ? "text-rose-700 hover:bg-rose-50" : "text-emerald-700 hover:bg-emerald-50"}`}><span className="sr-only">{user.is_active ? "Deactivate" : "Activate"} {user.email}</span>{user.is_active ? <UserRoundX size={16} /> : <UserCheck size={16} />}{user.is_active ? "Deactivate" : "Activate"}</button> },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Administration</p><h2 className="mt-2 text-2xl font-extrabold text-slate-950">Users</h2><p className="mt-2 text-sm text-slate-500">Manage teacher and administrator accounts.</p></div>
        <Button onClick={() => setAddOpen(true)}><Plus size={16} /> Add user</Button>
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
          <Input aria-label="Search users" placeholder="Search email or role" icon={<Search size={16} />} value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} className="flex-1" />
          <select aria-label="Filter by role" value={roleFilter} onChange={(event) => { setRoleFilter(event.target.value); setPage(1); }} className="min-h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100">
            <option value="all">All roles</option><option value="student">Students</option><option value="teacher">Teachers</option><option value="admin">Admins</option>
          </select>
          <span className="text-xs font-medium text-slate-500">{filteredUsers.length} users</span>
        </div>
        {loading ? <TableSkeleton /> : <Table columns={columns} data={visibleUsers} emptyTitle="No users match" emptyDescription="Try another search or role filter." />}
        {!loading && filteredUsers.length > 0 && <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
          <p className="text-xs text-slate-500">Page {page} of {pageCount}</p>
          <div className="flex gap-2"><Button variant="secondary" className="min-h-9 px-3" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft size={15} /> Previous</Button><Button variant="secondary" className="min-h-9 px-3" disabled={page >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>Next <ChevronRight size={15} /></Button></div>
        </div>}
      </Card>

      <Modal open={addOpen} onClose={() => !submitting && setAddOpen(false)} title="Add a user">
        <form onSubmit={submitNewUser} className="space-y-4">
          <Input label="Email address" type="email" autoComplete="email" required placeholder="teacher@example.com" value={newUser.email} onChange={(event) => setNewUser({ ...newUser, email: event.target.value })} />
          <Input label="Temporary password" type="password" autoComplete="new-password" required minLength={8} placeholder="At least 8 characters" value={newUser.password} onChange={(event) => setNewUser({ ...newUser, password: event.target.value })} error={formError} />
          <label className="block text-sm font-medium text-slate-700">Role<select value={newUser.role} onChange={(event) => setNewUser({ ...newUser, role: event.target.value })} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"><option value="teacher">Teacher</option><option value="admin">Admin</option></select></label>
          <p className="text-xs text-slate-500">The password is hashed by the server and is not returned after creation.</p>
          <div className="flex justify-end gap-2 pt-2"><Button variant="secondary" disabled={submitting} onClick={() => setAddOpen(false)}>Cancel</Button><Button type="submit" loading={submitting}>Create user</Button></div>
        </form>
      </Modal>

      <Modal open={Boolean(statusTarget)} onClose={() => !submitting && setStatusTarget(null)} title={`${statusTarget?.is_active ? "Deactivate" : "Activate"} user?`}>
        <p className="text-sm leading-6 text-slate-600">{statusTarget?.is_active ? "This user will no longer be able to sign in." : "This user will be able to sign in again."} Apply this change to <strong className="text-slate-800">{statusTarget?.email}</strong>?</p>
        <div className="mt-6 flex justify-end gap-2"><Button variant="secondary" disabled={submitting} onClick={() => setStatusTarget(null)}>Cancel</Button><Button variant={statusTarget?.is_active ? "danger" : "primary"} loading={submitting} onClick={confirmStatusChange}>{statusTarget?.is_active ? "Deactivate" : "Activate"}</Button></div>
      </Modal>
    </div>
  );
}

function TableSkeleton() {
  return <div className="space-y-4 p-5">{Array.from({ length: 6 }, (_, index) => <div key={index} className="flex items-center gap-3"><Skeleton className="h-10 flex-1" /><Skeleton className="h-7 w-20" /><Skeleton className="h-7 w-24" /></div>)}</div>;
}

export default AdminUsersPage;