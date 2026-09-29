import { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  BookOpen,
  Bot,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Users,
  X,
} from "lucide-react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Badge } from "../components/ui/index.js";
import useAuth from "../hooks/useAuth.js";
import { notifySuccess } from "../utils/toast.js";
import ThemeToggle from "../components/ui/ThemeToggle.jsx";

const roleNavigation = {
  student: [
    { label: "Dashboard", path: "/student", icon: LayoutDashboard, end: true },
    { label: "Start quiz", path: "/student/quiz", icon: CircleHelp },
    { label: "My learning", path: "/student/learning", icon: BookOpen },
    { label: "Progress", path: "/student/progress", icon: BarChart3 },
    { label: "Weak topics", path: "/student/weak-topics", icon: CircleHelp },
    { label: "AI study assistant", path: "/student/assistant", icon: Bot },
  ],
  teacher: [
    { label: "Dashboard", path: "/teacher", icon: LayoutDashboard, end: true },
    { label: "Classes", path: "/teacher/classes", icon: Users },
    { label: "Questions", path: "/teacher/questions", icon: CircleHelp },
    { label: "Students", path: "/teacher/students", icon: GraduationCap },
    { label: "Class trends", path: "/teacher/trends", icon: BarChart3 },
  ],
  admin: [
    { label: "Dashboard", path: "/admin", icon: LayoutDashboard, end: true },
    { label: "Users", path: "/admin/users", icon: Users },
    { label: "Subjects", path: "/admin/subjects", icon: BookOpen },
    { label: "Questions", path: "/admin/questions", icon: FileText },
    { label: "Analytics", path: "/admin/analytics", icon: BarChart3 },
    { label: "Settings", path: "/admin/settings", icon: Settings },
  ],
};

function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const links = roleNavigation[user?.role] ?? [];
  const activeLink = useMemo(
    () => links.find((link) => link.end ? location.pathname === link.path : location.pathname.startsWith(link.path)),
    [links, location.pathname],
  );
  const title = activeLink?.label ?? "Workspace";
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
    notifySuccess("You have been logged out.");
    navigate("/login", { replace: true });
  };

  const sidebarWidth = collapsed ? "lg:w-[76px]" : "lg:w-64";
  const contentOffset = collapsed ? "lg:ml-[76px]" : "lg:ml-64";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {mobileOpen && <button type="button" aria-label="Close navigation" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-30 bg-slate-950/30 lg:hidden" />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-[width,transform] duration-200 ${sidebarWidth} ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className={`flex h-[72px] shrink-0 items-center border-b border-slate-100 ${collapsed ? "justify-center px-2" : "justify-between px-5"}`}>
          <NavLink to={`/${user?.role}`} onClick={() => setMobileOpen(false)} className="flex min-w-0 items-center gap-3">
            <img src="/studysync-logo.png" alt="" className="size-9 shrink-0 rounded-xl object-cover" />
            {!collapsed && <span className="truncate text-base font-extrabold tracking-tight text-slate-900">StudySync</span>}
          </NavLink>
          <button type="button" onClick={() => setMobileOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden" aria-label="Close menu"><X size={19} /></button>
        </div>

        <div className={`flex items-center justify-between pt-6 ${collapsed ? "px-2" : "px-5"}`}>
          {!collapsed && <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{user?.role} workspace</p>}
          <button type="button" onClick={() => setCollapsed((value) => !value)} className="hidden rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:inline-flex" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
            {collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
          </button>
        </div>

        <nav className={`mt-3 flex-1 space-y-1 overflow-y-auto ${collapsed ? "px-2" : "px-3"}`} aria-label={`${user?.role} navigation`}>
          {links.map(({ label, path, icon: Icon, end }) => (
            <NavLink
              key={path}
              to={path}
              end={end}
              title={collapsed ? label : undefined}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition ${collapsed ? "justify-center px-0" : ""} ${isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {!collapsed && <div className="border-t border-slate-100 p-4">
          <div className="rounded-xl bg-indigo-50/80 p-4"><span className="text-xs font-bold text-indigo-800">Keep learning</span><p className="mt-1 text-xs leading-5 text-slate-600">Small daily steps make a lasting difference.</p></div>
          <button type="button" onClick={handleLogout} className="mt-3 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-rose-50 hover:text-rose-700"><LogOut size={17} /> Log out</button>
        </div>}
      </aside>

      <div className={`min-w-0 transition-[margin] duration-200 ${contentOffset}`}>
        <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" onClick={() => setMobileOpen(true)} className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Open navigation"><Menu size={20} /></button>
            <div className="min-w-0"><h1 className="truncate text-base font-bold text-slate-900">{title}</h1></div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <div className="relative" ref={profileRef}>
              <button type="button" onClick={() => setProfileOpen((open) => !open)} className="flex items-center gap-2 rounded-xl p-1.5 pr-2 transition hover:bg-slate-50" aria-haspopup="menu" aria-expanded={profileOpen}>
                <span className="flex size-9 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold uppercase text-indigo-700">{displayName.slice(0, 2)}</span>
                <span className="hidden max-w-36 text-left sm:block"><span className="block truncate text-xs font-bold text-slate-800">{displayName}</span><span className="block text-[10px] capitalize text-slate-500">{user?.role}</span></span>
                <ChevronDown size={15} className="hidden text-slate-400 sm:block" />
              </button>
              {profileOpen && <div role="menu" className="absolute right-0 top-full z-50 mt-2 w-60 rounded-xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10">
                <div className="border-b border-slate-100 px-3 py-2.5"><p className="truncate text-sm font-bold text-slate-800">{user?.email}</p><Badge tone="indigo" className="mt-1 capitalize">{user?.role}</Badge></div>
                <NavLink role="menuitem" to={`/${user?.role}`} onClick={() => setProfileOpen(false)} className="mt-1 block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Dashboard</NavLink>
                <button role="menuitem" type="button" onClick={handleLogout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-700"><LogOut size={15} /> Log out</button>
              </div>}
            </div>
            <ThemeToggle className="shrink-0" />
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8"><Outlet /></main>
      </div>
    </div>
  );
}

export default DashboardLayout;
