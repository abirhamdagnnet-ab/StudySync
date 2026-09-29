import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, Menu, X } from "lucide-react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { Badge } from "../components/ui/index.js";
import useAuth from "../hooks/useAuth.js";
import { getRolePath } from "../routes/rolePaths.js";
import { notifySuccess } from "../utils/toast.js";
import ThemeToggle from "../components/ui/ThemeToggle.jsx";

const publicLinks = [
  { label: "Home", href: "/" },
  { label: "Features", href: "/#features" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "About", href: "/#about" },
];

function PublicLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const displayName = user?.name || user?.email?.split("@")[0] || "Account";

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) setProfileOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, []);

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    setMobileOpen(false);
    notifySuccess("You have been logged out.");
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <nav className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8" aria-label="Public navigation">
          <Link to="/" className="flex shrink-0 items-center gap-3" onClick={() => setMobileOpen(false)}>
            <img src="/studysync-logo.png" alt="" className="size-10 rounded-xl object-cover shadow-sm shadow-indigo-600/20" />
            <span className="text-base font-extrabold tracking-tight text-slate-950">StudySync</span>
          </Link>

          <div className="hidden items-center gap-7 md:flex">
            {publicLinks.map((link) => <a key={link.label} href={link.href} className="text-sm font-medium text-slate-500 transition hover:text-indigo-700">{link.label}</a>)}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            {user ? (
              <div className="relative" ref={profileRef}>
                <button type="button" onClick={() => setProfileOpen((open) => !open)} className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-slate-50" aria-haspopup="menu" aria-expanded={profileOpen}>
                  <span className="flex size-9 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold uppercase text-indigo-700">{displayName.slice(0, 2)}</span>
                  <span className="max-w-32 truncate text-sm font-semibold text-slate-700">{displayName}</span>
                  <ChevronDown size={15} className="text-slate-400" />
                </button>
                {profileOpen && <ProfileMenu user={user} onLogout={handleLogout} onNavigate={() => setProfileOpen(false)} />}
              </div>
            ) : (
              <>
                <Link to="/login" className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900">Log in</Link>
                <Link to="/register" className="inline-flex min-h-10 items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700">Get started</Link>
              </>
            )}
            <ThemeToggle className="ml-1" />
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button type="button" onClick={() => setMobileOpen((open) => !open)} className="flex size-10 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 md:hidden" aria-label={mobileOpen ? "Close menu" : "Open menu"} aria-expanded={mobileOpen}>
              {mobileOpen ? <X size={21} /> : <Menu size={21} />}
            </button>
          </div>
        </nav>

        {mobileOpen && (
          <div className="border-t border-slate-100 bg-white px-4 pb-5 pt-3 shadow-lg md:hidden">
            <nav className="flex flex-col" aria-label="Mobile navigation">
              {publicLinks.map((link) => <a key={link.label} href={link.href} onClick={() => setMobileOpen(false)} className="rounded-xl px-3 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-indigo-700">{link.label}</a>)}
            </nav>
            {user ? (
              <div className="mt-3 border-t border-slate-100 pt-3">
                <div className="flex items-center gap-2 px-3 py-2"><span className="font-semibold text-slate-800">{displayName}</span><Badge tone="indigo">{user.role}</Badge></div>
                <Link to={getRolePath(user.role)} onClick={() => setMobileOpen(false)} className="block rounded-xl px-3 py-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-50">Dashboard</Link>
                <button type="button" onClick={handleLogout} className="flex w-full items-center gap-2 rounded-xl px-3 py-3 text-left text-sm font-semibold text-slate-600 hover:bg-slate-50"><LogOut size={16} /> Log out</button>
              </div>
            ) : (
              <div className="mt-3 flex gap-2 border-t border-slate-100 pt-4">
                <Link to="/login" onClick={() => setMobileOpen(false)} className="inline-flex min-h-10 flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">Log in</Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="inline-flex min-h-10 flex-1 items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm">Get started</Link>
              </div>
            )}
          </div>
        )}
      </header>
      <Outlet />
    </div>
  );
}

function ProfileMenu({ user, onLogout, onNavigate }) {
  const displayName = user?.name || user?.email?.split("@")[0] || "Account";
  return (
    <div role="menu" className="absolute right-0 top-full z-50 mt-2 w-60 rounded-xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10">
      <div className="border-b border-slate-100 px-3 py-2.5"><p className="truncate text-sm font-bold text-slate-800">{displayName}</p><Badge tone="indigo" className="mt-1 capitalize">{user.role}</Badge></div>
      <Link role="menuitem" to={getRolePath(user.role)} onClick={onNavigate} className="mt-1 block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-indigo-700">Dashboard</Link>
      <button role="menuitem" type="button" onClick={onLogout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-rose-600"><LogOut size={15} /> Log out</button>
    </div>
  );
}

export default PublicLayout;
