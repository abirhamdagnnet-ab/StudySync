import { ArrowLeft, Compass } from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "../../components/ui/index.js";

function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md p-8 text-center shadow-md shadow-slate-900/5">
        <span className="mx-auto flex size-14 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><Compass size={26} /></span>
        <p className="mt-5 text-xs font-bold uppercase tracking-widest text-indigo-600">404 · Page not found</p>
        <h1 className="mt-2 text-2xl font-extrabold text-slate-950">This page isn’t here</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">The address may be outdated, or the page may have moved.</p>
        <Link to="/" className="mt-6 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"><ArrowLeft size={16} /> Back home</Link>
      </Card>
    </main>
  );
}

export default NotFoundPage;