import { ArrowLeft, ShieldX } from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "../../components/ui/index.js";

function ForbiddenPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md p-8 text-center shadow-md shadow-slate-900/5">
        <span className="mx-auto flex size-14 items-center justify-center rounded-xl bg-rose-50 text-rose-600"><ShieldX size={26} /></span>
        <p className="mt-5 text-xs font-bold uppercase tracking-widest text-rose-600">403 · Forbidden</p>
        <h1 className="mt-2 text-2xl font-extrabold text-slate-950">You can’t access this page</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Your account doesn’t have permission to view this section.</p>
        <Link to="/" className="mt-6 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"><ArrowLeft size={16} /> Back to home</Link>
      </Card>
    </main>
  );
}

export default ForbiddenPage;