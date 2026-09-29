import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Spinner } from "../components/ui/index.js";
import useAuth from "../hooks/useAuth.js";
import ProtectedRoute from "./ProtectedRoute.jsx";
import RoleRoute from "./RoleRoute.jsx";
import { getRolePath } from "./rolePaths.js";
import PublicLayout from "../layouts/PublicLayout.jsx";
import DashboardLayout from "../layouts/DashboardLayout.jsx";
import DocumentTitle from "../components/DocumentTitle.jsx";
import ForbiddenPage from "../pages/public/ForbiddenPage.jsx";

const HomePage = lazy(() => import("../pages/public/Home.jsx"));
const LoginPage = lazy(() => import("../pages/public/Login.jsx"));
const RegisterPage = lazy(() => import("../pages/public/Register.jsx"));
const StudentHome = lazy(() => import("../pages/student/StudentHome.jsx"));
const StudentSectionPage = lazy(() => import("../pages/student/StudentSectionPage.jsx"));
const StudentQuizPage = lazy(() => import("../pages/student/StudentQuizPage.jsx"));
const StudentProgressPage = lazy(() => import("../pages/student/StudentProgressPage.jsx"));
const StudentWeakTopicsPage = lazy(() => import("../pages/student/StudentWeakTopicsPage.jsx"));
const StudentAIPage = lazy(() => import("../pages/student/StudentAIPage.jsx"));
const StudentAssistantPage = lazy(() => import("../pages/student/StudentAssistantPage.jsx"));
const TeacherHome = lazy(() => import("../pages/teacher/TeacherHome.jsx"));
const TeacherSectionPage = lazy(() => import("../pages/teacher/TeacherSectionPage.jsx"));
const TeacherQuestionsPage = lazy(() => import("../pages/teacher/TeacherQuestionsPage.jsx"));
const TeacherClassesPage = lazy(() => import("../pages/teacher/TeacherClassesPage.jsx"));
const TeacherTrendsPage = lazy(() => import("../pages/teacher/TeacherTrendsPage.jsx"));
const AdminHome = lazy(() => import("../pages/admin/AdminHome.jsx"));
const AdminSectionPage = lazy(() => import("../pages/admin/AdminSectionPage.jsx"));
const AdminUsersPage = lazy(() => import("../pages/admin/AdminUsersPage.jsx"));
const AdminCatalogPage = lazy(() => import("../pages/admin/AdminCatalogPage.jsx"));
const NotFoundPage = lazy(() => import("../pages/public/NotFoundPage.jsx"));

function RouteFallback() {
  return <div className="flex min-h-screen items-center justify-center bg-slate-50"><Spinner size={28} label="Loading page" /></div>;
}

function AuthPageRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <RouteFallback />;
  return user ? <Navigate to={getRolePath(user.role)} replace /> : children;
}

function AppRoutes() {
  return (
    <>
    <DocumentTitle />
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="login" element={<AuthPageRoute><LoginPage /></AuthPageRoute>} />
          <Route path="register" element={<AuthPageRoute><RegisterPage /></AuthPageRoute>} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="403" element={<ForbiddenPage />} />
          <Route element={<RoleRoute role="student" />}>
            <Route path="student" element={<DashboardLayout />}>
              <Route index element={<StudentHome />} />
              <Route path="quiz" element={<StudentQuizPage />} />
              <Route path="learning" element={<StudentSectionPage title="My learning" description="Continue your courses and practice sessions." />} />
              <Route path="progress" element={<StudentProgressPage />} />
              <Route path="weak-topics" element={<StudentWeakTopicsPage />} />
              <Route path="ai" element={<StudentAIPage />} />
              <Route path="assistant" element={<StudentAssistantPage />} />
            </Route>
          </Route>
          <Route element={<RoleRoute role="teacher" />}>
            <Route path="teacher" element={<DashboardLayout />}>
              <Route index element={<TeacherHome />} />
              <Route path="classes" element={<TeacherClassesPage />} />
              <Route path="questions" element={<TeacherQuestionsPage />} />
              <Route path="students" element={<TeacherSectionPage title="Students" description="Review students in your classes." />} />
              <Route path="trends" element={<TeacherTrendsPage />} />
            </Route>
          </Route>
          <Route element={<RoleRoute role="admin" />}>
            <Route path="admin" element={<DashboardLayout />}>
              <Route index element={<AdminHome />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="subjects" element={<AdminCatalogPage entity="subjects" />} />
              <Route path="topics" element={<AdminCatalogPage entity="topics" />} />
              <Route path="questions" element={<AdminCatalogPage entity="questions" />} />
              <Route path="analytics" element={<AdminSectionPage title="Analytics" description="Monitor learning activity across the platform." />} />
              <Route path="settings" element={<AdminSectionPage title="Settings" description="Configure platform settings." />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
    </>
  );
}

export default AppRoutes;
