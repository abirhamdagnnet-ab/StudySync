import { Component } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";

class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Frontend rendering error:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
          <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <AlertTriangle className="mx-auto text-amber-500" size={28} />
            <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">This page ran into a problem</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">Try again, or return to your dashboard.</p>
            <button type="button" onClick={() => this.setState({ hasError: false })} className="mt-5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">Try again</button>
            <Link to="/" className="ml-3 inline-flex rounded-xl px-4 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-slate-800">Go home</Link>
          </section>
        </main>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
