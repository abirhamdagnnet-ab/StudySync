import { ArrowLeft, BookOpenCheck, Check, Sparkles, User } from "lucide-react";
import { Link } from "react-router-dom";

function AuthSplitLayout({ children, eyebrow, title, description, mode = "login" }) {
  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[1.02fr_0.98fr]">
      <section className="order-1 flex min-h-screen flex-col px-5 py-7 sm:px-8 lg:px-12 xl:px-20">
        <Link to="/" className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-indigo-700"><ArrowLeft size={16} /> Back home</Link>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <Link to="/" className="mb-8 flex w-fit items-center gap-3">
            <img src="/studysync-logo.png" alt="" className="size-10 rounded-xl object-cover" />
            <span className="font-extrabold tracking-tight text-slate-950">StudySync</span>
          </Link>
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-700">{eyebrow}</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
          <div className="mt-7">{children}</div>
        </div>
        <p className="text-center text-xs text-slate-400">Focused practice. Clear progress. Better preparation.</p>
      </section>

      <aside className="relative order-2 hidden min-h-screen overflow-hidden bg-gradient-to-br from-indigo-800 via-indigo-700 to-violet-800 px-10 py-14 text-white lg:flex lg:flex-col lg:justify-between xl:px-16">
        <div className="absolute -right-24 top-20 size-80 rounded-full border border-white/10" />
        <div className="absolute -right-8 top-36 size-48 rounded-full border border-white/10" />
        <div className="relative flex items-center gap-3 text-sm font-semibold text-indigo-100"><Sparkles size={17} /> A smarter way to prepare</div>
        <div className="relative mx-auto w-full max-w-lg py-14">
          <div className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15"><BookOpenCheck size={27} /></div>
          <h2 className="text-3xl font-extrabold leading-tight tracking-tight xl:text-4xl">Progress starts with understanding what to practice next.</h2>
          <p className="mt-4 max-w-md text-sm leading-7 text-indigo-100">StudySync turns practice into a clear path forward, with focused feedback for every learner.</p>
          <div className="mt-8 space-y-3">
            <Benefit>Practice that adapts to your answers</Benefit>
            <Benefit>Spot weak topics before exam day</Benefit>
            <Benefit>Keep students and teachers in sync</Benefit>
          </div>
          <div className="mt-9 flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
            <span className="flex size-10 items-center justify-center rounded-xl bg-white/10 text-indigo-100"><User size={19} /></span>
            <div><p className="text-sm font-bold">{mode === "register" ? "Your student workspace" : "Welcome to your workspace"}</p><p className="mt-0.5 text-xs text-indigo-100">A personal path through every topic</p></div>
          </div>
        </div>
        <p className="relative text-xs text-indigo-200">StudySync · Learn with intention</p>
      </aside>
    </main>
  );
}

function Benefit({ children }) {
  return <p className="flex items-center gap-3 text-sm text-indigo-50"><span className="flex size-6 items-center justify-center rounded-full bg-emerald-300/15 text-emerald-200"><Check size={14} /></span>{children}</p>;
}

export default AuthSplitLayout;
