import { useEffect, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Bot,
  BrainCircuit,
  Check,
  GraduationCap,
  ShieldCheck,
  Target,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "../../components/ui/index.js";
import { getPublicStats } from "../../api/public.api.js";



const sampleFeedback = [
  { role: "Student", quote: "The practice questions help me see which topics need more work." },
  { role: "Teacher", quote: "Class trends make it easier to plan lessons around what students find difficult." },
  { role: "Student", quote: "I can review my progress and keep my study sessions focused." },
];

const publicMetrics = [
  { key: "students", label: "Active students" },
  { key: "teachers", label: "Active teachers" },
  { key: "questions", label: "Practice questions" },
  { key: "quiz_attempts", label: "Quiz attempts" },
];

const features = [
  {
    title: "Adaptive quizzes",
    description: "Practice shifts with your answers, keeping each session at the right level of challenge.",
    icon: BrainCircuit,
    tone: "bg-indigo-50 text-indigo-700",
  },
  {
    title: "Weak-topic detection",
    description: "Spot concepts that need more practice using recent results, not guesswork.",
    icon: Target,
    tone: "bg-rose-50 text-rose-700",
  },
  {
    title: "AI study assistant",
    description: "Ask focused study questions and get explanations grounded in your learning material.",
    icon: Bot,
    tone: "bg-violet-50 text-violet-700",
  },
  {
    title: "Teacher analytics",
    description: "See topic-level class trends and decide where your students need support.",
    icon: BarChart3,
    tone: "bg-emerald-50 text-emerald-700",
  },
];

const roles = [
  {
    title: "For students",
    description: "Build confidence with focused practice, clear progress, and a study plan that responds to you.",
    icon: GraduationCap,
    accent: "text-indigo-700 bg-indigo-50",
    points: ["Practice at your level", "Know what to review next", "Learn from your own notes"],
  },
  {
    title: "For teachers",
    description: "Organize classes, support learners, and spot patterns before they become roadblocks.",
    icon: Users,
    accent: "text-emerald-700 bg-emerald-50",
    points: ["Manage classes and enrollment", "Review topic accuracy", "Focus support where it matters"],
  },
  {
    title: "For administrators",
    description: "Keep the learning workspace organized with clear account and content management.",
    icon: ShieldCheck,
    accent: "text-amber-700 bg-amber-50",
    points: ["Manage platform accounts", "Maintain learning content", "Oversee platform activity"],
  },
];

function Home() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let mounted = true;
    getPublicStats()
      .then((data) => { if (mounted) setStats(data); })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  return (
    <main className="overflow-hidden bg-white text-slate-900">
      <section id="home" className="relative isolate flex min-h-[500px] scroll-mt-[72px] items-center overflow-hidden bg-slate-950 md:min-h-[580px]">
        <img
          src={`${import.meta.env.BASE_URL}hero.avif`}
          alt="Students studying together around a table"
          className="absolute inset-0 -z-20 size-full object-cover object-center"
        />
        <div className="absolute inset-0 -z-10 bg-slate-950/65" />
        <div className="mx-auto w-full max-w-7xl px-5 py-12 md:px-8 md:py-16 lg:py-20">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur-sm">
              <span className="size-1.5 rounded-full bg-indigo-300" /> Exam preparation that adapts to you
            </div>
            <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">Prepare with purpose. <span className="text-indigo-300">Walk in ready.</span></h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg sm:leading-8">StudySync helps you practice at the right level, find the topics to revisit, and turn study time into steady progress.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-950/20 transition hover:-translate-y-0.5 hover:bg-indigo-400">Get Started <ArrowRight size={16} /></Link>
              <Link to="/login" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/35 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:-translate-y-0.5 hover:bg-white/20">Login</Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-slate-200">
              <span className="inline-flex items-center gap-2"><Check size={14} className="text-emerald-300" /> Practice that adjusts as you go</span>
              <span className="inline-flex items-center gap-2"><Check size={14} className="text-emerald-300" /> Clear topic-by-topic progress</span>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="scroll-mt-24 px-5 py-16 md:px-8 md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-widest text-indigo-700">Built around your next step</p><h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">Study smarter, one topic at a time.</h2><p className="mt-4 text-sm leading-6 text-slate-600">A focused toolkit for learners and the people who help them succeed.</p></div>
          <div className="mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {features.map(({ title, description, icon: Icon, tone }) => (
              <Card key={title} className="group h-full p-5 transition duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-950/5">
                <span className={`flex size-11 items-center justify-center rounded-xl ${tone}`}><Icon size={21} /></span>
                <h3 className="mt-5 text-base font-bold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
                <span className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 opacity-0 transition group-hover:opacity-100">Explore <ArrowRight size={13} /></span>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-24 border-y border-slate-200 bg-slate-50 px-5 py-16 md:px-8 md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-widest text-indigo-700">How it works</p><h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">A simple loop. Better preparation.</h2></div>
          <div className="mt-9 grid gap-4 md:grid-cols-3">
            <Step number="01" title="Choose a topic" description="Start with a subject or focus on a specific concept you want to strengthen." />
            <Step number="02" title="Practice and learn" description="Answer adaptive questions and get clear feedback while the material is fresh." />
            <Step number="03" title="Review what matters" description="Use your progress and weak-topic insights to plan your next study session." />
          </div>
        </div>
      </section>

      <section id="about" className="scroll-mt-24 px-5 py-16 md:px-8 md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-widest text-indigo-700">Made for every role</p><h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">One platform, shared progress.</h2><p className="mt-4 text-sm leading-6 text-slate-600">Give every person in the learning community the tools that fit their work.</p></div>
          <div className="mt-9 grid gap-4 lg:grid-cols-3">
            {roles.map(({ title, description, icon: Icon, accent, points }) => (
              <Card key={title} className="p-6 transition duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-900/5">
                <span className={`flex size-11 items-center justify-center rounded-xl ${accent}`}><Icon size={21} /></span>
                <h3 className="mt-5 text-lg font-bold text-slate-900">{title}</h3>
                <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">{description}</p>
                <ul className="mt-5 space-y-3 border-t border-slate-100 pt-5">
                  {points.map((point) => <li key={point} className="flex items-start gap-2.5 text-sm text-slate-600"><Check size={16} className="mt-0.5 shrink-0 text-emerald-600" />{point}</li>)}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-16 md:px-8 md:pb-20">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-xl bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-600 px-6 py-10 text-white shadow-xl shadow-indigo-950/10 sm:px-10 md:flex md:items-center md:justify-between md:gap-8 md:py-12">
          <div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-widest text-indigo-100">Your next session starts here</p><h2 className="mt-3 text-2xl font-extrabold sm:text-3xl">Make your preparation count.</h2><p className="mt-3 text-sm leading-6 text-indigo-100">Build a study rhythm that helps you feel ready for what’s next.</p></div>
          <Link to="/register" className="mt-6 inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-indigo-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-indigo-50 md:mt-0">Get Started <ArrowRight size={16} /></Link>
        </div>
      </section>

      <section className="relative isolate overflow-hidden bg-slate-950 px-5 py-16 md:px-8 md:py-20">
        <img src={`${import.meta.env.BASE_URL}hero.avif`} alt="" aria-hidden="true" className="absolute inset-0 -z-20 size-full object-cover object-center" />
        <div className="absolute inset-0 -z-10 bg-indigo-950/85" />
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center text-white">
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-200">The StudySync community</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Built to make every study session count.</h2>
            <p className="mt-4 text-sm leading-6 text-indigo-100">Sample feedback from the kinds of learners and educators StudySync is designed to support.</p>
          </div>

          <div className="mt-9 grid gap-4 md:grid-cols-3">
            {sampleFeedback.map(({ role, quote }) => (
              <article key={quote} className="rounded-xl border border-white/15 bg-white/10 p-6 text-white backdrop-blur-sm">
                <span className="text-3xl leading-none text-cyan-300" aria-hidden="true">“</span>
                <blockquote className="mt-2 text-sm leading-6 text-indigo-50">{quote}</blockquote>
                <p className="mt-5 text-xs font-bold uppercase tracking-wider text-cyan-200">Sample {role} feedback</p>
              </article>
            ))}
          </div>

          <div className="mt-12 grid grid-cols-2 gap-6 border-t border-white/20 pt-8 md:grid-cols-4 md:gap-4">
            {publicMetrics.map(({ key, label }) => (
              <div key={key} className="text-center text-white">
                <p className="text-3xl font-extrabold tabular-nums sm:text-4xl">{stats ? Number(stats[key]).toLocaleString() : "—"}</p>
                <p className="mt-2 text-xs font-medium text-indigo-100 sm:text-sm">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-slate-100 px-5 py-7 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <Link to="/" className="inline-flex items-center gap-2.5"><img src={`${import.meta.env.BASE_URL}studysync-logo.png`} alt="" className="size-8 rounded-lg object-cover" /><span className="text-sm font-extrabold text-slate-900">StudySync</span></Link>
          <p className="text-xs text-slate-500">Adaptive preparation for confident learners.</p>
          <div className="flex gap-5 text-xs font-semibold text-slate-500"><Link to="/login" className="hover:text-indigo-700">Login</Link><Link to="/register" className="hover:text-indigo-700">Get Started</Link></div>
        </div>
      </footer>
    </main>
  );
}

function Step({ number, title, description }) {
  return <Card className="p-6 transition duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-900/5"><span className="text-xs font-extrabold tracking-widest text-indigo-600">STEP {number}</span><h3 className="mt-4 text-lg font-bold text-slate-900">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{description}</p></Card>;
}

export default Home;
